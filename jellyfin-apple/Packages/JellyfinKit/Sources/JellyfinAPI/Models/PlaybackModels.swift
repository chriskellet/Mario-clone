public struct PlaybackInfoRequest: Encodable, Sendable {
    public var deviceProfile: DeviceProfile
    public var maxStreamingBitrate: Int?
    public var startTimeTicks: Int64?
    public var mediaSourceId: String?
    public var audioStreamIndex: Int?
    public var subtitleStreamIndex: Int?
    public var enableDirectPlay: Bool
    public var enableDirectStream: Bool
    public var enableTranscoding: Bool
    public var allowVideoStreamCopy: Bool
    public var allowAudioStreamCopy: Bool
    public var autoOpenLiveStream: Bool

    public init(
        deviceProfile: DeviceProfile,
        maxStreamingBitrate: Int? = nil,
        startTimeTicks: Int64? = nil,
        mediaSourceId: String? = nil,
        audioStreamIndex: Int? = nil,
        subtitleStreamIndex: Int? = nil,
        enableDirectPlay: Bool = true,
        enableDirectStream: Bool = true,
        enableTranscoding: Bool = true,
        allowVideoStreamCopy: Bool = true,
        allowAudioStreamCopy: Bool = true,
        autoOpenLiveStream: Bool = true
    ) {
        self.deviceProfile = deviceProfile
        self.maxStreamingBitrate = maxStreamingBitrate
        self.startTimeTicks = startTimeTicks
        self.mediaSourceId = mediaSourceId
        self.audioStreamIndex = audioStreamIndex
        self.subtitleStreamIndex = subtitleStreamIndex
        self.enableDirectPlay = enableDirectPlay
        self.enableDirectStream = enableDirectStream
        self.enableTranscoding = enableTranscoding
        self.allowVideoStreamCopy = allowVideoStreamCopy
        self.allowAudioStreamCopy = allowAudioStreamCopy
        self.autoOpenLiveStream = autoOpenLiveStream
    }
}

public struct PlaybackProgressReport: Encodable, Sendable {
    public var itemId: String
    public var mediaSourceId: String?
    public var playSessionId: String?
    public var positionTicks: Int64
    public var isPaused: Bool
    public var isMuted: Bool
    public var playMethod: PlayMethod
    public var audioStreamIndex: Int?
    public var subtitleStreamIndex: Int?
    public var canSeek: Bool
    public var volumeLevel: Int

    public init(
        itemId: String,
        mediaSourceId: String?,
        playSessionId: String?,
        positionTicks: Int64,
        isPaused: Bool,
        isMuted: Bool = false,
        playMethod: PlayMethod,
        audioStreamIndex: Int? = nil,
        subtitleStreamIndex: Int? = nil,
        canSeek: Bool = true,
        volumeLevel: Int = 100
    ) {
        self.itemId = itemId
        self.mediaSourceId = mediaSourceId
        self.playSessionId = playSessionId
        self.positionTicks = positionTicks
        self.isPaused = isPaused
        self.isMuted = isMuted
        self.playMethod = playMethod
        self.audioStreamIndex = audioStreamIndex
        self.subtitleStreamIndex = subtitleStreamIndex
        self.canSeek = canSeek
        self.volumeLevel = volumeLevel
    }
}

public struct PlaybackStopReport: Encodable, Sendable {
    public var itemId: String
    public var mediaSourceId: String?
    public var playSessionId: String?
    public var positionTicks: Int64
    public var failed: Bool

    public init(itemId: String, mediaSourceId: String?, playSessionId: String?, positionTicks: Int64, failed: Bool = false) {
        self.itemId = itemId
        self.mediaSourceId = mediaSourceId
        self.playSessionId = playSessionId
        self.positionTicks = positionTicks
        self.failed = failed
    }
}
