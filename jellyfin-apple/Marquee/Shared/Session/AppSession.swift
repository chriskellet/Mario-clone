import Foundation
import Observation
import JellyfinAPI

/// Top-level authentication state. Restores a saved session on launch and swaps it on sign in/out.
@MainActor
@Observable
final class AppSession {
    enum State {
        case restoring
        case signedOut
        case signedIn(ActiveSession)

        var isSignedIn: Bool {
            if case .signedIn = self { return true }
            return false
        }
    }

    private(set) var state: State = .restoring
    let identity: ClientIdentity

    private let store: SessionStore

    init(store: SessionStore = SessionStore(), identity: ClientIdentity = DeviceIdentity.make()) {
        self.store = store
        self.identity = identity
    }

    func restore() async {
        guard case .restoring = state else { return }
        guard let stored = store.load() else {
            state = .signedOut
            return
        }
        let session = ActiveSession(stored: stored, identity: identity)
        state = .signedIn(session)
        // Refresh the user in the background; a 401 means the token was revoked server-side.
        do {
            try await session.refreshUser()
        } catch JellyfinError.unauthorized {
            await signOut()
        } catch {
            // Offline or transient: keep the cached session.
        }
    }

    func activate(server: ServerDescriptor, auth: AuthenticationResult) {
        let stored = StoredSession(server: server, userID: auth.user.id, userName: auth.user.name, accessToken: auth.accessToken)
        try? store.save(stored)
        state = .signedIn(ActiveSession(stored: stored, identity: identity, user: auth.user))
    }

    func signOut() async {
        if case .signedIn(let session) = state {
            _ = try? await session.client.send(AuthEndpoints.logout())
        }
        store.clear()
        state = .signedOut
    }
}
