public struct PublicSystemInfo: Decodable, Sendable, Hashable {
    public var id: String
    public var serverName: String
    public var version: String?
    public var productName: String?
    public var localAddress: String?
    public var startupWizardCompleted: Bool?
}
