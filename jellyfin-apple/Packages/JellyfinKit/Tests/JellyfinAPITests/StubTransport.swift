import Foundation
@testable import JellyfinAPI
#if canImport(FoundationNetworking)
import FoundationNetworking
#endif

/// Records requests and replays canned responses. Keeps tests free of the network.
final class StubTransport: HTTPTransport, @unchecked Sendable {
    struct Reply {
        var status: Int
        var body: Data
    }

    private let lock = NSLock()
    private var replies: [Reply]
    private(set) var requests: [URLRequest] = []

    init(replies: [Reply]) {
        self.replies = replies
    }

    convenience init(status: Int = 200, json: String) {
        self.init(replies: [Reply(status: status, body: Data(json.utf8))])
    }

    func data(for request: URLRequest) async throws -> (Data, HTTPURLResponse) {
        lock.lock()
        defer { lock.unlock() }
        requests.append(request)
        let reply = replies.isEmpty ? Reply(status: 204, body: Data()) : replies.removeFirst()
        let response = HTTPURLResponse(url: request.url!, statusCode: reply.status, httpVersion: nil, headerFields: nil)!
        return (reply.body, response)
    }
}

extension JellyfinClient {
    static func test(transport: StubTransport, token: String? = "tok", userID: String? = "user-1") -> JellyfinClient {
        JellyfinClient(
            serverURL: URL(string: "https://media.example.com/jellyfin")!,
            identity: ClientIdentity(clientName: "Marquee", deviceName: "Test", deviceID: "device-1", version: "1.0"),
            accessToken: token,
            userID: userID,
            transport: transport
        )
    }
}
