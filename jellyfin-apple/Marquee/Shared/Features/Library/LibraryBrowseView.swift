import SwiftUI
import JellyfinAPI

struct LibraryBrowseView: View {
    let scope: BrowseScope

    @Environment(ActiveSession.self) private var session
    @State private var model: LibraryBrowseModel

    init(scope: BrowseScope) {
        self.scope = scope
        _model = State(initialValue: LibraryBrowseModel(scope: scope))
    }

    private let columns = [GridItem(.adaptive(minimum: Metrics.gridMinimum), spacing: Metrics.gridSpacing, alignment: .top)]

    var body: some View {
        Group {
            switch model.state {
            case .idle, .loading:
                LoadingStateView()
            case .failed(let error):
                ErrorStateView(error: error) { await model.reload(using: session.library) }
            case .loaded:
                if model.items.isEmpty {
                    EmptyStateView(title: "No Items", systemImage: "square.grid.2x2", description: "Nothing matches the current filters.")
                } else {
                    grid
                }
            }
        }
        .navigationTitle(scope.title)
        .task(id: model.criteria) { await model.reload(using: session.library) }
        #if os(iOS)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                SortFilterMenu(model: model)
            }
        }
        .refreshable { await model.reload(using: session.library) }
        #endif
    }

    private var grid: some View {
        ScrollView {
            #if os(tvOS)
            SortFilterMenu(model: model)
                .padding(.horizontal, Metrics.horizontalInset)
                .padding(.bottom, Metrics.gridSpacing)
            #endif
            LazyVGrid(columns: columns, spacing: Metrics.gridSpacing) {
                ForEach(model.items) { item in
                    PosterCard(item: item, width: nil)
                        .task { await model.loadMoreIfNeeded(current: item, using: session.library) }
                }
            }
            .padding(.horizontal, Metrics.horizontalInset)
            .padding(.vertical, Metrics.shelfLift)

            if model.isLoadingMore {
                ProgressView()
                    .padding()
            }
        }
        .scrollClipDisabled()
    }
}

/// Sort and filter controls. A toolbar menu on iOS; an inline bar on tvOS.
struct SortFilterMenu: View {
    @Bindable var model: LibraryBrowseModel

    var body: some View {
        #if os(tvOS)
        // `Menu` is unavailable on tvOS, so the controls sit inline and use the focus engine.
        // TODO: check the inline bar's default picker rendering on a real Apple TV.
        HStack(spacing: 24) {
            Picker("Sort", selection: $model.criteria.sort) {
                ForEach(model.sortOptions, id: \.self) { option in
                    Text(option.title).tag(option)
                }
            }
            Button {
                model.criteria.order = model.criteria.order == .ascending ? .descending : .ascending
            } label: {
                Label(
                    model.criteria.order == .ascending ? "Ascending" : "Descending",
                    systemImage: model.criteria.order == .ascending ? "arrow.up" : "arrow.down"
                )
            }
            Toggle("Unwatched", isOn: $model.criteria.unplayedOnly)
            Toggle("Favourites", isOn: $model.criteria.favoritesOnly)
            Spacer()
        }
        .font(.callout)
        #else
        Menu {
            sortMenu
            Divider()
            Toggle("Unwatched", isOn: $model.criteria.unplayedOnly)
            Toggle("Favourites", isOn: $model.criteria.favoritesOnly)
        } label: {
            Label("Sort and Filter", systemImage: isFiltered ? "line.3.horizontal.decrease.circle.fill" : "line.3.horizontal.decrease.circle")
        }
        #endif
    }

    #if !os(tvOS)
    private var isFiltered: Bool {
        model.criteria.unplayedOnly || model.criteria.favoritesOnly
    }

    private var sortMenu: some View {
        Menu {
            Picker("Sort By", selection: $model.criteria.sort) {
                ForEach(model.sortOptions, id: \.self) { option in
                    Text(option.title).tag(option)
                }
            }
            Picker("Order", selection: $model.criteria.order) {
                // Qualified: Foundation also declares `SortOrder`.
                Text("Ascending").tag(JellyfinAPI.SortOrder.ascending)
                Text("Descending").tag(JellyfinAPI.SortOrder.descending)
            }
        } label: {
            Label("Sort: \(model.criteria.sort.title)", systemImage: "arrow.up.arrow.down")
        }
    }
    #endif
}
