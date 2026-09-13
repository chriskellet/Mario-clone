import Foundation
#if canImport(FoundationNetworking)
import FoundationNetworking
#endif

/// The one object the app talks to. Owns the server URL, the client identity and the current token.
///
/// It is an actor so the token can change (sign in / sign out) without data races, and so
/// every request sees a consistent view of the session.
public actor JellyfinClient {
    public let serverURL: URL
    public let identity: ClientIdentity
    public private(set) var accessToken: String?
    public private(set) var userID: String?

    private let transport: any HTTPTransport
    private let decoder = JSONCoding.makeDecoder()
    private let encoder = JSONCoding.makeEncoder()

    public init(
        serverURL: URL,
        identity: ClientIdentity,
        accessToken: String? = nil,
        userID: String? = nil,
        transport: any HTTPTransport = URLSessionTransport()
    ) {
        self.serverURL = serverURL
        self.identity = identity
        self.accessToken = accessToken
        self.userID = userID
        self.transport = transport
    }

    public var isSignedIn: Bool { accessToken != nil && userID != nil }

    public func updateSession(accessToken: String?, userID: String?) {
        self.accessToken = accessToken
        self.userID = userID
    }

    /// The signed-in user's identifier, or a thrown `notSignedIn` for endpoints that need it.
    public func requireUserID() throws -> String {
        guard let userID else { throw JellyfinError.notSignedIn }
        return userID
    }

    // MARK: Sending

    public func send<Response>(_ endpoint: Endpoint<Response>) async throws -> Response {
        let request = try makeRequest(for: endpoint)
        let (data, response): (Data, HTTPURLResponse)
        do {
            (data, response) = try await transport.data(for: request)
        } catch let error as JellyfinError {
            throw error
        } catch {
            throw JellyfinError.transport(underlying: error.localizedDescription)
        }
        try Self.validate(response, data: data)
        return try decode(Response.self, from: data)
    }

    public func makeRequest<Response>(for endpoint: Endpoint<Response>) throws -> URLRequest {
        if endpoint.requiresAuthentication, accessToken == nil {
            throw JellyfinError.notSignedIn
        }
        let url = try Self.url(base: serverURL, path: endpoint.path, query: endpoint.query)
        var request = URLRequest(url: url)
        request.httpMethod = endpoint.method.rawValue
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        request.setValue(
            AuthorizationHeader.value(identity: identity, token: accessToken),
            forHTTPHeaderField: AuthorizationHeader.name
        )
        if let body = endpoint.body {
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            request.httpBody = try encoder.encode(AnyEncodable(body))
        }
        return request
    }

    /// Builds an absolute URL for media or images, adding the token as a query parameter
    /// because `AVPlayer` and image pipelines can't add headers per request reliably.
    public nonisolated func mediaURL(path: String, query: [URLQueryItem] = [], token: String?) throws -> URL {
        var query = query
        if let token {
            query.append(URLQueryItem(name: "api_key", value: token))
        }
        return try Self.url(base: serverURL, path: path, query: query)
    }

    // MARK: Internals

    static func url(base: URL, path: String, query: [URLQueryItem]) throws -> URL {
        let trimmed = path.hasPrefix("/") ? String(path.dropFirst()) : path
        let joined = base.appendingPathComponent(trimmed)
        guard var components = URLComponents(url: joined, resolvingAgainstBaseURL: false) else {
            throw JellyfinError.invalidServerURL
        }
        components.queryItems = query.isEmpty ? nil : query
        guard let url = components.url else { throw JellyfinError.invalidServerURL }
        return url
    }

    static func validate(_ response: HTTPURLResponse, data: Data) throws {
        switch response.statusCode {
        case 200..<300:
            return
        case 401:
            throw JellyfinError.unauthorized
        case 403:
            throw JellyfinError.forbidden
        case 404:
            throw JellyfinError.notFound
        default:
            throw JellyfinError.server(
                statusCode: response.statusCode,
                body: String(decoding: data.prefix(2_000), as: UTF8.self)
            )
        }
    }

    private func decode<T: Decodable>(_ type: T.Type, from data: Data) throws -> T {
        if T.self == EmptyResponse.self {
            // Swift can't prove the cast statically; EmptyResponse has no state so it's safe.
            return EmptyResponse() as! T
        }
        do {
            return try decoder.decode(T.self, from: data)
        } catch {
            throw JellyfinError.decoding(underlying: String(describing: error))
        }
    }
}

/// Type-erases a body so `JSONEncoder` can encode an existential.
struct AnyEncodable: Encodable {
    private let encodeImpl: @Sendable (Encoder) throws -> Void

    init(_ wrapped: any Encodable & Sendable) {
        encodeImpl = { encoder in try wrapped.encode(to: encoder) }
    }

    func encode(to encoder: Encoder) throws {
        try encodeImpl(encoder)
    }
}
