import Foundation

/// Parameters for the general-purpose `Items` query. Build one per screen.
public struct ItemsQuery: Sendable, Hashable {
    public var parentID: String?
    public var includeItemTypes: [ItemKind] = []
    public var excludeItemTypes: [ItemKind] = []
    public var recursive: Bool? = nil
    public var sortBy: [SortBy] = []
    public var sortOrder: SortOrder? = nil
    public var filters: [ItemFilter] = []
    public var fields: [ItemField] = []
    public var searchTerm: String? = nil
    public var genres: [String] = []
    public var personIDs: [String] = []
    public var startIndex: Int? = nil
    public var limit: Int? = nil
    public var enableImageTypes: [ImageType] = []
    public var collapseBoxSetItems: Bool? = nil
    public var isFavorite: Bool? = nil
    public var isPlayed: Bool? = nil

    public init(parentID: String? = nil) {
        self.parentID = parentID
    }

    func queryItems(userID: String) -> [URLQueryItem] {
        var query: [URLQueryItem] = []
        query.append("userId", userID)
        query.append("parentId", parentID)
        query.append("includeItemTypes", includeItemTypes.isEmpty ? nil : includeItemTypes)
        query.append("excludeItemTypes", excludeItemTypes.isEmpty ? nil : excludeItemTypes)
        query.append("recursive", recursive)
        query.append("sortBy", sortBy.isEmpty ? nil : sortBy)
        query.append("sortOrder", sortOrder?.rawValue)
        query.append("filters", filters.isEmpty ? nil : filters)
        query.append("fields", fields.isEmpty ? nil : fields)
        query.append("searchTerm", searchTerm)
        query.append("genres", genres.isEmpty ? nil : genres.joined(separator: "|"))
        query.append("personIds", personIDs.isEmpty ? nil : personIDs.joined(separator: ","))
        query.append("startIndex", startIndex)
        query.append("limit", limit)
        query.append("enableImageTypes", enableImageTypes.isEmpty ? nil : enableImageTypes)
        query.append("collapseBoxSetItems", collapseBoxSetItems)
        query.append("isFavorite", isFavorite)
        query.append("isPlayed", isPlayed)
        return query
    }
}

public enum LibraryEndpoints {
    /// The user's top-level libraries (Movies, TV Shows, …).
    public static func views(userID: String) -> Endpoint<QueryResult<BaseItem>> {
        Endpoint(.get, "Users/\(userID)/Views")
    }

    public static func items(userID: String, query: ItemsQuery) -> Endpoint<QueryResult<BaseItem>> {
        Endpoint(.get, "Users/\(userID)/Items", query: query.queryItems(userID: userID))
    }

    public static func item(userID: String, itemID: String) -> Endpoint<BaseItem> {
        Endpoint(.get, "Users/\(userID)/Items/\(itemID)")
    }

    /// In-progress items, most recent first.
    public static func resume(userID: String, limit: Int = 20, fields: [ItemField] = []) -> Endpoint<QueryResult<BaseItem>> {
        var query: [URLQueryItem] = []
        query.append("limit", limit)
        query.append("mediaTypes", "Video")
        query.append("fields", fields.isEmpty ? nil : fields)
        query.append("enableImageTypes", [ImageType.primary, .backdrop, .thumb])
        return Endpoint(.get, "Users/\(userID)/Items/Resume", query: query)
    }

    /// Recently added items. Returns a bare array, not a `QueryResult`.
    public static func latest(userID: String, parentID: String?, limit: Int = 20, fields: [ItemField] = []) -> Endpoint<[BaseItem]> {
        var query: [URLQueryItem] = []
        query.append("parentId", parentID)
        query.append("limit", limit)
        query.append("fields", fields.isEmpty ? nil : fields)
        query.append("enableImageTypes", [ImageType.primary, .backdrop, .thumb])
        return Endpoint(.get, "Users/\(userID)/Items/Latest", query: query)
    }

    public static func genres(userID: String, parentID: String?) -> Endpoint<QueryResult<BaseItem>> {
        var query: [URLQueryItem] = []
        query.append("userId", userID)
        query.append("parentId", parentID)
        query.append("sortBy", [SortBy.sortName])
        return Endpoint(.get, "Genres", query: query)
    }
}

public enum ShowsEndpoints {
    /// The next unwatched episode per series, ordered by the user's recent activity.
    public static func nextUp(userID: String, seriesID: String? = nil, limit: Int = 20, fields: [ItemField] = []) -> Endpoint<QueryResult<BaseItem>> {
        var query: [URLQueryItem] = []
        query.append("userId", userID)
        query.append("seriesId", seriesID)
        query.append("limit", limit)
        query.append("fields", fields.isEmpty ? nil : fields)
        query.append("enableImageTypes", [ImageType.primary, .backdrop, .thumb])
        query.append("enableRewatching", false)
        return Endpoint(.get, "Shows/NextUp", query: query)
    }

    public static func seasons(userID: String, seriesID: String, fields: [ItemField] = []) -> Endpoint<QueryResult<BaseItem>> {
        var query: [URLQueryItem] = []
        query.append("userId", userID)
        query.append("fields", fields.isEmpty ? nil : fields)
        return Endpoint(.get, "Shows/\(seriesID)/Seasons", query: query)
    }

    public static func episodes(userID: String, seriesID: String, seasonID: String?, fields: [ItemField] = []) -> Endpoint<QueryResult<BaseItem>> {
        var query: [URLQueryItem] = []
        query.append("userId", userID)
        query.append("seasonId", seasonID)
        query.append("fields", fields.isEmpty ? nil : fields)
        query.append("enableImageTypes", [ImageType.primary, .thumb])
        return Endpoint(.get, "Shows/\(seriesID)/Episodes", query: query)
    }
}
