import AppKit
import ApplicationServices

struct Output: Encodable {
    let ok: Bool
    var reason: String?
    var windows: [WindowInfo]?
}

struct WindowInfo: Encodable {
    let subrole: String
    let minimized: Bool
    let x: Double
    let y: Double
    let width: Double
    let height: Double
}

func finish(_ output: Output, code: Int32) -> Never {
    if let data = try? JSONEncoder().encode(output), let text = String(data: data, encoding: .utf8) {
        print(text)
    }
    exit(code)
}

func attribute<T>(_ element: AXUIElement, _ name: String) -> T? {
    var value: CFTypeRef?
    guard AXUIElementCopyAttributeValue(element, name as CFString, &value) == .success else {
        return nil
    }
    return value as? T
}

func point(_ element: AXUIElement) -> CGPoint {
    var result = CGPoint.zero
    if let value: AXValue = attribute(element, kAXPositionAttribute) {
        AXValueGetValue(value, .cgPoint, &result)
    }
    return result
}

func size(_ element: AXUIElement) -> CGSize {
    var result = CGSize.zero
    if let value: AXValue = attribute(element, kAXSizeAttribute) {
        AXValueGetValue(value, .cgSize, &result)
    }
    return result
}

func info(_ window: AXUIElement) -> WindowInfo {
    let origin = point(window)
    let extent = size(window)

    return WindowInfo(
        subrole: attribute(window, kAXSubroleAttribute) ?? "",
        minimized: attribute(window, kAXMinimizedAttribute) ?? false,
        x: origin.x,
        y: origin.y,
        width: extent.width,
        height: extent.height
    )
}

func standardWindows(_ pid: pid_t) -> [AXUIElement] {
    let app = AXUIElementCreateApplication(pid)
    let windows: [AXUIElement] = attribute(app, kAXWindowsAttribute) ?? []

    return windows.filter { (attribute($0, kAXSubroleAttribute) as String?) == kAXStandardWindowSubrole }
}

func set(_ window: AXUIElement, origin: CGPoint) {
    var value = origin
    if let ax = AXValueCreate(.cgPoint, &value) {
        AXUIElementSetAttributeValue(window, kAXPositionAttribute as CFString, ax)
    }
}

func set(_ window: AXUIElement, size: CGSize) {
    var value = size
    if let ax = AXValueCreate(.cgSize, &value) {
        AXUIElementSetAttributeValue(window, kAXSizeAttribute as CFString, ax)
    }
}

let arguments = CommandLine.arguments.dropFirst()
let command = arguments.first ?? ""
let numbers = arguments.dropFirst().compactMap { Double($0) }

guard AXIsProcessTrusted() else {
    finish(Output(ok: false, reason: "accessibility"), code: 2)
}

guard let pidValue = numbers.first else {
    finish(Output(ok: false, reason: "usage: DemoWindow list <pid> | place <pid> <x> <y> <width> <height>"), code: 64)
}

let pid = pid_t(pidValue)

switch command {
case "list":
    finish(Output(ok: true, windows: standardWindows(pid).map(info)), code: 0)

case "place":
    guard numbers.count == 5 else {
        finish(Output(ok: false, reason: "usage: DemoWindow place <pid> <x> <y> <width> <height>"), code: 64)
    }

    let windows = standardWindows(pid)

    guard !windows.isEmpty else {
        finish(Output(ok: false, reason: "missing"), code: 3)
    }

    let visible = windows.filter { !(attribute($0, kAXMinimizedAttribute) ?? false) }

    guard
        let window = visible.max(by: { size($0).width * size($0).height < size($1).width * size($1).height })
    else {
        finish(Output(ok: false, reason: "minimized"), code: 4)
    }

    let origin = CGPoint(x: numbers[1], y: numbers[2])
    let extent = CGSize(width: numbers[3], height: numbers[4])

    set(window, origin: origin)
    set(window, size: extent)
    set(window, origin: origin)
    AXUIElementPerformAction(window, kAXRaiseAction as CFString)
    NSRunningApplication(processIdentifier: pid)?.activate()

    finish(Output(ok: true, windows: [info(window)]), code: 0)

default:
    finish(Output(ok: false, reason: "unknown command \(command)"), code: 64)
}
