import Foundation

/// Jellyfin's `BaseItemDto`. One type for movies, shows, seasons, episodes, libraries and more.
/// Only the fields the app uses are modelled; everything else is ignored on decode.
public struct BaseItem: Decodable, Sendable, Hashable, Identifiable {
    public var id: String
    public var name: String
    public var type: ItemKind
    public var serverId: String?
    public var originalTitle: String?
    public var sortName: String?
    public var overview: String?
    public var taglines: [String]
    public var genres: [String]
    public var productionYear: Int?
    public var premiereDate: Date?
    public var endDate: Date?
    public var dateCreated: Date?
    public var communityRating: Double?
    public var criticRating: Double?
    public var officialRating: String?
    public var runTimeTicks: Int64?
    public var status: SeriesStatus?
    public var isFolder: Bool
    public var collectionType: CollectionType?
    public var childCount: Int?
    public var recursiveItemCount: Int?

    // Hierarchy
    public var parentId: String?
    public var indexNumber: Int?
    public var parentIndexNumber: Int?
    public var seriesId: String?
    public var seriesName: String?
    public var seasonId: String?
    public var seasonName: String?

    // Artwork
    public var imageTags: ImageTags
    public var backdropImageTags: [String]
    public var parentBackdropItemId: String?
    public var parentBackdropImageTags: [String]
    public var parentThumbItemId: String?
    public var parentThumbImageTag: String?
    public var parentLogoItemId: String?
    public var parentLogoImageTag: String?
    public var seriesPrimaryImageTag: String?
    public var seriesThumbImageTag: String?
    public var primaryImageAspectRatio: Double?

    // Playback and user state
    public var userData: UserItemData?
    public var mediaSources: [MediaSource]
    public var mediaStreams: [MediaStream]
    public var people: [Person]
    public var studios: [NameGuidPair]
    public var mediaType: String?
    public var locationType: String?

    enum CodingKeys: String, CodingKey {
        case id, name, type, serverId, originalTitle, sortName, overview, taglines, genres
        case productionYear, premiereDate, endDate, dateCreated, communityRating, criticRating, officialRating
        case runTimeTicks, status, isFolder, collectionType, childCount, recursiveItemCount
        case parentId, indexNumber, parentIndexNumber, seriesId, seriesName, seasonId, seasonName
        case imageTags, backdropImageTags, parentBackdropItemId, parentBackdropImageTags
        case parentThumbItemId, parentThumbImageTag, parentLogoItemId, parentLogoImageTag
        case seriesPrimaryImageTag, seriesThumbImageTag, primaryImageAspectRatio
        case userData, mediaSources, mediaStreams, people, studios, mediaType, locationType
    }

    /// A bare item with just identity. Used for navigation stubs and previews; every
    /// optional field is empty and can be filled in afterwards.
    public init(id: String, name: String, type: ItemKind) {
        self.id = id
        self.name = name
        self.type = type
        taglines = []
        genres = []
        isFolder = false
        imageTags = ImageTags()
        backdropImageTags = []
        parentBackdropImageTags = []
        mediaSources = []
        mediaStreams = []
        people = []
        studios = []
    }

    public init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        id = try c.decode(String.self, forKey: .id)
        name = try c.decodeIfPresent(String.self, forKey: .name) ?? ""
        type = try c.decodeIfPresent(ItemKind.self, forKey: .type) ?? .unknown
        serverId = try c.decodeIfPresent(String.self, forKey: .serverId)
        originalTitle = try c.decodeIfPresent(String.self, forKey: .originalTitle)
        sortName = try c.decodeIfPresent(String.self, forKey: .sortName)
        overview = try c.decodeIfPresent(String.self, forKey: .overview)
        taglines = try c.decodeIfPresent([String].self, forKey: .taglines) ?? []
        genres = try c.decodeIfPresent([String].self, forKey: .genres) ?? []
        productionYear = try c.decodeIfPresent(Int.self, forKey: .productionYear)
        premiereDate = try c.decodeIfPresent(Date.self, forKey: .premiereDate)
        endDate = try c.decodeIfPresent(Date.self, forKey: .endDate)
        dateCreated = try c.decodeIfPresent(Date.self, forKey: .dateCreated)
        communityRating = try c.decodeIfPresent(Double.self, forKey: .communityRating)
        criticRating = try c.decodeIfPresent(Double.self, forKey: .criticRating)
        officialRating = try c.decodeIfPresent(String.self, forKey: .officialRating)
        runTimeTicks = try c.decodeIfPresent(Int64.self, forKey: .runTimeTicks)
        status = try c.decodeIfPresent(SeriesStatus.self, forKey: .status)
        isFolder = try c.decodeIfPresent(Bool.self, forKey: .isFolder) ?? false
        collectionType = try c.decodeIfPresent(CollectionType.self, forKey: .collectionType)
        childCount = try c.decodeIfPresent(Int.self, forKey: .childCount)
        recursiveItemCount = try c.decodeIfPresent(Int.self, forKey: .recursiveItemCount)
        parentId = try c.decodeIfPresent(String.self, forKey: .parentId)
        indexNumber = try c.decodeIfPresent(Int.self, forKey: .indexNumber)
        parentIndexNumber = try c.decodeIfPresent(Int.self, forKey: .parentIndexNumber)
        seriesId = try c.decodeIfPresent(String.self, forKey: .seriesId)
        seriesName = try c.decodeIfPresent(String.self, forKey: .seriesName)
        seasonId = try c.decodeIfPresent(String.self, forKey: .seasonId)
        seasonName = try c.decodeIfPresent(String.self, forKey: .seasonName)
        imageTags = try c.decodeIfPresent(ImageTags.self, forKey: .imageTags) ?? ImageTags()
        backdropImageTags = try c.decodeIfPresent([String].self, forKey: .backdropImageTags) ?? []
        parentBackdropItemId = try c.decodeIfPresent(String.self, forKey: .parentBackdropItemId)
        parentBackdropImageTags = try c.decodeIfPresent([String].self, forKey: .parentBackdropImageTags) ?? []
        parentThumbItemId = try c.decodeIfPresent(String.self, forKey: .parentThumbItemId)
        parentThumbImageTag = try c.decodeIfPresent(String.self, forKey: .parentThumbImageTag)
        parentLogoItemId = try c.decodeIfPresent(String.self, forKey: .parentLogoItemId)
        parentLogoImageTag = try c.decodeIfPresent(String.self, forKey: .parentLogoImageTag)
        seriesPrimaryImageTag = try c.decodeIfPresent(String.self, forKey: .seriesPrimaryImageTag)
        seriesThumbImageTag = try c.decodeIfPresent(String.self, forKey: .seriesThumbImageTag)
        primaryImageAspectRatio = try c.decodeIfPresent(Double.self, forKey: .primaryImageAspectRatio)
        userData = try c.decodeIfPresent(UserItemData.self, forKey: .userData)
        mediaSources = try c.decodeIfPresent([MediaSource].self, forKey: .mediaSources) ?? []
        mediaStreams = try c.decodeIfPresent([MediaStream].self, forKey: .mediaStreams) ?? []
        people = try c.decodeIfPresent([Person].self, forKey: .people) ?? []
        studios = try c.decodeIfPresent([NameGuidPair].self, forKey: .studios) ?? []
        mediaType = try c.decodeIfPresent(String.self, forKey: .mediaType)
        locationType = try c.decodeIfPresent(String.self, forKey: .locationType)
    }

    // Identity-based hashing keeps navigation values cheap; equality stays full so UI updates.
    public func hash(into hasher: inout Hasher) {
        hasher.combine(id)
    }
}

// MARK: - Derived values

extension BaseItem {
    public var runTime: Duration? {
        guard let runTimeTicks, runTimeTicks > 0 else { return nil }
        return Ticks.duration(runTimeTicks)
    }

    public var isPlayable: Bool {
        switch type {
        case .movie, .episode, .video, .trailer, .audio, .liveTvChannel, .recording: return true
        default: return false
        }
    }

    public var resumePositionTicks: Int64 {
        userData?.playbackPositionTicks ?? 0
    }

    public var canResume: Bool {
        resumePositionTicks > 0
    }

    public var isPlayed: Bool {
        userData?.played ?? false
    }

    public var isFavorite: Bool {
        userData?.isFavorite ?? false
    }

    /// `S2 · E5` style label for episodes; nil for everything else.
    public var episodeCode: String? {
        guard type == .episode, let episode = indexNumber else { return nil }
        if let season = parentIndexNumber {
            return "S\(season) · E\(episode)"
        }
        return "E\(episode)"
    }
}
