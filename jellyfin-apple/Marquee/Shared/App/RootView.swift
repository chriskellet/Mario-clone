import SwiftUI

/// Chooses between onboarding and the signed-in experience, and hosts the video player.
struct RootView: View {
    @Environment(AppSession.self) private var appSession
    @Environment(PlaybackCoordinator.self) private var playback

    var body: some View {
        Group {
            switch appSession.state {
            case .restoring:
                ProgressView()
            case .signedOut:
                OnboardingFlow()
            case .signedIn(let session):
                MainTabView()
                    .environment(session)
                    .background {
                        PlayerHost(request: playback.request, session: session) {
                            playback.finish()
                        }
                        .frame(width: 0, height: 0)
                    }
            }
        }
        .animation(.default, value: appSession.state.isSignedIn)
    }
}
