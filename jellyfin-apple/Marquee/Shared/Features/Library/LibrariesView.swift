import SwiftUI
import JellyfinAPI

struct LibrariesView: View {
    @Environment(ActiveSession.self) private var session
    @State private var state: LoadState<[BaseItem]> = .idle

    private let columns = [GridItem(.adaptive(minimum: Metrics.landscapeWidth), spacing: Metrics.gridSpacing)]

    var body: some View {
        Group {
            switch state {
            case .idle, .loading:
                LoadingStateView()
            case .failed(let error):
                ErrorStateView(error: error) { await load() }
            case .loaded(let libraries):
                ScrollView {
                    LazyVGrid(columns: columns, spacing: Metrics.gridSpacing) {
                        ForEach(libraries) { library in
                            LibraryCard(library: library, width: nil)
                        }
                    }
                    .padding(.horizontal, Metrics.horizontalInset)
                    .padding(.vertical, Metrics.shelfLift)
                }
                .scrollClipDisabled()
            }
        }
        .navigationTitle("Library")
        .task { await load() }
        #if os(iOS)
        .refreshable { await load() }
        #endif
    }

    private func load() async {
        if case .idle = state { state = .loading }
        do {
            let views = try await session.library.views()
            state = .loaded(views.filter { ($0.collectionType ?? .unknown).isBrowsable })
        } catch {
            if state.value == nil { state = .failed(error) }
        }
    }
}
