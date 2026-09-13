import SwiftUI
import JellyfinAPI

/// Movies, episodes and other single videos.
struct ItemDetailView: View {
    @Environment(ActiveSession.self) private var session
    @Environment(PlaybackCoordinator.self) private var playback
    @State private var model: ItemDetailModel

    init(item: BaseItem) {
        _model = State(initialValue: ItemDetailModel(item: item))
    }

    var body: some View {
        DetailScaffold(item: model.item) {
            DetailTitleBlock(item: model.item)
            PlayButtons(item: model.item)
            DetailActions(model: model)
            DetailOverview(item: model.item)
            if model.item.type == .episode, let seriesID = model.item.seriesId, let seriesName = model.item.seriesName {
                SeriesLink(seriesID: seriesID, seriesName: seriesName, item: model.item)
            }
            CastShelf(people: model.item.people)
        }
        .task(id: playback.generation) { await model.load(using: session.library) }
    }
}

/// Backdrop plus a content column that overlaps its fade. Shared by every detail screen.
struct DetailScaffold<Content: View>: View {
    let item: BaseItem
    @ViewBuilder let content: () -> Content

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                BackdropHeader(item: item)
                VStack(alignment: .leading, spacing: 20) {
                    content()
                }
                .padding(.horizontal, Metrics.horizontalInset)
                .padding(.bottom, 40)
                .offset(y: -Metrics.backdropHeight * 0.28)
                .padding(.bottom, -Metrics.backdropHeight * 0.28)
            }
        }
        .scrollClipDisabled()
        #if os(iOS)
        .ignoresSafeArea(edges: .top)
        .navigationBarTitleDisplayMode(.inline)
        .toolbarBackgroundVisibility(.hidden, for: .navigationBar)
        #endif
    }
}

struct DetailTitleBlock: View {
    let item: BaseItem
    @Environment(ActiveSession.self) private var session
    @Environment(\.displayScale) private var displayScale

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            if item.type == .episode, let seriesName = item.seriesName {
                Text(seriesName)
                    .font(.headline)
                    .foregroundStyle(.secondary)
            }
            if let logo = session.images.logo(for: item, maxWidth: Int(400 * displayScale)), item.type != .episode {
                RemoteImage(url: logo, contentMode: .fit)
                    .frame(maxWidth: 320, maxHeight: 110, alignment: .leading)
                    .accessibilityLabel(item.name)
            } else {
                Text(item.name)
                    .font(.largeTitle.bold())
                    .lineLimit(3)
            }
            HStack(spacing: 8) {
                if let code = item.episodeCode {
                    Text(code)
                }
                Text(Formatters.metadataLine(for: item))
                if let rating = Formatters.rating(item.communityRating) {
                    Label(rating, systemImage: "star.fill")
                        .labelStyle(.titleAndIcon)
                }
            }
            .font(.subheadline)
            .foregroundStyle(.secondary)
            if !item.genres.isEmpty {
                Text(item.genres.prefix(4).joined(separator: " · "))
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
        }
    }
}

struct DetailOverview: View {
    let item: BaseItem
    @State private var expanded = false

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            if let tagline = item.taglines.first {
                Text(tagline)
                    .font(.headline)
                    .italic()
            }
            if let overview = item.overview, !overview.isEmpty {
                #if os(tvOS)
                Text(overview)
                    .font(.body)
                    .foregroundStyle(.secondary)
                    .lineLimit(4)
                    .frame(maxWidth: 900, alignment: .leading)
                #else
                Text(overview)
                    .font(.body)
                    .lineLimit(expanded ? nil : 4)
                    .onTapGesture { withAnimation(.snappy) { expanded.toggle() } }
                    .accessibilityAddTraits(.isButton)
                    .accessibilityHint(expanded ? "Collapses the description" : "Expands the description")
                #endif
            }
        }
    }
}

/// Watched and favourite toggles. tvOS puts them on the same row as Play for a single focus row.
struct DetailActions: View {
    let model: ItemDetailModel
    @Environment(ActiveSession.self) private var session

    var body: some View {
        HStack(spacing: 12) {
            Button {
                Task { await model.togglePlayed(using: session.library) }
            } label: {
                Label(model.item.isPlayed ? "Watched" : "Mark as Watched", systemImage: model.item.isPlayed ? "checkmark.circle.fill" : "checkmark.circle")
            }
            Button {
                Task { await model.toggleFavorite(using: session.library) }
            } label: {
                Label(model.item.isFavorite ? "Favourite" : "Add to Favourites", systemImage: model.item.isFavorite ? "heart.fill" : "heart")
            }
        }
        .buttonStyle(.bordered)
        .font(.subheadline)
        .alert("Couldn't Update", isPresented: Binding(
            get: { model.actionError != nil },
            set: { if !$0 { model.clearActionError() } }
        )) {
            Button("OK", role: .cancel) {}
        } message: {
            Text(model.actionError?.localizedDescription ?? "")
        }
    }
}

struct SeriesLink: View {
    let seriesID: String
    let seriesName: String
    let item: BaseItem

    var body: some View {
        NavigationLink(value: Route.item(item.asSeriesStub(id: seriesID, name: seriesName))) {
            Label("Go to \(seriesName)", systemImage: "tv")
        }
        .buttonStyle(.bordered)
        .font(.subheadline)
    }
}

extension BaseItem {
    /// A minimal series item so navigation can push the series page from an episode.
    /// The page fetches the full record on appear; the backdrop carries over to avoid a flash.
    func asSeriesStub(id: String, name: String) -> BaseItem {
        var stub = BaseItem(id: id, name: name, type: .series)
        if parentBackdropItemId == id {
            stub.backdropImageTags = parentBackdropImageTags
        }
        return stub
    }
}
