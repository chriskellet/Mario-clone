import SwiftUI
import JellyfinAPI

/// Play / Resume pair. Resume is primary when there's progress; "Start Over" sits beside it.
struct PlayButtons: View {
    let item: BaseItem
    @Environment(PlaybackCoordinator.self) private var playback

    var body: some View {
        HStack(spacing: 12) {
            Button {
                playback.play(item, resume: true)
            } label: {
                Label(primaryTitle, systemImage: "play.fill")
                    .frame(minWidth: 140)
            }
            .buttonStyle(.borderedProminent)

            if item.canResume {
                Button {
                    playback.play(item, resume: false)
                } label: {
                    Label("Start Over", systemImage: "arrow.counterclockwise")
                }
                .buttonStyle(.bordered)
            }
        }
        #if os(iOS)
        .controlSize(.large)
        #endif
    }

    private var primaryTitle: String {
        if item.canResume {
            if let remaining = Formatters.timeRemaining(item: item) {
                return String(localized: "Resume · \(remaining)")
            }
            return String(localized: "Resume")
        }
        return String(localized: "Play")
    }
}
