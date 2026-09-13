public struct MediaSource: Decodable, Sendable, Hashable, Identifiable {
    public var id: String
    public var name: String?
    public var container: String?
    public var path: String?
    public var size: Int64?
    public var bitrate: Int?
    public var runTimeTicks: Int64?
    public var supportsDirectPlay: Bool
    public var supportsDirectStream: Bool
    public var supportsTranscoding: Bool
    public var transcodingUrl: String?
    public var transcodingContainer: String?
    public var transcodingSubProtocol: String?
    public var mediaStreams: [MediaStream]
    public var defaultAudioStreamIndex: Int?
    public var defaultSubtitleStreamIndex: Int?
    public var eTag: String?

    enum CodingKeys: String, CodingKey {
        case id, name, container, path, size, bitrate, runTimeTicks
        case supportsDirectPlay, supportsDirectStream, supportsTranscoding
        case transcodingUrl, transcodingContainer, transcodingSubProtocol
        case mediaStreams, defaultAudioStreamIndex, defaultSubtitleStreamIndex, eTag
    }

    public init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        id = try c.decode(String.self, forKey: .id)
        name = try c.decodeIfPresent(String.self, forKey: .name)
        container = try c.decodeIfPresent(String.self, forKey: .container)
        path = try c.decodeIfPresent(String.self, forKey: .path)
        size = try c.decodeIfPresent(Int64.self, forKey: .size)
        bitrate = try c.decodeIfPresent(Int.self, forKey: .bitrate)
        runTimeTicks = try c.decodeIfPresent(Int64.self, forKey: .runTimeTicks)
        supportsDirectPlay = try c.decodeIfPresent(Bool.self, forKey: .supportsDirectPlay) ?? false
        supportsDirectStream = try c.decodeIfPresent(Bool.self, forKey: .supportsDirectStream) ?? false
        supportsTranscoding = try c.decodeIfPresent(Bool.self, forKey: .supportsTranscoding) ?? false
        transcodingUrl = try c.decodeIfPresent(String.self, forKey: .transcodingUrl)
        transcodingContainer = try c.decodeIfPresent(String.self, forKey: .transcodingContainer)
        transcodingSubProtocol = try c.decodeIfPresent(String.self, forKey: .transcodingSubProtocol)
        mediaStreams = try c.decodeIfPresent([MediaStream].self, forKey: .mediaStreams) ?? []
        defaultAudioStreamIndex = try c.decodeIfPresent(Int.self, forKey: .defaultAudioStreamIndex)
        defaultSubtitleStreamIndex = try c.decodeIfPresent(Int.self, forKey: .defaultSubtitleStreamIndex)
        eTag = try c.decodeIfPresent(String.self, forKey: .eTag)
    }

    public var videoStream: MediaStream? { mediaStreams.first { $0.type == .video } }
    public var audioStreams: [MediaStream] { mediaStreams.filter { $0.type == .audio } }
    public var subtitleStreams: [MediaStream] { mediaStreams.filter { $0.type == .subtitle } }
}

public struct MediaStream: Decodable, Sendable, Hashable {
    public var type: MediaStreamType
    public var index: Int
    public var codec: String?
    public var language: String?
    public var displayTitle: String?
    public var title: String?
    public var isDefault: Bool?
    public var isForced: Bool?
    public var isExternal: Bool?
    public var isTextSubtitleStream: Bool?
    public var supportsExternalStream: Bool?
    public var deliveryUrl: String?
    public var width: Int?
    public var height: Int?
    public var channels: Int?
    public var bitRate: Int?
    public var videoRange: String?
    public var profile: String?
    public var level: Double?
}

public struct PlaybackInfoResponse: Decodable, Sendable {
    public var mediaSources: [MediaSource]
    public var playSessionId: String?
    public var errorCode: String?
}
