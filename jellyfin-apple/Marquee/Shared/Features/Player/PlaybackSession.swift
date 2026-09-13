import AVFoundation
import Foundation
import JellyfinAPI

/// One playback of one item: resolves the stream, owns the `AVPlayer`, and keeps the
/// server informed (started / progress every 10 s / paused / stopped).
@MainActor
final class PlaybackSession {
    var onPlayedToEnd: (@MainActor () -> Void)?

    private let request: PlaybackRequest
    private let service: any PlaybackServicing
    private let images: ImageURLBuilder

    private var prepared: PreparedPlayback?
    private var player: AVPlayer?
    private var timeObserver: Any?
    private var endObserver: (any NSObjectProtocol)?
    private var lastReportedPaused = false
    private var lastProgressReport = Date.distantPast
    private var stopped = false

    private static let progressInterval: TimeInterval = 10

    init(request: PlaybackRequest, service: any PlaybackServicing, images: ImageURLBuilder) {
        self.request = request
        self.service = service
        self.images = images
    }

    func start() async throws -> AVPlayer {
        let prepared = try await service.prepare(item: request.item, startTicks: request.startTicks)
        self.prepared = prepared

        let asset = AVURLAsset(url: prepared.stream.url)
        let playerItem = AVPlayerItem(asset: asset)
        playerItem.externalMetadata = PlayerMetadata.items(for: prepared.item)
        let player = AVPlayer(playerItem: playerItem)
        player.allowsExternalPlayback = true
        self.player = player

        // Direct streams seek locally; transcodes already start at the offset server-side.
        if prepared.stream.playMethod != .transcode, prepared.startTicks > 0 {
            let target = CMTime(seconds: Ticks.seconds(prepared.startTicks), preferredTimescale: 600)
            _ = await player.seek(to: target, toleranceBefore: .zero, toleranceAfter: .positiveInfinity)
        }

        installObservers(on: player, item: playerItem)
        await service.reportStarted(prepared, positionTicks: prepared.startTicks)
        Task { await self.attachArtwork(to: playerItem, item: prepared.item) }
        return player
    }

    func stop() {
        guard !stopped else { return }
        stopped = true
        let position = currentPositionTicks
        removeObservers()
        player?.pause()
        guard let prepared else { return }
        let service = self.service
        Task { await service.reportStopped(prepared, positionTicks: position) }
    }

    // MARK: Position

    private var positionOffsetTicks: Int64 {
        prepared?.stream.playMethod == .transcode ? (prepared?.startTicks ?? 0) : 0
    }

    private var currentPositionTicks: Int64 {
        guard let player else { return request.startTicks }
        let seconds = player.currentTime().seconds
        return positionOffsetTicks + Ticks.from(seconds: seconds.isFinite ? seconds : 0)
    }

    // MARK: Observers

    private func installObservers(on player: AVPlayer, item: AVPlayerItem) {
        let interval = CMTime(seconds: 1, preferredTimescale: 10)
        timeObserver = player.addPeriodicTimeObserver(forInterval: interval, queue: .main) { [weak self] _ in
            MainActor.assumeIsolated { self?.tick() }
        }
        endObserver = NotificationCenter.default.addObserver(
            forName: AVPlayerItem.didPlayToEndTimeNotification,
            object: item,
            queue: .main
        ) { [weak self] _ in
            MainActor.assumeIsolated { self?.didPlayToEnd() }
        }
    }

    private func removeObservers() {
        if let timeObserver {
            player?.removeTimeObserver(timeObserver)
            self.timeObserver = nil
        }
        if let endObserver {
            NotificationCenter.default.removeObserver(endObserver)
            self.endObserver = nil
        }
    }

    private func tick() {
        guard !stopped, let player, let prepared else { return }
        let isPaused = player.rate == 0
        let now = Date()
        let stateChanged = isPaused != lastReportedPaused
        guard stateChanged || now.timeIntervalSince(lastProgressReport) >= Self.progressInterval else { return }
        lastReportedPaused = isPaused
        lastProgressReport = now
        let position = currentPositionTicks
        let service = self.service
        Task { await service.reportProgress(prepared, positionTicks: position, isPaused: isPaused) }
    }

    private func didPlayToEnd() {
        guard !stopped, let prepared else { return }
        stopped = true
        removeObservers()
        // Report the full runtime so the server marks the item as played.
        let position = prepared.item.runTimeTicks ?? currentPositionTicks
        let service = self.service
        Task { await service.reportStopped(prepared, positionTicks: position) }
        onPlayedToEnd?()
    }

    // MARK: Metadata

    private func attachArtwork(to playerItem: AVPlayerItem, item: BaseItem) async {
        guard let url = images.poster(for: item, maxWidth: 600) ?? images.landscape(for: item, maxWidth: 800),
              let image = try? await ImageLoader.shared.image(for: url),
              let data = image.jpegData(compressionQuality: 0.85),
              let artwork = PlayerMetadata.artwork(data) else { return }
        playerItem.externalMetadata.append(artwork)
    }
}
