import SwiftUI
import JellyfinAPI

struct HomeView: View {
    @Environment(ActiveSession.self) private var session
    @Environment(PlaybackCoordinator.self) private var playback
    @State private var model = HomeModel()
    @State private var showsSettings = false

    var body: some View {
        Group {
            switch model.state {
            case .idle, .loading:
                LoadingStateView()
            case .failed(let error):
                ErrorStateView(error: error) { await model.load(using: session.library) }
            case .loaded(let sections):
                if sections.isEmpty {
                    EmptyStateView(title: "Nothing Here Yet", systemImage: "film.stack", description: "Add media to your Jellyfin libraries and it will show up here.")
                } else {
                    shelves(sections)
                }
            }
        }
        .navigationTitle("Home")
        .task(id: playback.generation) { await model.load(using: session.library) }
        #if os(iOS)
        .refreshable { await model.load(using: session.library) }
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button {
                    showsSettings = true
                } label: {
                    Label("Settings", systemImage: "person.crop.circle")
                }
            }
        }
        .sheet(isPresented: $showsSettings) {
            NavigationStack { SettingsView() }
        }
        #endif
    }

    private func shelves(_ sections: [HomeModel.HomeSection]) -> some View {
        ScrollView {
            LazyVStack(alignment: .leading, spacing: Metrics.sectionSpacing) {
                ForEach(sections) { section in
                    Shelf(
                        title: section.title,
                        items: section.items,
                        layout: section.layout,
                        showsSeriesName: section.showsSeriesName,
                        seeAll: section.seeAll
                    )
                }
            }
            .padding(.vertical, Metrics.sectionSpacing / 2)
        }
        .scrollClipDisabled()
    }
}
