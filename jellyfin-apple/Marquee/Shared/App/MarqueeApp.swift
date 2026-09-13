import SwiftUI
import AVFoundation

@main
struct MarqueeApp: App {
    @State private var appSession = AppSession()
    @State private var playback = PlaybackCoordinator()

    init() {
        AudioSessionConfigurator.configureForPlayback()
    }

    var body: some Scene {
        WindowGroup {
            RootView()
                .environment(appSession)
                .environment(playback)
                .task { await appSession.restore() }
        }
    }
}

enum AudioSessionConfigurator {
    /// Lets video keep playing with the ringer switch off and enables Picture in Picture.
    static func configureForPlayback() {
        do {
            try AVAudioSession.sharedInstance().setCategory(.playback, mode: .moviePlayback)
        } catch {
            // Non-fatal: playback still works, just without background audio.
        }
    }
}
