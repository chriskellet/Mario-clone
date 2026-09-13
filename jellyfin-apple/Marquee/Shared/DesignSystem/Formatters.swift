import Foundation
import JellyfinAPI

/// Human-facing strings for metadata. Kept together so every screen says things the same way.
enum Formatters {
    static func runtime(_ duration: Duration?) -> String? {
        guard let duration else { return nil }
        let minutes = Int(duration.components.seconds / 60)
        guard minutes > 0 else { return nil }
        let hours = minutes / 60
        let remainder = minutes % 60
        if hours > 0 {
            return remainder > 0 ? "\(hours)h \(remainder)m" : "\(hours)h"
        }
        return "\(remainder)m"
    }

    static func timeRemaining(item: BaseItem) -> String? {
        guard let runTimeTicks = item.runTimeTicks, item.canResume else { return nil }
        let remainingTicks = max(0, runTimeTicks - item.resumePositionTicks)
        guard let text = runtime(Ticks.duration(remainingTicks)) else { return nil }
        return String(localized: "\(text) left")
    }

    static func rating(_ value: Double?) -> String? {
        guard let value, value > 0 else { return nil }
        return value.formatted(.number.precision(.fractionLength(1)))
    }

    static func year(_ item: BaseItem) -> String? {
        if let year = item.productionYear { return String(year) }
        if let date = item.premiereDate {
            return String(Calendar.current.component(.year, from: date))
        }
        return nil
    }

    /// `1995 · 2h 50m · R` — the line under every title.
    static func metadataLine(for item: BaseItem) -> String {
        var parts: [String] = []
        if let year = year(item) { parts.append(year) }
        if let runtime = runtime(item.runTime) { parts.append(runtime) }
        if let rating = item.officialRating, !rating.isEmpty { parts.append(rating) }
        if item.type == .series, let status = item.status, status == .continuing {
            parts.append(String(localized: "Continuing"))
        }
        return parts.joined(separator: " · ")
    }

    static func airDate(_ date: Date?) -> String? {
        guard let date else { return nil }
        return date.formatted(date: .abbreviated, time: .omitted)
    }
}
