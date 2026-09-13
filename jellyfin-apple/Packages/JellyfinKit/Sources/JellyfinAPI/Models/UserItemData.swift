import Foundation

public struct UserItemData: Decodable, Sendable, Hashable {
    public var playbackPositionTicks: Int64
    public var playCount: Int
    public var isFavorite: Bool
    public var played: Bool
    public var playedPercentage: Double?
    public var unplayedItemCount: Int?
    public var lastPlayedDate: Date?
    public var key: String?

    public init(
        playbackPositionTicks: Int64 = 0,
        playCount: Int = 0,
        isFavorite: Bool = false,
        played: Bool = false,
        playedPercentage: Double? = nil,
        unplayedItemCount: Int? = nil,
        lastPlayedDate: Date? = nil,
        key: String? = nil
    ) {
        self.playbackPositionTicks = playbackPositionTicks
        self.playCount = playCount
        self.isFavorite = isFavorite
        self.played = played
        self.playedPercentage = playedPercentage
        self.unplayedItemCount = unplayedItemCount
        self.lastPlayedDate = lastPlayedDate
        self.key = key
    }

    enum CodingKeys: String, CodingKey {
        case playbackPositionTicks, playCount, isFavorite, played, playedPercentage, unplayedItemCount, lastPlayedDate, key
    }

    public init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        playbackPositionTicks = try c.decodeIfPresent(Int64.self, forKey: .playbackPositionTicks) ?? 0
        playCount = try c.decodeIfPresent(Int.self, forKey: .playCount) ?? 0
        isFavorite = try c.decodeIfPresent(Bool.self, forKey: .isFavorite) ?? false
        played = try c.decodeIfPresent(Bool.self, forKey: .played) ?? false
        playedPercentage = try c.decodeIfPresent(Double.self, forKey: .playedPercentage)
        unplayedItemCount = try c.decodeIfPresent(Int.self, forKey: .unplayedItemCount)
        lastPlayedDate = try c.decodeIfPresent(Date.self, forKey: .lastPlayedDate)
        key = try c.decodeIfPresent(String.self, forKey: .key)
    }

    /// Progress as 0…1, or nil when there's no partial playback to show.
    public func resumeFraction(runTimeTicks: Int64?) -> Double? {
        guard playbackPositionTicks > 0, let runTimeTicks, runTimeTicks > 0 else { return nil }
        return min(1, max(0, Double(playbackPositionTicks) / Double(runTimeTicks)))
    }
}
