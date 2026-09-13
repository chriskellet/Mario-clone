import Foundation

public enum PlaybackEndpoints {
    public static func playbackInfo(userID: String, itemID: String, request: PlaybackInfoRequest) -> Endpoint<PlaybackInfoResponse> {
        Endpoint(.post, "Items/\(itemID)/PlaybackInfo", query: [URLQueryItem(name: "userId", value: userID)], body: request)
    }

    public static func reportStarted(_ report: PlaybackProgressReport) -> Endpoint<EmptyResponse> {
        Endpoint(.post, "Sessions/Playing", body: report)
    }

    public static func reportProgress(_ report: PlaybackProgressReport) -> Endpoint<EmptyResponse> {
        Endpoint(.post, "Sessions/Playing/Progress", body: report)
    }

    public static func reportStopped(_ report: PlaybackStopReport) -> Endpoint<EmptyResponse> {
        Endpoint(.post, "Sessions/Playing/Stopped", body: report)
    }

    /// Tells the server to tear down a transcoding job when playback ends early.
    public static func stopTranscoding(deviceID: String, playSessionID: String) -> Endpoint<EmptyResponse> {
        Endpoint(.delete, "Videos/ActiveEncodings", query: [
            URLQueryItem(name: "deviceId", value: deviceID),
            URLQueryItem(name: "playSessionId", value: playSessionID),
        ])
    }
}

/// Resolves a `MediaSource` into a playable URL and the method the server should be told about.
public struct StreamResolution: Sendable, Hashable {
    public var url: URL
    public var playMethod: PlayMethod
    public var mediaSourceID: String

    public init(url: URL, playMethod: PlayMethod, mediaSourceID: String) {
        self.url = url
        self.playMethod = playMethod
        self.mediaSourceID = mediaSourceID
    }
}

extension JellyfinClient {
    /// Picks the best source and builds its URL. Prefers direct play, then HLS transcoding.
    public func resolveStream(itemID: String, from response: PlaybackInfoResponse) throws -> StreamResolution {
        let token = accessToken
        let sources = response.mediaSources

        if let source = sources.first(where: { $0.supportsDirectPlay || $0.supportsDirectStream }) {
            var query: [URLQueryItem] = [
                URLQueryItem(name: "static", value: "true"),
                URLQueryItem(name: "mediaSourceId", value: source.id),
                URLQueryItem(name: "deviceId", value: identity.deviceID),
            ]
            query.append("playSessionId", response.playSessionId)
            query.append("tag", source.eTag)
            let url = try mediaURL(path: "Videos/\(itemID)/stream", query: query, token: token)
            return StreamResolution(url: url, playMethod: source.supportsDirectPlay ? .directPlay : .directStream, mediaSourceID: source.id)
        }

        if let source = sources.first(where: { $0.supportsTranscoding }), let transcodingPath = source.transcodingUrl {
            // `TranscodingUrl` is relative to the server base (sub-path included) and already
            // carries the api_key and play session, so it is appended verbatim.
            let separator = transcodingPath.hasPrefix("/") ? "" : "/"
            guard let url = URL(string: serverURL.absoluteString + separator + transcodingPath) else {
                throw JellyfinError.invalidServerURL
            }
            return StreamResolution(url: url, playMethod: .transcode, mediaSourceID: source.id)
        }

        throw JellyfinError.noPlayableMediaSource
    }
}
