import AVFoundation
import Foundation
import JellyfinAPI

/// Feeds the system player's info panel (title, subtitle, description, artwork).
enum PlayerMetadata {
    static func items(for item: BaseItem) -> [AVMetadataItem] {
        var result: [AVMetadataItem] = []
        if let title = make(.commonIdentifierTitle, value: item.type == .episode ? (item.seriesName ?? item.name) : item.name) {
            result.append(title)
        }
        if let subtitle = make(.iTunesMetadataTrackSubTitle, value: subtitle(for: item)) {
            result.append(subtitle)
        }
        if let description = make(.commonIdentifierDescription, value: item.overview) {
            result.append(description)
        }
        return result
    }

    static func artwork(_ data: Data) -> AVMetadataItem? {
        let item = AVMutableMetadataItem()
        item.identifier = .commonIdentifierArtwork
        item.value = data as NSData
        item.dataType = kCMMetadataBaseDataType_JPEG as String
        item.extendedLanguageTag = "und"
        return item.copy() as? AVMetadataItem
    }

    private static func subtitle(for item: BaseItem) -> String? {
        if item.type == .episode {
            return [item.episodeCode, item.name].compactMap { $0 }.joined(separator: "  ")
        }
        let line = Formatters.metadataLine(for: item)
        return line.isEmpty ? nil : line
    }

    private static func make(_ identifier: AVMetadataIdentifier, value: String?) -> AVMetadataItem? {
        guard let value, !value.isEmpty else { return nil }
        let item = AVMutableMetadataItem()
        item.identifier = identifier
        item.value = value as NSString
        item.extendedLanguageTag = "und"
        return item.copy() as? AVMetadataItem
    }
}
