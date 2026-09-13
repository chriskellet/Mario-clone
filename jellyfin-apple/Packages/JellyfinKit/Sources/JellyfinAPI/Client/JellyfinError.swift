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
            return localizedErrorString("That doesn't look like a valid server address.")
        case .invalidResponse:
            return localizedErrorString("The server sent an unexpected response.")
        case .notSignedIn:
            return localizedErrorString("You're not signed in.")
        case .unauthorized:
            return localizedErrorString("The username or password is incorrect.")
        case .forbidden:
            return localizedErrorString("You don't have permission to do that.")
        case .notFound:
            return localizedErrorString("The item couldn't be found on the server.")
        case .server(let statusCode, _):
            return localizedErrorString("The server returned an error (\(statusCode)).")
        case .decoding:
            return localizedErrorString("The server's response couldn't be read.")
        case .transport:
            return localizedErrorString("Couldn't reach the server. Check your connection and address.")
        case .noPlayableMediaSource:
            return localizedErrorString("This item has no playable video.")
        }
    }
}

// `String(localized:)` (and `String.LocalizationValue`) are part of the Apple-only Foundation
// overlay and are not implemented by swift-corelibs-foundation, so this package (which must also
// build on Linux for `swift test`) can't call it unconditionally. Fall back to the plain,
// un-localized string there.
#if canImport(Darwin)
private func localizedErrorString(_ value: String.LocalizationValue) -> String {
    String(localized: value)
}
#else
private func localizedErrorString(_ value: String) -> String {
    value
}
#endif
