import Foundation

public enum JellyfinError: Error, Sendable {
    case invalidServerURL
    case invalidResponse
    case notSignedIn
    case unauthorized
    case forbidden
    case notFound
    case server(statusCode: Int, body: String)
    case decoding(underlying: String)
    case transport(underlying: String)
    case noPlayableMediaSource
}

extension JellyfinError: LocalizedError {
    public var errorDescription: String? {
        switch self {
        case .invalidServerURL:
            return String(localized: "That doesn't look like a valid server address.")
        case .invalidResponse:
            return String(localized: "The server sent an unexpected response.")
        case .notSignedIn:
            return String(localized: "You're not signed in.")
        case .unauthorized:
            return String(localized: "The username or password is incorrect.")
        case .forbidden:
            return String(localized: "You don't have permission to do that.")
        case .notFound:
            return String(localized: "The item couldn't be found on the server.")
        case .server(let statusCode, _):
            return String(localized: "The server returned an error (\(statusCode)).")
        case .decoding:
            return String(localized: "The server's response couldn't be read.")
        case .transport:
            return String(localized: "Couldn't reach the server. Check your connection and address.")
        case .noPlayableMediaSource:
            return String(localized: "This item has no playable video.")
        }
    }
}
