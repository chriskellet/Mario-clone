import Foundation
import JellyfinAPI

/// A resolved, ready-to-play stream plus what the server needs to hear about it.
struct PreparedPlayback: Sendable {
    let item: BaseItem
    let stream: StreamResolution
    let playSessionID: String?
    let startTicks: Int64
}

protocol PlaybackServicing: Sendable {
    func prepare(item: BaseItem, startTicks: Int64) async throws -> PreparedPlayback
    func reportStarted(_ playback: PreparedPlayback, positionTicks: Int64) async
    func reportProgress(_ playback: PreparedPlayback, positionTicks: Int64, isPaused: Bool) async
    func reportStopped(_ playback: PreparedPlayback, positionTicks: Int64) async
}

struct JellyfinPlaybackService: PlaybackServicing {
    let client: JellyfinClient
    let identity: ClientIdentity
    /// TODO: expose as a user setting (Auto / 4 / 8 / 20 / 60 / 120 Mbps) once Settings grows.
    var maxStreamingBitrate: Int = 120_000_000

    func prepare(item: BaseItem, startTicks: Int64) async throws -> PreparedPlayback {
        let userID = try await client.requireUserID()
        let request = PlaybackInfoRequest(
            deviceProfile: .apple(maxStreamingBitrate: maxStreamingBitrate),
            maxStreamingBitrate: maxStreamingBitrate,
            startTimeTicks: startTicks
        )
        let info = try await client.send(PlaybackEndpoints.playbackInfo(userID: userID, itemID: item.id, request: request))
        let stream = try await client.resolveStream(itemID: item.id, from: info)
        return PreparedPlayback(item: item, stream: stream, playSessionID: info.playSessionId, startTicks: startTicks)
    }

    func reportStarted(_ playback: PreparedPlayback, positionTicks: Int64) async {
        _ = try? await client.send(PlaybackEndpoints.reportStarted(progress(playback, positionTicks: positionTicks, isPaused: false)))
    }

    func reportProgress(_ playback: PreparedPlayback, positionTicks: Int64, isPaused: Bool) async {
        _ = try? await client.send(PlaybackEndpoints.reportProgress(progress(playback, positionTicks: positionTicks, isPaused: isPaused)))
    }

    func reportStopped(_ playback: PreparedPlayback, positionTicks: Int64) async {
        let report = PlaybackStopReport(
            itemId: playback.item.id,
            mediaSourceId: playback.stream.mediaSourceID,
            playSessionId: playback.playSessionID,
            positionTicks: positionTicks
        )
        _ = try? await client.send(PlaybackEndpoints.reportStopped(report))
        if playback.stream.playMethod == .transcode, let sessionID = playback.playSessionID {
            _ = try? await client.send(PlaybackEndpoints.stopTranscoding(deviceID: identity.deviceID, playSessionID: sessionID))
        }
    }

    private func progress(_ playback: PreparedPlayback, positionTicks: Int64, isPaused: Bool) -> PlaybackProgressReport {
        PlaybackProgressReport(
            itemId: playback.item.id,
            mediaSourceId: playback.stream.mediaSourceID,
            playSessionId: playback.playSessionID,
            positionTicks: positionTicks,
            isPaused: isPaused,
            playMethod: playback.stream.playMethod
        )
    }
}
