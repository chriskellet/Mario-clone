import SwiftUI
import JellyfinAPI

/// Full-bleed backdrop that fades into the page background, Apple TV app style.
struct BackdropHeader: View {
    let item: BaseItem
    var height: CGFloat = Metrics.backdropHeight

    @Environment(ActiveSession.self) private var session
    @Environment(\.displayScale) private var displayScale

    var body: some View {
        RemoteImage(url: session.images.backdrop(for: item, maxWidth: Int(1920 * min(displayScale, 2))))
            .frame(height: height)
            .frame(maxWidth: .infinity)
            .overlay {
                // A background-coloured fade built from the system background style so it
                // matches light and dark on iOS and the tvOS canvas without hard-coded colours.
                Rectangle()
                    .fill(.background)
                    .mask {
                        LinearGradient(
                            stops: [
                                .init(color: .clear, location: 0.3),
                                .init(color: .black.opacity(0.85), location: 0.85),
                                .init(color: .black, location: 1),
                            ],
                            startPoint: .top,
                            endPoint: .bottom
                        )
                    }
            }
            .accessibilityHidden(true)
    }
}
