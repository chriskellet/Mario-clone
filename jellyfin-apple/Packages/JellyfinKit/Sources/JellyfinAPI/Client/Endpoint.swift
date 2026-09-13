import Foundation

/// A typed description of one Jellyfin REST call. Building one never touches the network.
public struct Endpoint<Response: Decodable & Sendable>: Sendable {
    public var method: HTTPMethod
    /// Path relative to the server root, without a leading slash (for example `Users/Me`).
    public var path: String
    public var query: [URLQueryItem]
    public var body: (any Encodable & Sendable)?
    /// Whether the call needs an access token. Public endpoints (server info, sign in) do not.
    public var requiresAuthentication: Bool

    public init(
        _ method: HTTPMethod,
        _ path: String,
        query: [URLQueryItem] = [],
        body: (any Encodable & Sendable)? = nil,
        requiresAuthentication: Bool = true
    ) {
        self.method = method
        self.path = path.hasPrefix("/") ? String(path.dropFirst()) : path
        self.query = query
        self.body = body
        self.requiresAuthentication = requiresAuthentication
    }
}

/// Placeholder for endpoints that return `204 No Content`.
public struct EmptyResponse: Decodable, Sendable {
    public init() {}
}

// MARK: - Query helpers

extension Array where Element == URLQueryItem {
    /// Appends an item only when the value is present, keeping call sites tidy.
    mutating func append(_ name: String, _ value: String?) {
        guard let value else { return }
        append(URLQueryItem(name: name, value: value))
    }

    mutating func append(_ name: String, _ value: Int?) {
        guard let value else { return }
        append(URLQueryItem(name: name, value: String(value)))
    }

    mutating func append(_ name: String, _ value: Bool?) {
        guard let value else { return }
        append(URLQueryItem(name: name, value: value ? "true" : "false"))
    }

    mutating func append<T: RawRepresentable>(_ name: String, _ values: [T]?) where T.RawValue == String {
        guard let values, !values.isEmpty else { return }
        append(URLQueryItem(name: name, value: values.map(\.rawValue).joined(separator: ",")))
    }
}
