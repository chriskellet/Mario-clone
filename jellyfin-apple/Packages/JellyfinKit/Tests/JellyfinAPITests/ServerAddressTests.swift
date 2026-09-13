import Foundation
import Testing
@testable import JellyfinAPI

@Suite("ServerAddress")
struct ServerAddressTests {
    @Test("Adds a scheme and strips trailing slashes")
    func normalize() {
        #expect(ServerAddress.normalize("192.168.1.10:8096/")?.absoluteString == "http://192.168.1.10:8096")
        #expect(ServerAddress.normalize("https://media.example.com/jellyfin/")?.absoluteString == "https://media.example.com/jellyfin")
        #expect(ServerAddress.normalize("   ") == nil)
        #expect(ServerAddress.normalize("ftp://nope") == nil)
    }

    @Test("Bare hosts probe the default port and https too")
    func candidates() {
        let urls = ServerAddress.candidates(for: "nas.local").map(\.absoluteString)
        #expect(urls == ["http://nas.local", "http://nas.local:8096", "https://nas.local"])
        #expect(ServerAddress.candidates(for: "https://x.example.com").map(\.absoluteString) == ["https://x.example.com"])
    }
}
