import SwiftUI

/// The three states every data screen shares. Using the same views keeps the app consistent.
struct LoadingStateView: View {
    var body: some View {
        ProgressView()
            .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

struct ErrorStateView: View {
    let error: any Error
    var retry: (() async -> Void)? = nil

    var body: some View {
        ContentUnavailableView {
            Label("Something Went Wrong", systemImage: "exclamationmark.triangle")
        } description: {
            Text(error.localizedDescription)
        } actions: {
            if let retry {
                Button("Try Again") {
                    Task { await retry() }
                }
                .buttonStyle(.borderedProminent)
            }
        }
    }
}

struct EmptyStateView: View {
    let title: LocalizedStringKey
    let systemImage: String
    var description: LocalizedStringKey? = nil

    var body: some View {
        ContentUnavailableView {
            Label(title, systemImage: systemImage)
        } description: {
            if let description {
                Text(description)
            }
        }
    }
}

/// Loading lifecycle for a screen's primary content.
enum LoadState<Value> {
    case idle
    case loading
    case loaded(Value)
    case failed(any Error)

    var value: Value? {
        if case .loaded(let value) = self { return value }
        return nil
    }

    var isLoading: Bool {
        if case .loading = self { return true }
        return false
    }
}
