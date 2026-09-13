import Foundation
import UIKit
import JellyfinAPI

/// How this install identifies itself to the server. The device id is generated once and kept.
enum DeviceIdentity {
    static let clientName = "Marquee"

    /// `UIDevice` is main-actor isolated, so this is too. It is only ever called while
    /// building `AppSession`, which is itself main-actor isolated.
    @MainActor
    static func make(keychain: KeychainStore = .shared) -> ClientIdentity {
        ClientIdentity(
            clientName: clientName,
            deviceName: deviceName,
            deviceID: persistentDeviceID(keychain: keychain),
            version: appVersion
        )
    }

    static var appVersion: String {
        Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "0.0"
    }

    @MainActor
    private static var deviceName: String {
        #if os(tvOS)
        return "Apple TV"
        #else
        return UIDevice.current.model
        #endif
    }

    private static func persistentDeviceID(keychain: KeychainStore) -> String {
        let account = "deviceId"
        if let existing = keychain.string(for: account) {
            return existing
        }
        let fresh = UUID().uuidString
        try? keychain.set(fresh, for: account)
        return fresh
    }
}
