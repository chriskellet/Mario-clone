import SwiftUI

struct SettingsView: View {
    @Environment(AppSession.self) private var appSession
    @Environment(ActiveSession.self) private var session
    @Environment(\.dismiss) private var dismiss
    @State private var confirmSignOut = false

    var body: some View {
        List {
            Section("Server") {
                LabeledContent("Name", value: session.server.name)
                LabeledContent("Address", value: session.server.url.absoluteString)
            }
            Section("Account") {
                LabeledContent("Signed in as", value: session.user.name)
                Button("Sign Out", role: .destructive) {
                    confirmSignOut = true
                }
            }
            Section("About") {
                LabeledContent("Version", value: DeviceIdentity.appVersion)
                // TODO: link to the project's public repository once it moves to its final home.
            }
        }
        .navigationTitle("Settings")
        .confirmationDialog("Sign out of \(session.server.name)?", isPresented: $confirmSignOut, titleVisibility: .visible) {
            Button("Sign Out", role: .destructive) {
                Task { await appSession.signOut() }
            }
        }
        #if os(iOS)
        .toolbar {
            ToolbarItem(placement: .confirmationAction) {
                Button("Done") { dismiss() }
            }
        }
        #endif
    }
}
