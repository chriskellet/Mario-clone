import Foundation
import Testing
@testable import JellyfinAPI

@Suite("JellyfinClient")
struct ClientTests {
    @Test("Builds URLs under a sub-path server without mangling the base")
    func urlBuilding() throws {
        let base = URL(string: "https://media.example.com/jellyfin")!
        let url = try JellyfinClient.url(base: base, path: "/Users/abc/Items", query: [URLQueryItem(name: "limit", value: "5")])
        #expect(url.absoluteString == "https://media.example.com/jellyfin/Users/abc/Items?limit=5")
    }

    @Test("Sends the MediaBrowser authorization header with the token")
    func authorizationHeader() async throws {
        let transport = StubTransport(json: #"{"Id":"srv","ServerName":"Home"}"#)
        let client = JellyfinClient.test(transport: transport)
        _ = try await client.send(SystemEndpoints.publicInfo())
        let header = transport.requests.first?.value(forHTTPHeaderField: "Authorization")
        #expect(header == #"MediaBrowser Client="Marquee", Device="Test", DeviceId="device-1", Version="1.0", Token="tok""#)
    }

    @Test("Refuses authenticated endpoints when signed out")
    func requiresToken() async {
        let client = JellyfinClient.test(transport: StubTransport(json: "{}"), token: nil, userID: nil)
        await #expect(throws: JellyfinError.self) {
            _ = try await client.send(AuthEndpoints.currentUser())
        }
    }

    @Test("Maps HTTP status codes to typed errors")
    func statusMapping() async {
        let client = JellyfinClient.test(transport: StubTransport(status: 401, json: ""))
        do {
            _ = try await client.send(AuthEndpoints.currentUser())
            Issue.record("Expected an error")
        } catch let error as JellyfinError {
            guard case .unauthorized = error else {
                Issue.record("Unexpected error \(error)")
                return
            }
        } catch {
            Issue.record("Unexpected error \(error)")
        }
    }

    @Test("Encodes request bodies with PascalCase keys")
    func bodyEncoding() async throws {
        let transport = StubTransport(json: #"{"User":{"Id":"u","Name":"chris"},"AccessToken":"abc"}"#)
        let client = JellyfinClient.test(transport: transport, token: nil, userID: nil)
        let result = try await client.send(AuthEndpoints.authenticateByName(username: "chris", password: "pw"))
        #expect(result.accessToken == "abc")
        let body = try #require(transport.requests.first?.httpBody)
        let json = try #require(JSONSerialization.jsonObject(with: body) as? [String: String])
        #expect(json == ["Username": "chris", "Pw": "pw"])
    }

    @Test("Media URLs carry the token as a query parameter")
    func mediaURL() throws {
        let client = JellyfinClient.test(transport: StubTransport(json: "{}"))
        let url = try client.mediaURL(path: "Videos/abc/stream", query: [URLQueryItem(name: "static", value: "true")], token: "tok")
        #expect(url.absoluteString == "https://media.example.com/jellyfin/Videos/abc/stream?static=true&api_key=tok")
    }
}
