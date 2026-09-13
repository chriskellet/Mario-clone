import Foundation

struct ServerDescriptor: Codable, Hashable, Sendable {
    var url: URL
    var name: String
    var id: String
}

/// What survives app relaunches. Lives in the Keychain because it carries the access token.
struct StoredSession: Codable, Hashable, Sendable {
    var server: ServerDescriptor
    var userID: String
    var userName: String
    var accessToken: String
}

struct SessionStore: Sendable {
    private let keychain: KeychainStore
    private let account = "session"

    init(keychain: KeychainStore = .shared) {
        self.keychain = keychain
    }

    func load() -> StoredSession? {
        guard let data = keychain.data(for: account) else { return nil }
        return try? JSONDecoder().decode(StoredSession.self, from: data)
    }

    func save(_ session: StoredSession) throws {
        let data = try JSONEncoder().encode(session)
        try keychain.set(data, for: account)
    }

    func clear() {
        keychain.remove(account)
    }
}
