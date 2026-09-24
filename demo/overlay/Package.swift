// swift-tools-version:5.9
import PackageDescription

let package = Package(
    name: "DemoOverlay",
    platforms: [.macOS(.v14)],
    targets: [
        .executableTarget(name: "DemoOverlay", path: "Sources/DemoOverlay"),
        .executableTarget(name: "DemoWindow", path: "Sources/DemoWindow"),
    ]
)
