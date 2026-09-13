import Foundation

/// Turns what a person types ("192.168.1.10:8096", "media.example.com/jellyfin") into a URL.
public enum ServerAddress {
    public static func normalize(_ input: String) -> URL? {
        var text = input.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty else { return nil }
        if !text.contains("://") {
            text = "http://" + text
        }
        guard var components = URLComponents(string: text), let host = components.host, !host.isEmpty else {
            return nil
        }
        components.scheme = components.scheme?.lowercased()
        guard components.scheme == "http" || components.scheme == "https" else { return nil }
        // Strip trailing slashes so path joining is predictable.
        while components.path.hasSuffix("/") {
            components.path.removeLast()
        }
        components.query = nil
        components.fragment = nil
        return components.url
    }

    /// Candidate URLs to probe, most likely first. Bare hosts get Jellyfin's default port.
    public static func candidates(for input: String) -> [URL] {
        guard let primary = normalize(input) else { return [] }
        var results = [primary]
        let explicitScheme = input.contains("://")
        let explicitPort = primary.port != nil
        if !explicitPort, primary.scheme == "http", !explicitScheme {
            if var components = URLComponents(url: primary, resolvingAgainstBaseURL: false) {
                components.port = 8096
                if let url = components.url { results.append(url) }
            }
            if var components = URLComponents(url: primary, resolvingAgainstBaseURL: false) {
                components.scheme = "https"
                if let url = components.url { results.append(url) }
            }
        }
        return results
    }
}
