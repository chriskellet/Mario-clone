import SwiftUI

struct SignInView: View {
    @Bindable var model: OnboardingModel
    let serverName: String
    @Environment(AppSession.self) private var appSession
    @FocusState private var focus: Field?
    @State private var autoStartedQuickConnect = false

    private enum Field { case username, password }

    var body: some View {
        OnboardingColumn(
            systemImage: "person.crop.circle",
            title: "Sign In",
            subtitle: "Connected to \(serverName)"
        ) {
            VStack(spacing: 24) {
                quickConnectSection
                credentialsSection
                Button("Use a Different Server") {
                    model.changeServer()
                }
                .buttonStyle(.plain)
                .foregroundStyle(.secondary)
                .font(.footnote)
            }
            #if os(iOS)
            .controlSize(.large)
            #endif
        }
        .animation(.default, value: model.quickConnect)
        .animation(.default, value: model.errorMessage)
        .onDisappear { model.cancelQuickConnect() }
        #if os(tvOS)
        // Typing on a remote is slow; put the code up immediately when the server supports it.
        .onChange(of: model.quickConnect, initial: true) { _, state in
            guard state == .idle, !autoStartedQuickConnect else { return }
            autoStartedQuickConnect = true
            model.startQuickConnect(into: appSession)
        }
        #endif
    }

    @ViewBuilder
    private var quickConnectSection: some View {
        switch model.quickConnect {
        case .unavailable:
            EmptyView()
        case .idle:
            Button {
                model.startQuickConnect(into: appSession)
            } label: {
                Label("Use Quick Connect", systemImage: "qrcode")
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(.bordered)
        case .waiting(let code):
            VStack(spacing: 12) {
                Text(code)
                    .font(.system(size: 44, weight: .semibold, design: .rounded))
                    .monospacedDigit()
                    .tracking(6)
                    .accessibilityLabel("Quick Connect code \(code.map(String.init).joined(separator: " "))")
                Text("Open Jellyfin on another device, go to Quick Connect in your user menu, and enter this code.")
                    .font(.footnote)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
                HStack(spacing: 8) {
                    ProgressView()
                    Text("Waiting for approval…")
                        .font(.footnote)
                        .foregroundStyle(.secondary)
                }
                Button("Cancel") { model.cancelQuickConnect() }
                    .buttonStyle(.plain)
                    .font(.footnote)
            }
            .padding(20)
            .frame(maxWidth: .infinity)
            .background(.regularMaterial, in: .rect(cornerRadius: 16))
        case .authenticating:
            ProgressView("Signing in…")
        }
    }

    private var credentialsSection: some View {
        VStack(spacing: 12) {
            TextField("Username", text: $model.username)
                .textContentType(.username)
                .textInputAutocapitalization(.never)
                .autocorrectionDisabled()
                .submitLabel(.next)
                .focused($focus, equals: .username)
                .onSubmit { focus = .password }
            SecureField("Password", text: $model.password)
                .textContentType(.password)
                .submitLabel(.go)
                .focused($focus, equals: .password)
                .onSubmit { signIn() }
            Button(action: signIn) {
                if model.isBusy {
                    ProgressView().frame(maxWidth: .infinity)
                } else {
                    Text("Sign In").frame(maxWidth: .infinity)
                }
            }
            .buttonStyle(.borderedProminent)
            .disabled(model.isBusy || model.username.isEmpty)

            if let message = model.errorMessage {
                Text(message)
                    .font(.footnote)
                    .foregroundStyle(.red)
                    .multilineTextAlignment(.center)
            }
        }
        #if os(iOS)
        .textFieldStyle(.roundedBorder)
        #endif
    }

    private func signIn() {
        Task { await model.signIn(into: appSession) }
    }
}
