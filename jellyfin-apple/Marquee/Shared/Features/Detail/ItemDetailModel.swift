import Foundation
import Observation
import JellyfinAPI

/// Holds a full item and applies optimistic user-data changes (watched, favourite).
@MainActor
@Observable
final class ItemDetailModel {
    private(set) var item: BaseItem
    private(set) var state: LoadState<Void> = .idle
    private(set) var actionError: (any Error)?

    init(item: BaseItem) {
        self.item = item
    }

    func load(using library: any LibraryServicing) async {
        if case .idle = state { state = .loading }
        do {
            item = try await library.item(id: item.id)
            state = .loaded(())
        } catch {
            // The shelf's copy is enough to render; only surface the error when we have nothing.
            state = .loaded(())
        }
    }

    func togglePlayed(using library: any LibraryServicing) async {
        let target = !item.isPlayed
        var optimistic = item.userData ?? UserItemData()
        optimistic.played = target
        if target { optimistic.playbackPositionTicks = 0 }
        await apply(optimistic) { try await library.setPlayed(target, itemID: item.id) }
    }

    func toggleFavorite(using library: any LibraryServicing) async {
        let target = !item.isFavorite
        var optimistic = item.userData ?? UserItemData()
        optimistic.isFavorite = target
        await apply(optimistic) { try await library.setFavorite(target, itemID: item.id) }
    }

    private func apply(_ optimistic: UserItemData, _ request: () async throws -> UserItemData) async {
        let previous = item.userData
        item.userData = optimistic
        do {
            item.userData = try await request()
        } catch {
            item.userData = previous
            actionError = error
        }
    }

    func clearActionError() {
        actionError = nil
    }
}
