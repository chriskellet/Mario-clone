// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "JellyfinKit",
    platforms: [
        .iOS("26.0"),
        .tvOS("26.0"),
        .macOS("15.0"),
    ],
    products: [
        .library(name: "JellyfinAPI", targets: ["JellyfinAPI"]),
    ],
    targets: [
        .target(
            name: "JellyfinAPI",
            swiftSettings: [.swiftLanguageMode(.v6)]
        ),
        .testTarget(
            name: "JellyfinAPITests",
            dependencies: ["JellyfinAPI"],
            swiftSettings: [.swiftLanguageMode(.v6)]
        ),
    ]
)
