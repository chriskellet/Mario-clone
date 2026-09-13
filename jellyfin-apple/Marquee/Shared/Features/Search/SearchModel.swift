import Foundation
import Observation
import JellyfinAPI

@MainActor
@Observable
final class SearchModel {
    struct Results: Equatable {
        let term: String
        let movies: [BaseItem]
        let series: [BaseItem]
        let episodes: [BaseItem]

        var isEmpty: Bool { movies.isEmpty && series.isEmpty && episodes.isEmpty }

        init(term: String, items: [BaseItem]) {
            self.term = term
            movies = items.filter { $0.type == .movie }
            series = items.filter { $0.type == .series }
            episodes = items.filter { $0.type == .episode }
        }
    }

    var query = ""
    private(set) var results: Results?
    private(set) var isSearching = false
    private(set) var error: (any Error)?

    /// Called from `.task(id: query)`: a new keystroke cancels the previous run, so the
    /// debounce is just a sleep. Old results stay on screen until new ones arrive.
    func search(using library: any LibraryServicing) async {
        let term = query.trimmingCharacters(in: .whitespacesAndNewlines)
        guard term.count >= 2 else {
            results = nil
            isSearching = false
            error = nil
            return
        }
        if results?.term == term { return }
        isSearching = true
        do {
            try await Task.sleep(for: .milliseconds(300))
            let items = try await library.search(term)
            guard !Task.isCancelled else { return }
            results = Results(term: term, items: items)
            error = nil
            isSearching = false
        } catch {
            guard !Task.isCancelled else { return }
            self.error = error
            isSearching = false
        }
    }
}
