import Foundation

/// A string-backed enum that never fails to decode: unknown server values map to `.unknown`.
public protocol LenientStringEnum: RawRepresentable, Codable, Hashable, Sendable where RawValue == String {
    static var unknown: Self { get }
}

extension LenientStringEnum {
    /// Shared decoding body. Each enum forwards its `init(from:)` here so the explicit
    /// initialiser in the type body takes precedence over the stdlib's strict one.
    public static func lenient(from decoder: Decoder) throws -> Self {
        let raw = try decoder.singleValueContainer().decode(String.self)
        return Self(rawValue: raw) ?? .unknown
    }
}

public enum ItemKind: String, LenientStringEnum, CaseIterable {
    public init(from decoder: Decoder) throws { self = try Self.lenient(from: decoder) }

    case movie = "Movie"
    case series = "Series"
    case season = "Season"
    case episode = "Episode"
    case boxSet = "BoxSet"
    case collectionFolder = "CollectionFolder"
    case folder = "Folder"
    case userView = "UserView"
    case video = "Video"
    case trailer = "Trailer"
    case musicAlbum = "MusicAlbum"
    case musicArtist = "MusicArtist"
    case audio = "Audio"
    case person = "Person"
    case genre = "Genre"
    case studio = "Studio"
    case playlist = "Playlist"
    case liveTvChannel = "TvChannel"
    case liveTvProgram = "TvProgram"
    case recording = "Recording"
    case unknown = "Unknown"
}

/// The `CollectionType` of a library view (`movies`, `tvshows`, …).
public enum CollectionType: String, LenientStringEnum {
    public init(from decoder: Decoder) throws { self = try Self.lenient(from: decoder) }

    case movies
    case tvShows = "tvshows"
    case music
    case musicVideos = "musicvideos"
    case homeVideos = "homevideos"
    case boxSets = "boxsets"
    case books
    case photos
    case playlists
    case liveTv = "livetv"
    case folders
    case unknown
}

public enum ImageType: String, LenientStringEnum, CaseIterable {
    public init(from decoder: Decoder) throws { self = try Self.lenient(from: decoder) }

    case primary = "Primary"
    case backdrop = "Backdrop"
    case thumb = "Thumb"
    case logo = "Logo"
    case banner = "Banner"
    case art = "Art"
    case screenshot = "Screenshot"
    case unknown = "Unknown"
}

public enum SortBy: String, Sendable, CaseIterable, Hashable {
    case sortName = "SortName"
    case dateCreated = "DateCreated"
    case premiereDate = "PremiereDate"
    case productionYear = "ProductionYear"
    case communityRating = "CommunityRating"
    case datePlayed = "DatePlayed"
    case runtime = "Runtime"
    case random = "Random"
}

public enum SortOrder: String, Sendable, Hashable {
    case ascending = "Ascending"
    case descending = "Descending"
}

public enum ItemFilter: String, Sendable, Hashable {
    case isUnplayed = "IsUnplayed"
    case isPlayed = "IsPlayed"
    case isFavorite = "IsFavorite"
    case isResumable = "IsResumable"
}

/// Extra fields the server only includes when asked. Ask for what a screen needs, nothing more.
public enum ItemField: String, Sendable, Hashable {
    case overview = "Overview"
    case genres = "Genres"
    case people = "People"
    case studios = "Studios"
    case taglines = "Taglines"
    case mediaSources = "MediaSources"
    case mediaStreams = "MediaStreams"
    case primaryImageAspectRatio = "PrimaryImageAspectRatio"
    case dateCreated = "DateCreated"
    case childCount = "ChildCount"
    case recursiveItemCount = "RecursiveItemCount"
    case parentId = "ParentId"
    case chapters = "Chapters"
    case path = "Path"
    case providerIds = "ProviderIds"
    case seriesStatus = "SeriesStatus"
}

public enum SeriesStatus: String, LenientStringEnum {
    public init(from decoder: Decoder) throws { self = try Self.lenient(from: decoder) }

    case continuing = "Continuing"
    case ended = "Ended"
    case unreleased = "Unreleased"
    case unknown = "Unknown"
}

public enum MediaStreamType: String, LenientStringEnum {
    public init(from decoder: Decoder) throws { self = try Self.lenient(from: decoder) }

    case audio = "Audio"
    case video = "Video"
    case subtitle = "Subtitle"
    case embeddedImage = "EmbeddedImage"
    case data = "Data"
    case lyric = "Lyric"
    case unknown = "Unknown"
}

public enum PlayMethod: String, Sendable, Hashable, Codable {
    case directPlay = "DirectPlay"
    case directStream = "DirectStream"
    case transcode = "Transcode"
}
