/// `ImageTags` arrives as an object keyed by image type. Decoded case-insensitively so it
/// survives the client's PascalCase → camelCase key strategy.
public struct ImageTags: Decodable, Sendable, Hashable {
    public var tags: [ImageType: String]

    public init(tags: [ImageType: String] = [:]) {
        self.tags = tags
    }

    public subscript(type: ImageType) -> String? {
        tags[type]
    }

    private struct RawKey: CodingKey {
        var stringValue: String
        var intValue: Int? { nil }
        init(stringValue: String) { self.stringValue = stringValue }
        init?(intValue: Int) { nil }
    }

    public init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: RawKey.self)
        var tags: [ImageType: String] = [:]
        for key in container.allKeys {
            guard let type = ImageType.allCases.first(where: { $0.rawValue.caseInsensitiveCompare(key.stringValue) == .orderedSame }) else {
                continue
            }
            tags[type] = try container.decode(String.self, forKey: key)
        }
        self.tags = tags
    }
}
