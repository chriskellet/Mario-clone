import Foundation

public struct User: Decodable, Sendable, Hashable, Identifiable {
    public var id: String
    public var name: String
    public var serverId: String?
    public var primaryImageTag: String?
    public var hasPassword: Bool?
    public var lastLoginDate: Date?
    public var policy: UserPolicy?

    public init(
        id: String,
        name: String,
        serverId: String? = nil,
        primaryImageTag: String? = nil,
        hasPassword: Bool? = nil,
        lastLoginDate: Date? = nil,
        policy: UserPolicy? = nil
    ) {
        self.id = id
        self.name = name
        self.serverId = serverId
        self.primaryImageTag = primaryImageTag
        self.hasPassword = hasPassword
        self.lastLoginDate = lastLoginDate
        self.policy = policy
    }
}

public struct UserPolicy: Decodable, Sendable, Hashable {
    public var isAdministrator: Bool?
    public var enableMediaPlayback: Bool?
    public var enableLiveTvAccess: Bool?
    public var enableRemoteAccess: Bool?
}

public struct AuthenticationResult: Decodable, Sendable {
    public var user: User
    public var accessToken: String
    public var serverId: String?
}

struct AuthenticateByNameRequest: Encodable, Sendable {
    var username: String
    var pw: String
}

struct QuickConnectAuthenticateRequest: Encodable, Sendable {
    var secret: String
}

public struct QuickConnectResult: Decodable, Sendable {
    public var authenticated: Bool
    public var secret: String
    public var code: String
    public var deviceId: String?
    public var deviceName: String?
    public var appName: String?
    public var appVersion: String?
    public var dateAdded: Date?
}
