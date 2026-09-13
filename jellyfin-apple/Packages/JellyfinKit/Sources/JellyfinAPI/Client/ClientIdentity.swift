import Foundation

/// How this app introduces itself to the server. Shown in the Jellyfin dashboard's device list.
public struct ClientIdentity: Sendable, Hashable {
    public var clientName: String
    public var deviceName: String
    public var deviceID: String
    public var version: String

    public init(clientName: String, deviceName: String, deviceID: String, version: String) {
        self.clientName = clientName
        self.deviceName = deviceName
        self.deviceID = deviceID
        self.version = version
    }
}

/// Builds the `Authorization: MediaBrowser ...` header Jellyfin expects.
public enum AuthorizationHeader {
    public static let name = "Authorization"

    public static func value(identity: ClientIdentity, token: String?) -> String {
        var pairs: [(String, String)] = [
            ("Client", identity.clientName),
            ("Device", identity.deviceName),
            ("DeviceId", identity.deviceID),
            ("Version", identity.version),
        ]
        if let token {
            pairs.append(("Token", token))
        }
        let rendered = pairs
            .map { "\($0.0)=\"\(escape($0.1))\"" }
            .joined(separator: ", ")
        return "MediaBrowser \(rendered)"
    }

    private static func escape(_ value: String) -> String {
        value.replacingOccurrences(of: "\"", with: "")
    }
}
