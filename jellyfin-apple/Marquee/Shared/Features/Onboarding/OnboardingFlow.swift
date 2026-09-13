import SwiftUI

struct OnboardingFlow: View {
    @Environment(AppSession.self) private var appSession
    @State private var model: OnboardingModel?

    var body: some View {
        Group {
            if let model {
                OnboardingContent(model: model)
            } else {
                ProgressView()
            }
        }
        .onAppear {
            if model == nil {
                model = OnboardingModel(identity: appSession.identity)
            }
        }
    }
}

private struct OnboardingContent: View {
    @Bindable var model: OnboardingModel

    var body: some View {
        ZStack {
            switch model.stage {
            case .server:
                ConnectServerView(model: model)
                    .transition(.move(edge: .leading).combined(with: .opacity))
            case .signIn(let server):
                SignInView(model: model, serverName: server.name)
                    .transition(.move(edge: .trailing).combined(with: .opacity))
            }
        }
        .animation(.snappy, value: model.stage)
    }
}

/// Centred column used by both onboarding screens.
struct OnboardingColumn<Content: View>: View {
    let systemImage: String
    let title: LocalizedStringKey
    let subtitle: LocalizedStringKey
    @ViewBuilder let content: () -> Content

    var body: some View {
        ScrollView {
            VStack(spacing: 24) {
                Image(systemName: systemImage)
                    .font(.system(size: 56))
                    .foregroundStyle(.tint)
                    .padding(.top, 48)
                VStack(spacing: 8) {
                    Text(title)
                        .font(.largeTitle.bold())
                    Text(subtitle)
                        .foregroundStyle(.secondary)
                        .multilineTextAlignment(.center)
                }
                content()
            }
            .frame(maxWidth: Self.maxWidth)
            .frame(maxWidth: .infinity)
            .padding(.horizontal, 24)
        }
        .scrollBounceBehavior(.basedOnSize)
    }

    private static var maxWidth: CGFloat {
        #if os(tvOS)
        return 760
        #else
        return 420
        #endif
    }
}
