import Foundation
import Observation
import JellyfinAPI

@MainActor
@Observable
final class SeriesDetailModel {
    private(set) var series: BaseItem
    private(set) var seasons: [BaseItem] = []
    private(set) var nextUp: BaseItem?
    private(set) var episodes: [BaseItem] = []
    private(set) var state: LoadState<Void> = .idle
    private(set) var episodesLoading = false
    var selectedSeasonID: String?

    private let preferredSeasonID: String?
    private var episodeGeneration = 0

    init(series: BaseItem, preferredSeasonID: String? = nil) {
        self.series = series
        self.preferredSeasonID = preferredSeasonID
        self.selectedSeasonID = preferredSeasonID
    }

    var selectedSeason: BaseItem? {
        seasons.first { $0.id == selectedSeasonID }
    }

    func load(using library: any LibraryServicing) async {
        if case .idle = state { state = .loading }
        let seriesID = series.seriesId ?? series.id
        async let fullSeries = library.item(id: seriesID)
        async let seasonList = library.seasons(seriesID: seriesID)
        async let nextUpList = library.nextUp(seriesID: seriesID)
        do {
            series = try await fullSeries
            seasons = try await seasonList
            // Up Next is a nicety: a failure there must not fail the whole page.
            nextUp = (try? await nextUpList)?.first
            let previousSeasonID = selectedSeasonID
            if selectedSeasonID == nil || !seasons.contains(where: { $0.id == selectedSeasonID }) {
                selectedSeasonID = nextUp?.seasonId ?? seasons.first { ($0.userData?.unplayedItemCount ?? 0) > 0 }?.id ?? seasons.first?.id
            }
            state = .loaded(())
            // A changed season id triggers the view's episode task; an unchanged one won't,
            // so refresh here to pick up new progress after playback.
            if selectedSeasonID == previousSeasonID {
                await loadEpisodes(using: library)
            }
        } catch {
            if state.value == nil { state = .failed(error) }
        }
    }

    func loadEpisodes(using library: any LibraryServicing) async {
        guard let seasonID = selectedSeasonID else {
            episodes = []
            return
        }
        episodeGeneration += 1
        let token = episodeGeneration
        episodesLoading = true
        defer { if token == episodeGeneration { episodesLoading = false } }
        do {
            let loaded = try await library.episodes(seriesID: series.seriesId ?? series.id, seasonID: seasonID)
            guard token == episodeGeneration else { return }
            episodes = loaded
        } catch {
            guard token == episodeGeneration else { return }
            episodes = []
        }
    }

    func setEpisodePlayed(_ played: Bool, episode: BaseItem, using library: any LibraryServicing) async {
        guard let index = episodes.firstIndex(where: { $0.id == episode.id }) else { return }
        var data = episodes[index].userData ?? UserItemData()
        data.played = played
        if played { data.playbackPositionTicks = 0 }
        episodes[index].userData = data
        if let updated = try? await library.setPlayed(played, itemID: episode.id),
           let current = episodes.firstIndex(where: { $0.id == episode.id }) {
            episodes[current].userData = updated
        }
    }
}
