import SwiftUI
import JellyfinAPI

enum ShelfLayout {
    case poster
    case landscape
}

/// A titled horizontal row of cards, edge-to-edge scrolling with page-aligned snapping.
struct Shelf: View {
    let title: String
    let items: [BaseItem]
    var layout: ShelfLayout = .poster
    var showsSeriesName = false
    var seeAll: Route? = nil

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            SectionHeader(title: title, seeAll: seeAll)
                .padding(.horizontal, Metrics.horizontalInset)

            ScrollView(.horizontal) {
                LazyHStack(alignment: .top, spacing: Metrics.shelfSpacing) {
                    ForEach(items) { item in
                        switch layout {
                        case .poster:
                            PosterCard(item: item, showsSeriesName: showsSeriesName)
                        case .landscape:
                            LandscapeCard(item: item)
                        }
                    }
                }
                .scrollTargetLayout()
                .padding(.vertical, Metrics.shelfLift)
            }
            .scrollTargetBehavior(.viewAligned)
            .scrollIndicators(.hidden)
            .scrollClipDisabled()
            .contentMargins(.horizontal, Metrics.horizontalInset, for: .scrollContent)
            .padding(.vertical, -Metrics.shelfLift)
        }
    }
}

struct SectionHeader: View {
    let title: String
    var seeAll: Route? = nil

    var body: some View {
        HStack(alignment: .firstTextBaseline) {
            Text(title)
                .font(.title3.weight(.semibold))
            Spacer()
            if let seeAll {
                NavigationLink(value: seeAll) {
                    Text("See All")
                        .font(.subheadline)
                }
                #if os(tvOS)
                .buttonStyle(.plain)
                #endif
            }
        }
        .accessibilityAddTraits(.isHeader)
    }
}
