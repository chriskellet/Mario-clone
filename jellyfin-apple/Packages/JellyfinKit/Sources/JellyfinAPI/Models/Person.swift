public struct Person: Decodable, Sendable, Hashable, Identifiable {
    public var id: String
    public var name: String
    public var role: String?
    public var type: String?
    public var primaryImageTag: String?
}

public struct NameGuidPair: Decodable, Sendable, Hashable, Identifiable {
    public var id: String
    public var name: String
}
