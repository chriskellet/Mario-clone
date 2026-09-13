import Foundation

public enum AuthEndpoints {
    public static func authenticateByName(username: String, password: String) -> Endpoint<AuthenticationResult> {
        Endpoint(
            .post,
            "Users/AuthenticateByName",
            body: AuthenticateByNameRequest(username: username, pw: password),
            requiresAuthentication: false
        )
    }

    public static func quickConnectEnabled() -> Endpoint<Bool> {
        Endpoint(.get, "QuickConnect/Enabled", requiresAuthentication: false)
    }

    public static func quickConnectInitiate() -> Endpoint<QuickConnectResult> {
        Endpoint(.post, "QuickConnect/Initiate", requiresAuthentication: false)
    }

    public static func quickConnectStatus(secret: String) -> Endpoint<QuickConnectResult> {
        Endpoint(.get, "QuickConnect/Connect", query: [URLQueryItem(name: "secret", value: secret)], requiresAuthentication: false)
    }

    public static func authenticateWithQuickConnect(secret: String) -> Endpoint<AuthenticationResult> {
        Endpoint(
            .post,
            "Users/AuthenticateWithQuickConnect",
            body: QuickConnectAuthenticateRequest(secret: secret),
            requiresAuthentication: false
        )
    }

    public static func currentUser() -> Endpoint<User> {
        Endpoint(.get, "Users/Me")
    }

    public static func logout() -> Endpoint<EmptyResponse> {
        Endpoint(.post, "Sessions/Logout")
    }
}
