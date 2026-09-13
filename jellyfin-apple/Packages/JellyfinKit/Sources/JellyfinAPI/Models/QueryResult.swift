public struct QueryResult<Item: Decodable & Sendable>: Decodable, Sendable {
    public var items: [Item]
    public var totalRecordCount: Int
    public var startIndex: Int

    public init(items: [Item], totalRecordCount: Int, startIndex: Int = 0) {
        self.items = items
        self.totalRecordCount = totalRecordCount
        self.startIndex = startIndex
    }

    enum CodingKeys: String, CodingKey {
        case items, totalRecordCount, startIndex
    }

    public init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        items = try container.decodeIfPresent([Item].self, forKey: .items) ?? []
        totalRecordCount = try container.decodeIfPresent(Int.self, forKey: .totalRecordCount) ?? items.count
        startIndex = try container.decodeIfPresent(Int.self, forKey: .startIndex) ?? 0
    }
}
