import Foundation
import Observation
import JellyfinAPI

/// Drives connect → sign in. Quick Connect polling lives here so views stay declarative.
@MainActor
@Observable
final class OnboardingModel {
    enum Stage: Equatable {
        case server
        case signIn(ServerDescriptor)
    }

    enum QuickConnectState: Equatable {
        case unavailable
        case idle
        case waiting(code: String)
        case authenticating
    }

    var stage: Stage = .server
    var address = ""
    var username = ""
    var password = ""
    private(set) var isBusy = false
    private(set) var errorMessage: String?
    private(set) var quickConnect: QuickConnectState = .unavailable

    private let identity: ClientIdentity
    private var client: JellyfinClient?
    private var pollTask: Task<Void, Never>?

    init(identity: ClientIdentity) {
        self.identity = identity
    }

    // MARK: Server

    func connect() async {
        errorMessage = nil
        let candidates = ServerAddress.candidates(for: address)
        guard !candidates.isEmpty else {
            errorMessage = JellyfinError.invalidServerURL.localizedDescription
            return
        }
        isBusy = true
        defer { isBusy = false }

        var lastError: (any Error)?
        for url in candidates {
            let probe = JellyfinClient(serverURL: url, identity: identity, transport: URLSessionTransport(session: .probe))
            do {
                let info = try await probe.send(SystemEndpoints.publicInfo())
                let server = ServerDescriptor(url: url, name: info.serverName, id: info.id)
                client = JellyfinClient(serverURL: url, identity: identity)
                stage = .signIn(server)
                await checkQuickConnectAvailability()
                return
            } catch {
                lastError = error
            }
        }
        errorMessage = lastError?.localizedDescription ?? JellyfinError.invalidResponse.localizedDescription
    }

    func changeServer() {
        cancelQuickConnect()
        stage = .server
        errorMessage = nil
        password = ""
    }

    // MARK: Password sign in

    func signIn(into appSession: AppSession) async {
        guard case .signIn(let server) = stage, let client else { return }
        errorMessage = nil
        isBusy = true
        defer { isBusy = false }
        do {
            let result = try await client.send(AuthEndpoints.authenticateByName(username: username, password: password))
            cancelQuickConnect()
            appSession.activate(server: server, auth: result)
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    // MARK: Quick Connect

    private func checkQuickConnectAvailability() async {
        guard let client else { return }
        let enabled = (try? await client.send(AuthEndpoints.quickConnectEnabled())) ?? false
        quickConnect = enabled ? .idle : .unavailable
    }

    func startQuickConnect(into appSession: AppSession) {
        guard case .signIn(let server) = stage, let client, pollTask == nil else { return }
        pollTask = Task { [weak self] in
            do {
                let initiated = try await client.send(AuthEndpoints.quickConnectInitiate())
                self?.quickConnect = .waiting(code: initiated.code)
                while !Task.isCancelled {
                    try await Task.sleep(for: .seconds(2))
                    let status = try await client.send(AuthEndpoints.quickConnectStatus(secret: initiated.secret))
                    if status.authenticated {
                        self?.quickConnect = .authenticating
                        let result = try await client.send(AuthEndpoints.authenticateWithQuickConnect(secret: initiated.secret))
                        appSession.activate(server: server, auth: result)
                        return
                    }
                }
            } catch is CancellationError {
                // Cancelled by the user or by a password sign-in.
            } catch {
                self?.errorMessage = error.localizedDescription
                self?.quickConnect = .idle
            }
            self?.pollTask = nil
        }
    }

    func cancelQuickConnect() {
        pollTask?.cancel()
        pollTask = nil
        if case .unavailable = quickConnect { return }
        quickConnect = .idle
    }
}

extension URLSession {
    /// Short timeouts for probing candidate addresses, so a wrong guess fails fast.
    static let probe: URLSession = {
        let configuration = URLSessionConfiguration.ephemeral
        configuration.timeoutIntervalForRequest = 6
        configuration.timeoutIntervalForResource = 8
        configuration.waitsForConnectivity = false
        return URLSession(configuration: configuration)
    }()
}
