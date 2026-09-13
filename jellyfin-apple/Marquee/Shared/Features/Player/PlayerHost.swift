import SwiftUI
import AVKit

/// Zero-size bridge that presents the system player modally when a request appears.
/// Presenting from UIKit gives the native Done button (iOS) and Menu-to-dismiss (tvOS) for free.
struct PlayerHost: UIViewControllerRepresentable {
    let request: PlaybackRequest?
    let session: ActiveSession
    let onFinished: @MainActor () -> Void

    func makeUIViewController(context: Context) -> PlayerHostController {
        PlayerHostController()
    }

    func updateUIViewController(_ controller: PlayerHostController, context: Context) {
        controller.onFinished = onFinished
        if let request {
            controller.present(request, session: session)
        }
    }
}

@MainActor
final class PlayerHostController: UIViewController, AVPlayerViewControllerDelegate {
    var onFinished: (@MainActor () -> Void)?

    private var currentRequestID: UUID?
    private var playback: PlaybackSession?
    /// Held strongly: once Picture in Picture dismisses the controller, UIKit no longer
    /// retains it, and a deallocated controller can never restore its full-screen UI.
    private var playerController: PlayerViewController?
    private var isInPictureInPicture = false

    func present(_ request: PlaybackRequest, session: ActiveSession) {
        guard request.id != currentRequestID else { return }
        currentRequestID = request.id

        let controller = PlayerViewController()
        controller.modalPresentationStyle = .fullScreen
        controller.delegate = self
        controller.onDismissed = { [weak self] in self?.playerWasDismissed() }
        playerController = controller

        let playback = PlaybackSession(request: request, service: session.playback, images: session.images)
        playback.onPlayedToEnd = { [weak controller] in
            controller?.dismiss(animated: true)
        }
        self.playback = playback

        present(controller, animated: true)
        Task { [weak self] in
            do {
                let player = try await playback.start()
                controller.player = player
                player.play()
            } catch is CancellationError {
                // Dismissed before the stream was ready; the session already reported itself stopped.
            } catch {
                self?.showFailure(error, on: controller)
            }
        }
    }

    private func playerWasDismissed() {
        guard !isInPictureInPicture else { return }
        tearDown()
    }

    private func tearDown() {
        playback?.stop()
        playback = nil
        playerController = nil
        currentRequestID = nil
        onFinished?()
    }

    private func showFailure(_ error: any Error, on controller: UIViewController) {
        let alert = UIAlertController(
            title: String(localized: "Can't Play"),
            message: error.localizedDescription,
            preferredStyle: .alert
        )
        alert.addAction(UIAlertAction(title: String(localized: "OK"), style: .default) { _ in
            controller.dismiss(animated: true)
        })
        controller.present(alert, animated: true)
    }

    // MARK: Picture in Picture

    // TODO: confirm against the SDK which of these delegate callbacks exist on tvOS
    // (`…ShouldAutomaticallyDismissAtPictureInPictureStart` is iOS-only) and that
    // `AVPlayerViewControllerDelegate` is main-actor annotated, so these main-actor
    // methods satisfy it under strict concurrency without `nonisolated` shims.
    #if os(iOS)
    func playerViewControllerShouldAutomaticallyDismissAtPictureInPictureStart(_ playerViewController: AVPlayerViewController) -> Bool {
        true
    }
    #endif

    func playerViewControllerWillStartPictureInPicture(_ playerViewController: AVPlayerViewController) {
        isInPictureInPicture = true
    }

    func playerViewControllerDidStopPictureInPicture(_ playerViewController: AVPlayerViewController) {
        isInPictureInPicture = false
        if playerViewController.presentingViewController == nil {
            tearDown()
        }
    }

    func playerViewController(
        _ playerViewController: AVPlayerViewController,
        restoreUserInterfaceForPictureInPictureStopWithCompletionHandler completionHandler: @escaping (Bool) -> Void
    ) {
        present(playerViewController, animated: true) {
            completionHandler(true)
        }
    }
}

/// Reports its own dismissal so the host can end the playback session exactly once.
final class PlayerViewController: AVPlayerViewController {
    var onDismissed: (@MainActor () -> Void)?

    override func viewDidDisappear(_ animated: Bool) {
        super.viewDidDisappear(animated)
        if isBeingDismissed || presentingViewController == nil {
            onDismissed?()
        }
    }
}
