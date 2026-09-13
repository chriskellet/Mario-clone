import SwiftUI
import JellyfinAPI

/// Portrait poster with title beneath. The artwork is the focus target on tvOS.
struct PosterCard: View {
    let item: BaseItem
    /// Fixed width for shelves; nil lets a grid cell decide.
    var width: CGFloat? = Metrics.posterWidth
    var showsSeriesName = false

    @Environment(ActiveSession.self) private var session
    @Environment(\.displayScale) private var displayScale

    var body: some View {
        CardLink(route: .item(item), width: width, title: title, subtitle: subtitle) {
            RemoteImage(url: session.images.poster(for: item, maxWidth: Int((width ?? Metrics.posterWidth * 1.5) * displayScale)))
                .aspectRatio(Metrics.posterAspect, contentMode: .fit)
                .overlay(alignment: .bottom) { ProgressStrip(item: item) }
                .overlay(alignment: .topTrailing) { UnplayedBadge(item: item) }
        }
        .accessibilityLabel(accessibilityText)
    }

    private var title: String {
        showsSeriesName ? (item.seriesName ?? item.name) : item.name
    }

    private var subtitle: String? {
        if showsSeriesName, item.type == .episode { return item.episodeCode }
        return Formatters.year(item)
    }

    private var accessibilityText: String {
        [title, subtitle].compactMap { $0 }.joined(separator: ", ")
    }
}

/// Wide 16:9 card for episodes and continue-watching shelves.
struct LandscapeCard: View {
    let item: BaseItem
    var width: CGFloat? = Metrics.landscapeWidth

    @Environment(ActiveSession.self) private var session
    @Environment(\.displayScale) private var displayScale

    var body: some View {
        CardLink(route: .item(item), width: width, title: title, subtitle: subtitle) {
            RemoteImage(url: session.images.landscape(for: item, maxWidth: Int((width ?? Metrics.landscapeWidth * 1.5) * displayScale)))
                .aspectRatio(Metrics.landscapeAspect, contentMode: .fit)
                .overlay(alignment: .bottom) { ProgressStrip(item: item) }
        }
        .accessibilityLabel([title, subtitle].compactMap { $0 }.joined(separator: ", "))
    }

    private var title: String {
        item.type == .episode ? (item.seriesName ?? item.name) : item.name
    }

    private var subtitle: String? {
        if item.type == .episode {
            return [item.episodeCode, item.name].compactMap { $0 }.joined(separator: " · ")
        }
        return Formatters.timeRemaining(item: item) ?? Formatters.year(item)
    }
}

/// Library tile: wide artwork with the library name over a gradient.
struct LibraryCard: View {
    let library: BaseItem
    var width: CGFloat? = Metrics.landscapeWidth

    @Environment(ActiveSession.self) private var session
    @Environment(\.displayScale) private var displayScale

    var body: some View {
        NavigationLink(value: Route.library(library)) {
            RemoteImage(url: session.images.poster(for: library, maxWidth: Int((width ?? Metrics.landscapeWidth * 1.5) * displayScale)))
                .aspectRatio(Metrics.landscapeAspect, contentMode: .fit)
                .overlay(alignment: .bottomLeading) {
                    Text(library.name)
                        .font(.headline)
                        .foregroundStyle(.white)
                        .padding(12)
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .background {
                            LinearGradient(colors: [.clear, .black.opacity(0.7)], startPoint: .top, endPoint: .bottom)
                        }
                }
                .clipShape(.rect(cornerRadius: Metrics.cornerRadius))
        }
        .cardButtonStyle()
        .frame(width: width)
        .accessibilityLabel(library.name)
    }
}

/// Shared chrome for cards: artwork as the link (and focus target), text below.
struct CardLink<Artwork: View>: View {
    let route: Route
    let width: CGFloat?
    let title: String
    let subtitle: String?
    @ViewBuilder let artwork: () -> Artwork

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            NavigationLink(value: route) {
                artwork()
                    .clipShape(.rect(cornerRadius: Metrics.cornerRadius))
            }
            .cardButtonStyle()

            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.subheadline.weight(.medium))
                    .lineLimit(1)
                if let subtitle {
                    Text(subtitle)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .lineLimit(1)
                }
            }
            #if os(tvOS)
            .padding(.horizontal, 8)
            #endif
        }
        .frame(width: width, alignment: .leading)
        .frame(maxWidth: width == nil ? .infinity : nil, alignment: .leading)
    }
}

extension View {
    /// tvOS gets the system parallax card; iOS gets a plain tappable card.
    @ViewBuilder
    func cardButtonStyle() -> some View {
        #if os(tvOS)
        self.buttonStyle(.card)
        #else
        self.buttonStyle(.plain)
        #endif
    }
}

struct ProgressStrip: View {
    let item: BaseItem

    var body: some View {
        if let fraction = item.userData?.resumeFraction(runTimeTicks: item.runTimeTicks) {
            GeometryReader { proxy in
                ZStack(alignment: .leading) {
                    Rectangle().fill(.white.opacity(0.35))
                    Rectangle().fill(.tint).frame(width: proxy.size.width * fraction)
                }
            }
            .frame(height: 4)
            .accessibilityHidden(true)
        }
    }
}

struct UnplayedBadge: View {
    let item: BaseItem

    var body: some View {
        if let count = item.userData?.unplayedItemCount, count > 0, item.type == .series || item.type == .season {
            Text(count, format: .number)
                .font(.caption2.weight(.semibold))
                .padding(.horizontal, 7)
                .padding(.vertical, 3)
                .background(.tint, in: .capsule)
                .foregroundStyle(.white)
                .padding(6)
        } else if item.isPlayed, item.type == .movie || item.type == .episode {
            Image(systemName: "checkmark.circle.fill")
                .font(.caption)
                .foregroundStyle(.white, .tint)
                .padding(6)
        }
    }
}
