import Foundation
import JellyfinAPI

/// The read side of the library, as screens see it. Implementations hide endpoint details
/// so screens can be previewed and tested against canned data.
protocol LibraryServicing: Sendable {
    func views() async throws -> [BaseItem]
    func resume() async throws -> [BaseItem]
    /// Next unwatched episodes; pass a series id to scope it to one show.
    func nextUp(seriesID: String?) async throws -> [BaseItem]
    func latest(in library: BaseItem) async throws -> [BaseItem]
    func items(_ query: ItemsQuery) async throws -> QueryResult<BaseItem>
    func item(id: String) async throws -> BaseItem
    func seasons(seriesID: String) async throws -> [BaseItem]
    func episodes(seriesID: String, seasonID: String?) async throws -> [BaseItem]
    func search(_ term: String) async throws -> [BaseItem]
    @discardableResult func setPlayed(_ played: Bool, itemID: String) async throws -> UserItemData
    @discardableResult func setFavorite(_ favorite: Bool, itemID: String) async throws -> UserItemData
}

struct JellyfinLibraryService: LibraryServicing {
    let client: JellyfinClient

    /// Fields every detail-ish screen needs. Shelves ask for less.
    static let detailFields: [ItemField] = [
        .overview, .genres, .people, .studios, .taglines, .primaryImageAspectRatio,
        .childCount, .recursiveItemCount, .dateCreated, .seriesStatus, .mediaSources,
    ]
    static let shelfFields: [ItemField] = [.primaryImageAspectRatio, .overview]

    func views() async throws -> [BaseItem] {
        let userID = try await client.requireUserID()
        return try await client.send(LibraryEndpoints.views(userID: userID)).items
    }

    func resume() async throws -> [BaseItem] {
        let userID = try await client.requireUserID()
        return try await client.send(LibraryEndpoints.resume(userID: userID, fields: Self.shelfFields)).items
    }

    /// Next unwatched episodes; pass a series id to scope it to one show.
    func nextUp(seriesID: String?) async throws -> [BaseItem] {
        let userID = try await client.requireUserID()
        return try await client.send(ShowsEndpoints.nextUp(userID: userID, seriesID: seriesID, fields: Self.shelfFields)).items
    }

    func latest(in library: BaseItem) async throws -> [BaseItem] {
        let userID = try await client.requireUserID()
        return try await client.send(LibraryEndpoints.latest(userID: userID, parentID: library.id, fields: Self.shelfFields))
    }

    func items(_ query: ItemsQuery) async throws -> QueryResult<BaseItem> {
        let userID = try await client.requireUserID()
        return try await client.send(LibraryEndpoints.items(userID: userID, query: query))
    }

    func item(id: String) async throws -> BaseItem {
        let userID = try await client.requireUserID()
        return try await client.send(LibraryEndpoints.item(userID: userID, itemID: id))
    }

    func seasons(seriesID: String) async throws -> [BaseItem] {
        let userID = try await client.requireUserID()
        return try await client.send(ShowsEndpoints.seasons(userID: userID, seriesID: seriesID, fields: [.childCount])).items
    }

    func episodes(seriesID: String, seasonID: String?) async throws -> [BaseItem] {
        let userID = try await client.requireUserID()
        return try await client.send(ShowsEndpoints.episodes(userID: userID, seriesID: seriesID, seasonID: seasonID, fields: [.overview, .mediaSources])).items
    }

    func search(_ term: String) async throws -> [BaseItem] {
        var query = ItemsQuery()
        query.searchTerm = term
        query.recursive = true
        query.includeItemTypes = [.movie, .series, .episode]
        query.fields = [.primaryImageAspectRatio]
        query.enableImageTypes = [.primary, .thumb, .backdrop]
        query.limit = 60
        return try await items(query).items
    }

    func setPlayed(_ played: Bool, itemID: String) async throws -> UserItemData {
        let userID = try await client.requireUserID()
        return try await client.send(played
            ? UserDataEndpoints.markPlayed(userID: userID, itemID: itemID)
            : UserDataEndpoints.markUnplayed(userID: userID, itemID: itemID))
    }

    func setFavorite(_ favorite: Bool, itemID: String) async throws -> UserItemData {
        let userID = try await client.requireUserID()
        return try await client.send(favorite
            ? UserDataEndpoints.markFavorite(userID: userID, itemID: itemID)
            : UserDataEndpoints.unmarkFavorite(userID: userID, itemID: itemID))
    }
}
