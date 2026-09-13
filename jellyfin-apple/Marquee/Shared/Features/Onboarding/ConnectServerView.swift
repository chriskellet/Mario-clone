import SwiftUI

struct ConnectServerView: View {
    @Bindable var model: OnboardingModel
    @FocusState private var addressFocused: Bool

    var body: some View {
        OnboardingColumn(
            systemImage: "play.tv",
            title: "Connect to Jellyfin",
            subtitle: "Enter your server's address. Local addresses like 192.168.1.10:8096 work too."
        ) {
            VStack(spacing: 16) {
                TextField("Server address", text: $model.address, prompt: Text("jellyfin.example.com"))
                    .textContentType(.URL)
                    .keyboardType(.URL)
                    .textInputAutocapitalization(.never)
                    .autocorrectionDisabled()
                    .submitLabel(.go)
                    .focused($addressFocused)
                    .onSubmit { connect() }
                    .disabled(model.isBusy)
                    #if os(iOS)
                    .textFieldStyle(.roundedBorder)
                    #endif

                Button(action: connect) {
                    if model.isBusy {
                        ProgressView()
                            .frame(maxWidth: .infinity)
                    } else {
                        Text("Connect")
                            .frame(maxWidth: .infinity)
                    }
                }
                .buttonStyle(.borderedProminent)
                .disabled(model.isBusy || model.address.trimmingCharacters(in: .whitespaces).isEmpty)

                if let message = model.errorMessage {
                    Text(message)
                        .font(.footnote)
                        .foregroundStyle(.red)
                        .multilineTextAlignment(.center)
                        .transition(.opacity)
                }
            }
            #if os(iOS)
            .controlSize(.large)
            #endif
        }
        .animation(.default, value: model.errorMessage)
        #if os(iOS)
        .onAppear { addressFocused = true }
        #endif
    }

    private func connect() {
        Task { await model.connect() }
    }
}
