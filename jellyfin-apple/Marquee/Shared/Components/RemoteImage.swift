import SwiftUI
import UIKit

/// Artwork view with memory-cache-first rendering so scrolling back never flashes a placeholder.
struct RemoteImage: View {
    let url: URL?
    var contentMode: ContentMode = .fill

    @State private var image: UIImage?
    @State private var loadedURL: URL?

    init(url: URL?, contentMode: ContentMode = .fill) {
        self.url = url
        self.contentMode = contentMode
        let cached = url.flatMap { MemoryImageCache.shared.image(for: $0) }
        _image = State(initialValue: cached)
        _loadedURL = State(initialValue: cached == nil ? nil : url)
    }

    var body: some View {
        Rectangle()
            .fill(.quaternary)
            .overlay {
                if let image {
                    Image(uiImage: image)
                        .resizable()
                        .aspectRatio(contentMode: contentMode)
                        .transition(.opacity.animation(.easeOut(duration: 0.18)))
                }
            }
            .clipped()
            .task(id: url) {
                await load()
            }
    }

    private func load() async {
        guard let url else {
            image = nil
            loadedURL = nil
            return
        }
        if loadedURL == url, image != nil { return }
        if let cached = MemoryImageCache.shared.image(for: url) {
            image = cached
            loadedURL = url
            return
        }
        // A recycled cell pointed at new artwork must not keep showing the old image.
        if loadedURL != nil {
            image = nil
            loadedURL = nil
        }
        guard let fetched = try? await ImageLoader.shared.image(for: url), !Task.isCancelled else { return }
        withAnimation {
            image = fetched
            loadedURL = url
        }
    }
}
