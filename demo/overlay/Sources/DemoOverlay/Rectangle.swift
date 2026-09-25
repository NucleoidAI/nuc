import AppKit

@MainActor
final class RectangleGaps {
    private static let bundleId = "com.knollsoft.Rectangle"
    private static let backupKey = "rectangleBackup"
    private static let keys = [
        "screenEdgeGapTop",
        "screenEdgeGapBottom",
        "screenEdgeGapLeft",
        "screenEdgeGapRight",
        "screenEdgeGapsOnMainScreenOnly",
    ]

    private let defaults = UserDefaults.standard
    private var applied: [String: Any]?
    private var writing = false

    var installed: Bool {
        NSWorkspace.shared.urlForApplication(withBundleIdentifier: Self.bundleId) != nil
    }

    func apply(position: String, size: Double, mainScreen: Bool) {
        guard installed, !writing else {
            return
        }

        let side: String
        switch position {
        case "left": side = "screenEdgeGapLeft"
        case "top": side = "screenEdgeGapTop"
        case "bottom": side = "screenEdgeGapBottom"
        default: side = "screenEdgeGapRight"
        }

        let backup = defaults.dictionary(forKey: Self.backupKey) ?? current()
        var values = backup
        values[side] = (backup[side] as? Double ?? 0) + size
        values["screenEdgeGapsOnMainScreenOnly"] = mainScreen

        guard !same(values, applied ?? current()) else {
            applied = values
            return
        }

        defaults.set(backup, forKey: Self.backupKey)
        applied = values
        write(values)
    }

    func restore() {
        guard !writing, let backup = defaults.dictionary(forKey: Self.backupKey) else {
            return
        }

        if !same(backup, current()) {
            write(backup)
        }

        defaults.removeObject(forKey: Self.backupKey)
        applied = nil
    }

    private func current() -> [String: Any] {
        var values: [String: Any] = [:]

        for key in Self.keys {
            let value = CFPreferencesCopyAppValue(key as CFString, Self.bundleId as CFString)

            if key == "screenEdgeGapsOnMainScreenOnly" {
                values[key] = (value as? Bool) ?? false
            } else {
                values[key] = (value as? NSNumber)?.doubleValue ?? 0
            }
        }

        return values
    }

    private func same(_ a: [String: Any], _ b: [String: Any]) -> Bool {
        Self.keys.allSatisfy { key in
            if let left = a[key] as? Bool, let right = b[key] as? Bool, key == "screenEdgeGapsOnMainScreenOnly" {
                return left == right
            }

            return abs((a[key] as? Double ?? 0) - (b[key] as? Double ?? 0)) < 0.5
        }
    }

    private func write(_ values: [String: Any]) {
        writing = true
        defer { writing = false }

        let running = NSRunningApplication.runningApplications(withBundleIdentifier: Self.bundleId)
        let url = running.first?.bundleURL

        running.forEach { $0.terminate() }

        let deadline = Date().addingTimeInterval(3)
        while running.contains(where: { !$0.isTerminated }), Date() < deadline {
            RunLoop.current.run(until: Date().addingTimeInterval(0.05))
        }

        for key in Self.keys {
            let value: CFPropertyList
            if key == "screenEdgeGapsOnMainScreenOnly" {
                value = (values[key] as? Bool ?? false) ? kCFBooleanTrue : kCFBooleanFalse
            } else {
                value = Float(values[key] as? Double ?? 0) as NSNumber
            }
            CFPreferencesSetAppValue(key as CFString, value, Self.bundleId as CFString)
        }
        CFPreferencesAppSynchronize(Self.bundleId as CFString)

        guard let url else {
            return
        }

        let configuration = NSWorkspace.OpenConfiguration()
        configuration.activates = false
        NSWorkspace.shared.openApplication(at: url, configuration: configuration)
    }
}
