import Foundation

/// Jellyfin uses PascalCase keys and 7-digit fractional-second dates. These coders normalise both.
public enum JSONCoding {
    public static func makeDecoder() -> JSONDecoder {
        let decoder = JSONDecoder()
        decoder.keyDecodingStrategy = .custom { keys in
            PascalCaseKey.lowercasingFirst(keys.last!)
        }
        decoder.dateDecodingStrategy = .custom { decoder in
            let container = try decoder.singleValueContainer()
            let raw = try container.decode(String.self)
            guard let date = JellyfinDate.parse(raw) else {
                throw DecodingError.dataCorruptedError(in: container, debugDescription: "Unparseable date: \(raw)")
            }
            return date
        }
        return decoder
    }

    public static func makeEncoder() -> JSONEncoder {
        let encoder = JSONEncoder()
        encoder.keyEncodingStrategy = .custom { keys in
            PascalCaseKey.uppercasingFirst(keys.last!)
        }
        encoder.dateEncodingStrategy = .iso8601
        return encoder
    }
}

struct PascalCaseKey: CodingKey {
    var stringValue: String
    var intValue: Int?

    init(stringValue: String) {
        self.stringValue = stringValue
    }

    init?(intValue: Int) {
        self.stringValue = String(intValue)
        self.intValue = intValue
    }

    static func lowercasingFirst(_ key: any CodingKey) -> PascalCaseKey {
        guard let first = key.stringValue.first else { return PascalCaseKey(stringValue: key.stringValue) }
        // Keep all-caps keys like "ID" readable as "id".
        if key.stringValue.allSatisfy({ $0.isUppercase }) {
            return PascalCaseKey(stringValue: key.stringValue.lowercased())
        }
        return PascalCaseKey(stringValue: first.lowercased() + key.stringValue.dropFirst())
    }

    static func uppercasingFirst(_ key: any CodingKey) -> PascalCaseKey {
        guard let first = key.stringValue.first else { return PascalCaseKey(stringValue: key.stringValue) }
        return PascalCaseKey(stringValue: first.uppercased() + key.stringValue.dropFirst())
    }
}

/// Parses `2024-03-01T10:15:30.1234567Z` and `2024-03-01T10:15:30Z` alike.
public enum JellyfinDate {
    nonisolated(unsafe) private static let fractional: ISO8601DateFormatter = {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return formatter
    }()

    nonisolated(unsafe) private static let plain: ISO8601DateFormatter = {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime]
        return formatter
    }()

    public static func parse(_ raw: String) -> Date? {
        var value = raw
        if !value.hasSuffix("Z"), !value.contains("+"), value.range(of: #"-\d\d:\d\d$"#, options: .regularExpression) == nil {
            value += "Z"
        }
        if let dot = value.firstIndex(of: ".") {
            let afterDot = value.index(after: dot)
            let digitsEnd = value[afterDot...].firstIndex { !$0.isNumber } ?? value.endIndex
            let digits = value[afterDot..<digitsEnd]
            let trimmed = String(digits.prefix(3)).padding(toLength: 3, withPad: "0", startingAt: 0)
            value.replaceSubrange(afterDot..<digitsEnd, with: trimmed)
            return fractional.date(from: value) ?? plain.date(from: raw)
        }
        return plain.date(from: value)
    }
}
