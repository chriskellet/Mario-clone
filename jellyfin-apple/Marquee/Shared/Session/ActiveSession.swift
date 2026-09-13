import Foundation
import Observation
import JellyfinAPI

/// Everything a signed-in screen needs: the client plus the domain services built on it.
@MainActor
@Observable
final class ActiveSession {
    let server: ServerDescriptor
    let client: JellyfinClient
    let images: ImageURLBuilder
    let library: any LibraryServicing
    let playback: any PlaybackServicing
    private(set) var user: User

    init(stored: StoredSession, identity: ClientIdentity, user: User? = nil) {
        server = stored.server
        client = JellyfinClient(
            serverURL: stored.server.url,
            identity: identity,
            accessToken: stored.accessToken,
            userID: stored.userID
        )
        images = ImageURLBuilder(serverURL: stored.server.url)
        library = JellyfinLibraryService(client: client)
        playback = JellyfinPlaybackService(client: client, identity: identity)
        self.user = user ?? User(id: stored.userID, name: stored.userName)
    }

    func refreshUser() async throws {
        user = try await client.send(AuthEndpoints.currentUser())
    }
}
