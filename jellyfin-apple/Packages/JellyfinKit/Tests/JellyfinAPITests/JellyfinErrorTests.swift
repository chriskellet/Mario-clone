import Foundation
import Testing
@testable import JellyfinAPI

/// `errorDescription` routes through a `#if canImport(Darwin)` helper so the package keeps
/// compiling on Linux, where `String(localized:)` doesn't exist. These tests just confirm every
/// case still produces a sensible, non-empty message on whichever platform runs the suite.
@Suite("JellyfinError")
struct JellyfinErrorTests {
    static let allCases: [JellyfinError] = [
        .invalidServerURL,
        .invalidResponse,
        .notSignedIn,
        .unauthorized,
        .forbidden,
        .notFound,
        .server(statusCode: 500, body: "oops"),
        .decoding(underlying: "bad json"),
        .transport(underlying: "offline"),
        .noPlayableMediaSource,
    ]

    @Test("Every case has a non-empty description", arguments: allCases)
    func hasDescription(_ error: JellyfinError) {
        #expect(!(error.errorDescription ?? "").isEmpty)
    }

    @Test("The status code is interpolated into the server error message")
    func interpolatesStatusCode() {
        let message = JellyfinError.server(statusCode: 503, body: "").errorDescription
        #expect(message?.contains("503") == true)
    }
}
