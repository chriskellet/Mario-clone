import Foundation
import Observation
import JellyfinAPI

@MainActor
@Observable
final class HomeModel {
    struct HomeSection: Identifiable {
        let id: String
        let title: String
        let items: [BaseItem]
        let layout: ShelfLayout
        var showsSeriesName = false
        var seeAll: Route? = nil
    }

    private(set) var state: LoadState<[HomeSection]> = .idle

    /// Loads every shelf concurrently. A single failing shelf is dropped, not fatal.
    func load(using library: any LibraryServicing) async {
        if case .idle = state { state = .loading }

        async let resume = Self.attempt { try await library.resume() }
        async let nextUp = Self.attempt { try await library.nextUp(seriesID: nil) }
        async let views = Self.attempt { try await library.views() }

        var sections: [HomeSection] = []
        if let resume = await resume, !resume.isEmpty {
            sections.append(HomeSection(id: "resume", title: String(localized: "Continue Watching"), items: resume, layout: .landscape))
        }
        if let nextUp = await nextUp, !nextUp.isEmpty {
            sections.append(HomeSection(id: "nextUp", title: String(localized: "Next Up"), items: nextUp, layout: .landscape))
        }

        let libraries = (await views ?? []).filter { $0.collectionType?.supportsLatestShelf == true }
        let latest = await withTaskGroup(of: (Int, [BaseItem]).self) { group in
            for (index, view) in libraries.enumerated() {
                group.addTask {
                    let items = await Self.attempt { try await library.latest(in: view) } ?? []
                    return (index, items)
                }
            }
            var results: [Int: [BaseItem]] = [:]
            for await (index, items) in group {
                results[index] = items
            }
            return results
        }
        for (index, view) in libraries.enumerated() {
            guard let items = latest[index], !items.isEmpty else { continue }
            sections.append(HomeSection(
                id: "latest-\(view.id)",
                title: String(localized: "Recently Added in \(view.name)"),
                items: items,
                layout: .poster,
                seeAll: .library(view)
            ))
        }

        if sections.isEmpty, await views == nil {
            state = .failed(JellyfinError.transport(underlying: "No shelves loaded"))
        } else {
            state = .loaded(sections)
        }
    }

    private static func attempt<T: Sendable>(_ work: @Sendable () async throws -> T) async -> T? {
        try? await work()
    }
}

extension CollectionType {
    var supportsLatestShelf: Bool {
        switch self {
        case .movies, .tvShows, .homeVideos: return true
        default: return false
        }
    }

    /// Libraries the app can browse today. TODO: music, photos, books and Live TV.
    var isBrowsable: Bool {
        switch self {
        case .movies, .tvShows, .homeVideos, .boxSets, .folders, .unknown: return true
        default: return false
        }
    }
}
