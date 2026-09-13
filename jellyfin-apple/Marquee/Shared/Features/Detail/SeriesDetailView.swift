import SwiftUI
import JellyfinAPI

struct SeriesDetailView: View {
    @Environment(ActiveSession.self) private var session
    @Environment(PlaybackCoordinator.self) private var playback
    @State private var model: SeriesDetailModel

    init(series: BaseItem, initialSeasonID: String? = nil) {
        _model = State(initialValue: SeriesDetailModel(series: series, preferredSeasonID: initialSeasonID))
    }

    var body: some View {
        DetailScaffold(item: model.series) {
            DetailTitleBlock(item: model.series)
            if let nextUp = model.nextUp {
                NextUpBlock(episode: nextUp)
            }
            DetailOverview(item: model.series)
            if case .failed(let error) = model.state {
                ErrorStateView(error: error) { await model.load(using: session.library) }
            } else if !model.seasons.isEmpty {
                SeasonPicker(seasons: model.seasons, selection: $model.selectedSeasonID)
                EpisodeList(model: model)
            } else if model.state.isLoading {
                ProgressView()
            }
            CastShelf(people: model.series.people)
        }
        .task(id: playback.generation) { await model.load(using: session.library) }
        .task(id: model.selectedSeasonID) { await model.loadEpisodes(using: session.library) }
    }
}

/// "Up Next: S2 · E5 Title" with a Play button. The one thing most people came for.
struct NextUpBlock: View {
    let episode: BaseItem
    @Environment(PlaybackCoordinator.self) private var playback

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(episode.canResume ? "Continue Watching" : "Up Next")
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(.secondary)
            HStack(spacing: 12) {
                Button {
                    playback.play(episode, resume: true)
                } label: {
                    Label(playTitle, systemImage: "play.fill")
                        .frame(minWidth: 140)
                }
                .buttonStyle(.borderedProminent)
                #if os(iOS)
                .controlSize(.large)
                #endif
                VStack(alignment: .leading, spacing: 2) {
                    Text([episode.episodeCode, episode.name].compactMap { $0 }.joined(separator: "  "))
                        .font(.subheadline.weight(.medium))
                        .lineLimit(1)
                    if let remaining = Formatters.timeRemaining(item: episode) {
                        Text(remaining)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }
            }
        }
    }

    private var playTitle: String {
        episode.canResume ? String(localized: "Resume") : String(localized: "Play")
    }
}

struct SeasonPicker: View {
    let seasons: [BaseItem]
    @Binding var selection: String?

    var body: some View {
        #if os(tvOS)
        ScrollView(.horizontal) {
            HStack(spacing: 16) {
                ForEach(seasons) { season in
                    Button(season.name) { selection = season.id }
                        .buttonStyle(.bordered)
                        .tint(selection == season.id ? .accentColor : nil)
                }
            }
            .padding(.vertical, 12)
        }
        .scrollClipDisabled()
        #else
        if seasons.count <= 4 {
            Picker("Season", selection: $selection) {
                ForEach(seasons) { season in
                    Text(season.name).tag(Optional(season.id))
                }
            }
            .pickerStyle(.segmented)
        } else {
            Picker("Season", selection: $selection) {
                ForEach(seasons) { season in
                    Text(season.name).tag(Optional(season.id))
                }
            }
            .pickerStyle(.menu)
        }
        #endif
    }
}

struct EpisodeList: View {
    let model: SeriesDetailModel
    @Environment(ActiveSession.self) private var session

    var body: some View {
        LazyVStack(alignment: .leading, spacing: 16) {
            if model.episodesLoading, model.episodes.isEmpty {
                ProgressView()
                    .frame(maxWidth: .infinity)
                    .padding()
            } else if model.episodes.isEmpty {
                Text("No episodes in this season yet.")
                    .foregroundStyle(.secondary)
                    .padding(.vertical)
            }
            ForEach(model.episodes) { episode in
                EpisodeRow(episode: episode)
                    .contextMenu {
                        Button {
                            Task { await model.setEpisodePlayed(!episode.isPlayed, episode: episode, using: session.library) }
                        } label: {
                            Label(episode.isPlayed ? "Mark as Unwatched" : "Mark as Watched",
                                  systemImage: episode.isPlayed ? "minus.circle" : "checkmark.circle")
                        }
                    }
            }
        }
        .animation(.default, value: model.episodes.map(\.id))
    }
}

struct EpisodeRow: View {
    let episode: BaseItem
    @Environment(ActiveSession.self) private var session
    @Environment(PlaybackCoordinator.self) private var playback
    @Environment(\.displayScale) private var displayScale

    var body: some View {
        HStack(alignment: .top, spacing: 16) {
            Button {
                playback.play(episode, resume: true)
            } label: {
                RemoteImage(url: session.images.landscape(for: episode, maxWidth: Int(Metrics.episodeThumbWidth * displayScale)))
                    .aspectRatio(Metrics.landscapeAspect, contentMode: .fit)
                    .frame(width: Metrics.episodeThumbWidth)
                    .overlay(alignment: .bottom) { ProgressStrip(item: episode) }
                    .overlay(alignment: .topTrailing) { UnplayedBadge(item: episode) }
                    .overlay {
                        Image(systemName: "play.fill")
                            .font(.title3)
                            .foregroundStyle(.white)
                            .padding(10)
                            .background(.black.opacity(0.45), in: .circle)
                    }
                    .clipShape(.rect(cornerRadius: Metrics.cornerRadius))
            }
            .cardButtonStyle()
            .accessibilityLabel("Play \(title)")

            #if os(iOS)
            // Tapping the text opens the episode page; the thumbnail plays directly.
            NavigationLink(value: Route.item(episode)) {
                details
            }
            .buttonStyle(.plain)
            #else
            details
            #endif
        }
    }

    private var details: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(title)
                .font(.headline)
                .lineLimit(2)
            Text(detailLine)
                .font(.caption)
                .foregroundStyle(.secondary)
            if let overview = episode.overview, !overview.isEmpty {
                Text(overview)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .lineLimit(3)
            }
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .contentShape(.rect)
    }

    private var title: String {
        if let number = episode.indexNumber {
            return "\(number). \(episode.name)"
        }
        return episode.name
    }

    private var detailLine: String {
        [Formatters.runtime(episode.runTime), Formatters.airDate(episode.premiereDate), Formatters.timeRemaining(item: episode)]
            .compactMap { $0 }
            .joined(separator: " · ")
    }
}
