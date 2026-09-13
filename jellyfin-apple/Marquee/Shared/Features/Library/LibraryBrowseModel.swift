import Foundation
import Observation
import JellyfinAPI

/// What a browse screen is showing: a whole library, a container (box set, folder), or a person's credits.
enum BrowseScope: Hashable {
    case library(BaseItem)
    case container(BaseItem)
    case person(Person)

    var title: String {
        switch self {
        case .library(let item), .container(let item): return item.name
        case .person(let person): return person.name
        }
    }
}

@MainActor
@Observable
final class LibraryBrowseModel {
    /// Everything that changes the query. The view reloads whenever this changes.
    struct Criteria: Hashable {
        var sort: SortBy
        var order: SortOrder
        var unplayedOnly = false
        var favoritesOnly = false
    }

    let scope: BrowseScope
    var criteria: Criteria

    private(set) var items: [BaseItem] = []
    private(set) var totalCount: Int?
    private(set) var state: LoadState<Void> = .idle
    private(set) var isLoadingMore = false

    private let pageSize = 60
    private var generation = 0

    init(scope: BrowseScope) {
        self.scope = scope
        switch scope {
        case .container:
            criteria = Criteria(sort: .premiereDate, order: .ascending)
        case .person:
            criteria = Criteria(sort: .premiereDate, order: .descending)
        case .library:
            criteria = Criteria(sort: .sortName, order: .ascending)
        }
    }

    var hasMore: Bool {
        guard let totalCount else { return false }
        return items.count < totalCount
    }

    var sortOptions: [SortBy] {
        [.sortName, .dateCreated, .premiereDate, .communityRating, .runtime, .random]
    }

    /// Reloads from the first page. Existing items stay on screen until the new page lands,
    /// so changing a sort never flashes an empty grid.
    func reload(using library: any LibraryServicing) async {
        generation += 1
        let token = generation
        if items.isEmpty { state = .loading }
        do {
            let page = try await library.items(query(startIndex: 0))
            guard token == generation else { return }
            items = page.items
            totalCount = page.totalRecordCount
            state = .loaded(())
        } catch {
            guard token == generation else { return }
            state = .failed(error)
        }
    }

    func loadMoreIfNeeded(current item: BaseItem, using library: any LibraryServicing) async {
        guard hasMore, !isLoadingMore else { return }
        let threshold = max(0, items.count - 12)
        guard let index = items.firstIndex(where: { $0.id == item.id }), index >= threshold else { return }
        isLoadingMore = true
        defer { isLoadingMore = false }
        let token = generation
        do {
            let page = try await library.items(query(startIndex: items.count))
            guard token == generation else { return }
            let known = Set(items.map(\.id))
            items.append(contentsOf: page.items.filter { !known.contains($0.id) })
            totalCount = page.totalRecordCount
        } catch {
            // Keep what we have; the next scroll retries.
        }
    }

    private func query(startIndex: Int) -> ItemsQuery {
        var query = ItemsQuery()
        switch scope {
        case .library(let library):
            query.parentID = library.id
            query.recursive = true
            switch library.collectionType {
            case .movies: query.includeItemTypes = [.movie]
            case .tvShows: query.includeItemTypes = [.series]
            case .boxSets: query.includeItemTypes = [.boxSet]
            default: query.excludeItemTypes = [.folder, .collectionFolder]
            }
        case .container(let container):
            query.parentID = container.id
            query.recursive = container.type == .boxSet ? nil : false
        case .person(let person):
            query.personIDs = [person.id]
            query.recursive = true
            query.includeItemTypes = [.movie, .series]
        }
        query.sortBy = criteria.sort == .sortName ? [.sortName] : [criteria.sort, .sortName]
        query.sortOrder = criteria.order
        if criteria.unplayedOnly { query.filters.append(.isUnplayed) }
        if criteria.favoritesOnly { query.filters.append(.isFavorite) }
        query.fields = [.primaryImageAspectRatio]
        query.enableImageTypes = [.primary, .thumb, .backdrop]
        query.startIndex = startIndex
        query.limit = pageSize
        return query
    }
}

extension SortBy {
    var title: String {
        switch self {
        case .sortName: return String(localized: "Name")
        case .dateCreated: return String(localized: "Date Added")
        case .premiereDate: return String(localized: "Release Date")
        case .productionYear: return String(localized: "Year")
        case .communityRating: return String(localized: "Rating")
        case .datePlayed: return String(localized: "Last Played")
        case .runtime: return String(localized: "Runtime")
        case .random: return String(localized: "Random")
        }
    }
}
