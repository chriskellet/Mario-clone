import SwiftUI
import JellyfinAPI

struct SearchView: View {
    @Environment(ActiveSession.self) private var session
    @State private var model = SearchModel()

    private let posterColumns = [GridItem(.adaptive(minimum: Metrics.gridMinimum), spacing: Metrics.gridSpacing, alignment: .top)]
    private let landscapeColumns = [GridItem(.adaptive(minimum: Metrics.landscapeWidth), spacing: Metrics.gridSpacing, alignment: .top)]

    var body: some View {
        content
            .navigationTitle("Search")
            .searchable(text: $model.query, prompt: "Movies, Shows and Episodes")
            .task(id: model.query) { await model.search(using: session.library) }
    }

    @ViewBuilder
    private var content: some View {
        if let results = model.results {
            if results.isEmpty {
                ContentUnavailableView.search(text: results.term)
            } else {
                resultsView(results)
            }
        } else if let error = model.error {
            ErrorStateView(error: error)
        } else if model.isSearching {
            LoadingStateView()
        } else {
            EmptyStateView(title: "Search Your Library", systemImage: "magnifyingglass", description: "Find movies, shows and episodes by title.")
        }
    }

    private func resultsView(_ results: SearchModel.Results) -> some View {
        ScrollView {
            LazyVStack(alignment: .leading, spacing: Metrics.sectionSpacing) {
                if !results.movies.isEmpty {
                    resultSection("Movies") {
                        LazyVGrid(columns: posterColumns, spacing: Metrics.gridSpacing) {
                            ForEach(results.movies) { PosterCard(item: $0, width: nil) }
                        }
                    }
                }
                if !results.series.isEmpty {
                    resultSection("Shows") {
                        LazyVGrid(columns: posterColumns, spacing: Metrics.gridSpacing) {
                            ForEach(results.series) { PosterCard(item: $0, width: nil) }
                        }
                    }
                }
                if !results.episodes.isEmpty {
                    resultSection("Episodes") {
                        LazyVGrid(columns: landscapeColumns, spacing: Metrics.gridSpacing) {
                            ForEach(results.episodes) { LandscapeCard(item: $0, width: nil) }
                        }
                    }
                }
            }
            .padding(.horizontal, Metrics.horizontalInset)
            .padding(.vertical, Metrics.shelfLift + 8)
        }
        .scrollClipDisabled()
        .overlay(alignment: .top) {
            if model.isSearching {
                ProgressView()
                    .padding(8)
                    .background(.regularMaterial, in: .capsule)
                    .padding(.top, 8)
                    .transition(.opacity)
            }
        }
        .animation(.default, value: model.isSearching)
    }

    private func resultSection<Content: View>(_ title: LocalizedStringKey, @ViewBuilder content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: 10) {
            Text(title)
                .font(.title3.weight(.semibold))
                .accessibilityAddTraits(.isHeader)
            content()
        }
    }
}
