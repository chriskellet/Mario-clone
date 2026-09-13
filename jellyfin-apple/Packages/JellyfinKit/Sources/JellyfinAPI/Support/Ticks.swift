import Foundation

/// Jellyfin measures time in ticks of 100 nanoseconds.
public enum Ticks {
    public static let perSecond: Int64 = 10_000_000

    public static func duration(_ ticks: Int64) -> Duration {
        .seconds(Double(ticks) / Double(perSecond))
    }

    public static func seconds(_ ticks: Int64) -> TimeInterval {
        Double(ticks) / Double(perSecond)
    }

    public static func from(seconds: TimeInterval) -> Int64 {
        guard seconds.isFinite, seconds > 0 else { return 0 }
        return Int64((seconds * Double(perSecond)).rounded())
    }
}
