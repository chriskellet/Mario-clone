import Foundation
import Testing
@testable import JellyfinAPI

@Suite("Stream resolution")
struct StreamResolutionTests {
    let decoder = JSONCoding.makeDecoder()

    @Test("Prefers direct play and builds a static stream URL")
    func directPlay() async throws {
        let json = #"{"MediaSources":[{"Id":"ms1","SupportsDirectPlay":true,"SupportsTranscoding":true,"TranscodingUrl":"/videos/x/master.m3u8?api_key=tok"}],"PlaySessionId":"ps"}"#
        let response = try decoder.decode(PlaybackInfoResponse.self, from: Data(json.utf8))
        let client = JellyfinClient.test(transport: StubTransport(json: "{}"))
        let resolution = try await client.resolveStream(itemID: "x", from: response)
        #expect(resolution.playMethod == .directPlay)
        #expect(resolution.url.path == "/jellyfin/Videos/x/stream")
        #expect(resolution.url.query?.contains("api_key=tok") == true)
        #expect(resolution.url.query?.contains("playSessionId=ps") == true)
    }

    @Test("Falls back to the server's transcoding URL")
    func transcode() async throws {
        let json = #"{"MediaSources":[{"Id":"ms1","SupportsDirectPlay":false,"SupportsTranscoding":true,"TranscodingUrl":"/videos/x/master.m3u8?api_key=tok"}]}"#
        let response = try decoder.decode(PlaybackInfoResponse.self, from: Data(json.utf8))
        let client = JellyfinClient.test(transport: StubTransport(json: "{}"))
        let resolution = try await client.resolveStream(itemID: "x", from: response)
        #expect(resolution.playMethod == .transcode)
        #expect(resolution.url.absoluteString == "https://media.example.com/jellyfin/videos/x/master.m3u8?api_key=tok")
    }

    @Test("Throws when nothing is playable")
    func nothing() async throws {
        let response = try decoder.decode(PlaybackInfoResponse.self, from: Data(#"{"MediaSources":[]}"#.utf8))
        let client = JellyfinClient.test(transport: StubTransport(json: "{}"))
        await #expect(throws: JellyfinError.self) {
            _ = try await client.resolveStream(itemID: "x", from: response)
        }
    }
}
