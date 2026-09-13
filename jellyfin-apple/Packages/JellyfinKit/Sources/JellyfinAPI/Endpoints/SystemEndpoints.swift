import Foundation

public enum SystemEndpoints {
    /// Unauthenticated. Used to validate a server address before signing in.
    public static func publicInfo() -> Endpoint<PublicSystemInfo> {
        Endpoint(.get, "System/Info/Public", requiresAuthentication: false)
    }
}
