import Foundation

/// Builds artwork URLs. Widths snap to a small set of buckets so the server's image cache
/// and the client's URL cache both hit far more often.
public struct ImageURLBuilder: Sendable, Hashable {
    public var serverURL: URL
    public var quality: Int

    public static let widthBuckets: [Int] = [160, 240, 320, 480, 640, 800, 1024, 1280, 1600, 1920, 2560, 3840]

    public init(serverURL: URL, quality: Int = 90) {
        self.serverURL = serverURL
        self.quality = quality
    }

    public static func bucketedWidth(_ width: Int) -> Int {
        widthBuckets.first { $0 >= width } ?? widthBuckets.last!
    }

    /// A specific image on a specific item. Returns nil when the item has no such image.
    public func url(itemID: String, type: ImageType, tag: String?, index: Int? = nil, maxWidth: Int? = nil) -> URL? {
        guard let tag, !tag.isEmpty else { return nil }
        var path = "Items/\(itemID)/Images/\(type.rawValue)"
        if let index {
            path += "/\(index)"
        }
        var query: [URLQueryItem] = [
            URLQueryItem(name: "tag", value: tag),
            URLQueryItem(name: "quality", value: String(quality)),
        ]
        if let maxWidth {
            query.append(URLQueryItem(name: "maxWidth", value: String(Self.bucketedWidth(maxWidth))))
        }
        return try? JellyfinClient.url(base: serverURL, path: path, query: query)
    }

    /// Portrait poster: the item's own primary image, or the series poster for an episode.
    public func poster(for item: BaseItem, maxWidth: Int) -> URL? {
        if let tag = item.imageTags[.primary], item.type != .episode {
            return url(itemID: item.id, type: .primary, tag: tag, maxWidth: maxWidth)
        }
        if let seriesID = item.seriesId, let tag = item.seriesPrimaryImageTag {
            return url(itemID: seriesID, type: .primary, tag: tag, maxWidth: maxWidth)
        }
        if let tag = item.imageTags[.primary] {
            return url(itemID: item.id, type: .primary, tag: tag, maxWidth: maxWidth)
        }
        return nil
    }

    /// Landscape artwork for shelves: episode stills, otherwise thumb → backdrop → primary.
    public func landscape(for item: BaseItem, maxWidth: Int) -> URL? {
        if item.type == .episode, let tag = item.imageTags[.primary] {
            return url(itemID: item.id, type: .primary, tag: tag, maxWidth: maxWidth)
        }
        if let tag = item.imageTags[.thumb] {
            return url(itemID: item.id, type: .thumb, tag: tag, maxWidth: maxWidth)
        }
        if let parent = item.parentThumbItemId, let tag = item.parentThumbImageTag {
            return url(itemID: parent, type: .thumb, tag: tag, maxWidth: maxWidth)
        }
        if let backdrop = backdrop(for: item, maxWidth: maxWidth) {
            return backdrop
        }
        return poster(for: item, maxWidth: maxWidth)
    }

    /// Wide hero art. Falls back to the parent's (series) backdrop for seasons and episodes.
    public func backdrop(for item: BaseItem, maxWidth: Int) -> URL? {
        if let tag = item.backdropImageTags.first {
            return url(itemID: item.id, type: .backdrop, tag: tag, index: 0, maxWidth: maxWidth)
        }
        if let parent = item.parentBackdropItemId, let tag = item.parentBackdropImageTags.first {
            return url(itemID: parent, type: .backdrop, tag: tag, index: 0, maxWidth: maxWidth)
        }
        return nil
    }

    public func logo(for item: BaseItem, maxWidth: Int) -> URL? {
        if let tag = item.imageTags[.logo] {
            return url(itemID: item.id, type: .logo, tag: tag, maxWidth: maxWidth)
        }
        if let parent = item.parentLogoItemId, let tag = item.parentLogoImageTag {
            return url(itemID: parent, type: .logo, tag: tag, maxWidth: maxWidth)
        }
        return nil
    }

    public func person(_ person: Person, maxWidth: Int) -> URL? {
        url(itemID: person.id, type: .primary, tag: person.primaryImageTag, maxWidth: maxWidth)
    }

    public func userAvatar(_ user: User, maxWidth: Int) -> URL? {
        guard let tag = user.primaryImageTag else { return nil }
        var query: [URLQueryItem] = [
            URLQueryItem(name: "tag", value: tag),
            URLQueryItem(name: "maxWidth", value: String(Self.bucketedWidth(maxWidth))),
        ]
        query.append("quality", quality)
        return try? JellyfinClient.url(base: serverURL, path: "Users/\(user.id)/Images/Primary", query: query)
    }
}
