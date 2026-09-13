/// Tells the server what this device can play natively so it only transcodes when it must.
public struct DeviceProfile: Encodable, Sendable {
    public var name: String
    public var maxStreamingBitrate: Int
    public var maxStaticBitrate: Int
    public var musicStreamingTranscodingBitrate: Int
    public var directPlayProfiles: [DirectPlayProfile]
    public var transcodingProfiles: [TranscodingProfile]
    public var codecProfiles: [CodecProfile]
    public var subtitleProfiles: [SubtitleProfile]

    public init(
        name: String,
        maxStreamingBitrate: Int,
        maxStaticBitrate: Int,
        musicStreamingTranscodingBitrate: Int = 384_000,
        directPlayProfiles: [DirectPlayProfile],
        transcodingProfiles: [TranscodingProfile],
        codecProfiles: [CodecProfile] = [],
        subtitleProfiles: [SubtitleProfile]
    ) {
        self.name = name
        self.maxStreamingBitrate = maxStreamingBitrate
        self.maxStaticBitrate = maxStaticBitrate
        self.musicStreamingTranscodingBitrate = musicStreamingTranscodingBitrate
        self.directPlayProfiles = directPlayProfiles
        self.transcodingProfiles = transcodingProfiles
        self.codecProfiles = codecProfiles
        self.subtitleProfiles = subtitleProfiles
    }
}

public struct DirectPlayProfile: Encodable, Sendable {
    public var container: String
    public var type: String
    public var videoCodec: String?
    public var audioCodec: String?

    public init(container: String, type: String, videoCodec: String? = nil, audioCodec: String? = nil) {
        self.container = container
        self.type = type
        self.videoCodec = videoCodec
        self.audioCodec = audioCodec
    }
}

public struct TranscodingProfile: Encodable, Sendable {
    public var container: String
    public var type: String
    public var videoCodec: String?
    public var audioCodec: String?
    public var `protocol`: String
    public var context: String
    public var maxAudioChannels: String?
    public var minSegments: Int
    public var breakOnNonKeyFrames: Bool
    public var enableSubtitlesInManifest: Bool

    public init(
        container: String,
        type: String,
        videoCodec: String? = nil,
        audioCodec: String? = nil,
        protocol: String = "hls",
        context: String = "Streaming",
        maxAudioChannels: String? = nil,
        minSegments: Int = 2,
        breakOnNonKeyFrames: Bool = true,
        enableSubtitlesInManifest: Bool = true
    ) {
        self.container = container
        self.type = type
        self.videoCodec = videoCodec
        self.audioCodec = audioCodec
        self.protocol = `protocol`
        self.context = context
        self.maxAudioChannels = maxAudioChannels
        self.minSegments = minSegments
        self.breakOnNonKeyFrames = breakOnNonKeyFrames
        self.enableSubtitlesInManifest = enableSubtitlesInManifest
    }
}

public struct CodecProfile: Encodable, Sendable {
    public var type: String
    public var codec: String?
    public var conditions: [ProfileCondition]

    public init(type: String, codec: String? = nil, conditions: [ProfileCondition]) {
        self.type = type
        self.codec = codec
        self.conditions = conditions
    }
}

public struct ProfileCondition: Encodable, Sendable {
    public var condition: String
    public var property: String
    public var value: String
    public var isRequired: Bool

    public init(condition: String, property: String, value: String, isRequired: Bool = false) {
        self.condition = condition
        self.property = property
        self.value = value
        self.isRequired = isRequired
    }
}

public struct SubtitleProfile: Encodable, Sendable {
    public var format: String
    public var method: String

    public init(format: String, method: String) {
        self.format = format
        self.method = method
    }
}

extension DeviceProfile {
    /// What `AVPlayer` handles on iPhone, iPad and Apple TV without help from the server.
    ///
    /// Kept deliberately conservative: anything not listed is transcoded to HLS/fMP4, which
    /// plays reliably everywhere. Widen it as playback is verified on real hardware.
    /// TODO: gate HEVC Dolby Vision profile 5/8 and AV1 on device capability (`AVURLAsset.isPlayableExtendedMIMEType`).
    public static func apple(maxStreamingBitrate: Int = 120_000_000) -> DeviceProfile {
        DeviceProfile(
            name: "Apple",
            maxStreamingBitrate: maxStreamingBitrate,
            maxStaticBitrate: maxStreamingBitrate,
            directPlayProfiles: [
                DirectPlayProfile(container: "mp4,m4v,mov", type: "Video", videoCodec: "h264,hevc", audioCodec: "aac,mp3,ac3,eac3,alac,flac"),
                DirectPlayProfile(container: "mp3", type: "Audio"),
                DirectPlayProfile(container: "m4a,m4b", type: "Audio", audioCodec: "aac,alac"),
                DirectPlayProfile(container: "flac", type: "Audio"),
            ],
            transcodingProfiles: [
                TranscodingProfile(container: "mp4", type: "Video", videoCodec: "hevc,h264", audioCodec: "aac,ac3,eac3", protocol: "hls", maxAudioChannels: "6"),
                TranscodingProfile(container: "aac", type: "Audio", audioCodec: "aac", protocol: "hls"),
            ],
            codecProfiles: [
                CodecProfile(type: "Video", codec: "h264", conditions: [
                    ProfileCondition(condition: "LessThanEqual", property: "VideoLevel", value: "52"),
                    ProfileCondition(condition: "NotEquals", property: "IsInterlaced", value: "true"),
                ]),
                CodecProfile(type: "Video", codec: "hevc", conditions: [
                    ProfileCondition(condition: "NotEquals", property: "IsInterlaced", value: "true"),
                ]),
            ],
            subtitleProfiles: [
                SubtitleProfile(format: "vtt", method: "Hls"),
                SubtitleProfile(format: "vtt", method: "External"),
                SubtitleProfile(format: "srt", method: "External"),
                SubtitleProfile(format: "pgssub", method: "Encode"),
                SubtitleProfile(format: "dvdsub", method: "Encode"),
                SubtitleProfile(format: "ass", method: "Encode"),
                SubtitleProfile(format: "ssa", method: "Encode"),
            ]
        )
    }
}
