import Foundation
import UIKit

/// Decoded images, keyed by URL. `NSCache` is thread-safe and evicts under memory pressure.
final class MemoryImageCache: @unchecked Sendable {
    static let shared = MemoryImageCache()

    private let cache: NSCache<NSURL, UIImage> = {
        let cache = NSCache<NSURL, UIImage>()
        cache.totalCostLimit = 128 * 1024 * 1024
        return cache
    }()

    func image(for url: URL) -> UIImage? {
        cache.object(forKey: url as NSURL)
    }

    func store(_ image: UIImage, for url: URL) {
        let cost = Int(image.size.width * image.size.height * image.scale * image.scale * 4)
        cache.setObject(image, forKey: url as NSURL, cost: cost)
    }
}

/// Fetches, decodes and caches artwork. Requests for the same URL are coalesced.
actor ImageLoader {
    static let shared = ImageLoader()

    private let session: URLSession
    private let memory: MemoryImageCache
    private var inFlight: [URL: Task<UIImage, Error>] = [:]

    init(memory: MemoryImageCache = .shared) {
        let configuration = URLSessionConfiguration.default
        configuration.urlCache = URLCache(memoryCapacity: 32 * 1024 * 1024, diskCapacity: 512 * 1024 * 1024)
        // Artwork URLs carry the image tag, so a cached copy is always the right copy.
        configuration.requestCachePolicy = .returnCacheDataElseLoad
        configuration.httpMaximumConnectionsPerHost = 6
        configuration.waitsForConnectivity = false
        configuration.timeoutIntervalForRequest = 20
        session = URLSession(configuration: configuration)
        self.memory = memory
    }

    func image(for url: URL) async throws -> UIImage {
        if let cached = memory.image(for: url) {
            return cached
        }
        if let existing = inFlight[url] {
            return try await existing.value
        }
        let task = Task<UIImage, Error> { [session, memory] in
            let (data, _) = try await session.data(from: url)
            guard let raw = UIImage(data: data) else { throw ImageError.undecodable }
            let decoded = await raw.byPreparingForDisplay() ?? raw
            memory.store(decoded, for: url)
            return decoded
        }
        inFlight[url] = task
        defer { inFlight[url] = nil }
        return try await task.value
    }

    enum ImageError: Error {
        case undecodable
    }
}
