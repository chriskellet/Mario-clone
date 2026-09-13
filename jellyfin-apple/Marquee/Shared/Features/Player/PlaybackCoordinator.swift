import Foundation
import Observation
import JellyfinAPI

struct PlaybackRequest: Identifiable, Equatable {
    let id = UUID()
    let item: BaseItem
    let startTicks: Int64
}

/// App-wide "what's playing". Screens ask it to play; `PlayerHost` presents the player.
@MainActor
@Observable
final class PlaybackCoordinator {
    private(set) var request: PlaybackRequest?
    /// Bumps when playback ends so screens can refresh watched state and progress.
    private(set) var generation = 0

    func play(_ item: BaseItem, resume: Bool) {
        guard item.isPlayable else { return }
        request = PlaybackRequest(item: item, startTicks: resume ? item.resumePositionTicks : 0)
    }

    func finish() {
        request = nil
        generation += 1
    }
}
