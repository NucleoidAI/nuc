import AppKit
import Carbon.HIToolbox
import Combine
import SwiftUI

final class OverlayPanel: NSPanel {
    override var canBecomeKey: Bool { true }
    override var canBecomeMain: Bool { false }
}

final class HotKeys {
    private static var actions: [UInt32: () -> Void] = [:]
    private static var installed = false
    private var refs: [EventHotKeyRef?] = []

    func register(keyCode: Int, id: UInt32, action: @escaping () -> Void) {
        HotKeys.installIfNeeded()
        HotKeys.actions[id] = action

        var ref: EventHotKeyRef?
        let hotKeyID = EventHotKeyID(signature: OSType(0x444D_4F46), id: id)
        let status = RegisterEventHotKey(
            UInt32(keyCode), UInt32(controlKey | optionKey), hotKeyID,
            GetApplicationEventTarget(), 0, &ref
        )

        if status != noErr {
            FileHandle.standardError.write(Data("Hotkey \(id) could not be registered (\(status))\n".utf8))
        }
        refs.append(ref)
    }

    private static func installIfNeeded() {
        guard !installed else {
            return
        }

        installed = true
        var spec = EventTypeSpec(eventClass: OSType(kEventClassKeyboard), eventKind: UInt32(kEventHotKeyPressed))

        InstallEventHandler(GetApplicationEventTarget(), { _, event, _ in
            var hotKeyID = EventHotKeyID()
            GetEventParameter(
                event, EventParamName(kEventParamDirectObject), EventParamType(typeEventHotKeyID),
                nil, MemoryLayout<EventHotKeyID>.size, nil, &hotKeyID
            )
            HotKeys.actions[hotKeyID.id]?()
            return noErr
        }, 1, &spec, nil, nil)
    }
}

@MainActor
final class AppDelegate: NSObject, NSApplicationDelegate {
    private let client: RunnerClient
    private let settings: OverlaySettings
    private var panel: OverlayPanel!
    private var statusItem: NSStatusItem!
    private let hotKeys = HotKeys()
    private let actions = OverlayActions()
    private var cancellables = Set<AnyCancellable>()
    private var lastFrame: NSRect?

    override init() {
        let environment = ProcessInfo.processInfo.environment
        let url = URL(string: environment["DEMO_URL"] ?? "ws://localhost:4600/ws")!
        client = RunnerClient(url: url)
        settings = OverlaySettings(opacity: Double(environment["DEMO_OVERLAY_OPACITY"] ?? "") ?? 0.82)
        super.init()
    }

    func applicationDidFinishLaunching(_ notification: Notification) {
        panel = OverlayPanel(
            contentRect: setupFrame(),
            styleMask: [.borderless, .nonactivatingPanel],
            backing: .buffered,
            defer: false
        )
        panel.level = .floating
        panel.collectionBehavior = [.canJoinAllSpaces, .fullScreenAuxiliary, .stationary]
        panel.isOpaque = false
        panel.backgroundColor = .clear
        panel.hasShadow = true
        panel.hidesOnDeactivate = false
        panel.becomesKeyOnlyIfNeeded = true
        actions.setup = { [weak self] in self?.showSetup() }
        actions.editLayout = { [weak self] in self?.showLayoutEditor() }
        actions.closeLayout = { [weak self] in self?.closeLayoutEditor() }
        actions.hide = { [weak self] in self?.toggle() }
        actions.quit = { NSApp.terminate(nil) }

        panel.contentView = NSHostingView(
            rootView: OverlayView(client: client, settings: settings) { [weak self] in self?.start() }
                .environmentObject(actions)
        )

        setupStatusItem()
        setupHotKeys()

        settings.objectWillChange
            .receive(on: RunLoop.main)
            .sink { [weak self] in self?.reposition() }
            .store(in: &cancellables)

        client.$state
            .receive(on: RunLoop.main)
            .sink { [weak self] state in
                self?.loaded(state)
                self?.reposition()
            }
            .store(in: &cancellables)

        client.$error
            .receive(on: RunLoop.main)
            .sink { [weak self] error in self?.failed(error) }
            .store(in: &cancellables)

        client.$online
            .removeDuplicates()
            .filter { $0 }
            .receive(on: RunLoop.main)
            .sink { [weak self] _ in self?.resync() }
            .store(in: &cancellables)

        client.connect()
        showSetup()
    }

    private func setupStatusItem() {
        statusItem = NSStatusBar.system.statusItem(withLength: NSStatusItem.squareLength)
        statusItem.button?.image = NSImage(systemSymbolName: "play.rectangle.on.rectangle", accessibilityDescription: "Demo")

        let menu = NSMenu()
        let items: [(String, Selector)] = [
            ("Setup…  ⌃⌥S", #selector(showSetup)),
            ("Next  ⌃⌥→", #selector(next)),
            ("Previous  ⌃⌥←", #selector(previous)),
            ("Restart  ⌃⌥R", #selector(restart)),
            ("Re-apply layout  ⌃⌥L", #selector(arrange)),
            ("Show / Hide  ⌃⌥H", #selector(toggle)),
        ]

        for (title, action) in items {
            let item = NSMenuItem(title: title, action: action, keyEquivalent: "")
            item.target = self
            menu.addItem(item)
        }

        menu.addItem(.separator())
        menu.addItem(NSMenuItem(title: "Quit", action: #selector(NSApplication.terminate(_:)), keyEquivalent: "q"))
        statusItem.menu = menu
    }

    private func setupHotKeys() {
        hotKeys.register(keyCode: kVK_RightArrow, id: 1) { [weak self] in self?.next() }
        hotKeys.register(keyCode: kVK_LeftArrow, id: 2) { [weak self] in self?.previous() }
        hotKeys.register(keyCode: kVK_ANSI_R, id: 3) { [weak self] in self?.restart() }
        hotKeys.register(keyCode: kVK_ANSI_L, id: 4) { [weak self] in self?.arrange() }
        hotKeys.register(keyCode: kVK_ANSI_H, id: 5) { [weak self] in self?.toggle() }
        hotKeys.register(keyCode: kVK_ANSI_S, id: 6) { [weak self] in self?.showSetup() }
    }

    @objc private func next() { client.send("next") }
    @objc private func previous() { client.send("prev") }
    @objc private func restart() { client.send("restart") }
    @objc private func arrange() { client.send("arrange") }

    @objc private func toggle() {
        if panel.isVisible {
            panel.orderOut(nil)
        } else {
            panel.orderFrontRegardless()
        }
    }

    private func showLayoutEditor() {
        settings.editingLayout = true
        reposition()
        NSApp.activate(ignoringOtherApps: true)
        panel.makeKey()
    }

    private func closeLayoutEditor() {
        settings.editingLayout = false
        panel.resignKey()
        reposition()
    }

    @objc private func showSetup() {
        settings.editingLayout = false
        settings.configuring = true
        client.send("cases")
        reposition()
        panel.orderFrontRegardless()
        NSApp.activate(ignoringOtherApps: true)
        panel.makeKey()
    }

    private func start() {
        guard let file = settings.caseFile else {
            return
        }

        client.error = nil
        settings.pendingFile = file
        sendConfiguration()
        client.send("load", ["file": file])
    }

    private func loaded(_ state: RunnerState?) {
        guard let pending = settings.pendingFile, state?.file == pending else {
            return
        }

        settings.pendingFile = nil
        settings.configuring = false
        panel.resignKey()
        panel.orderFrontRegardless()
    }

    private func failed(_ error: String?) {
        if error != nil {
            settings.pendingFile = nil
        }
    }

    private func resync() {
        client.send("cases")

        if !settings.configuring {
            sendConfiguration()
        }
    }

    private func sendConfiguration() {
        client.send("configure", [
            "screen": settings.screen,
            "position": settings.position,
            "size": settings.size,
            "reserve": settings.reserve,
        ])
    }

    private func reposition() {
        let frame = settings.configuring
            ? setupFrame()
            : settings.editingLayout ? setupFrame(width: 460, height: 560) : stripFrame()

        guard frame != lastFrame else {
            return
        }

        lastFrame = frame
        panel.setFrame(frame, display: true, animate: panel.isVisible)
    }

    private func stripFrame() -> NSRect {
        flush(runnerStrip() ?? localStrip())
    }

    private func runnerStrip() -> NSRect? {
        guard
            let state = client.state,
            let rect = state.indicatorRect,
            let indicator = state.indicator,
            indicator.screen == settings.screen,
            indicator.position == settings.position,
            abs(indicator.size - settings.size) < 0.5
        else {
            return nil
        }

        let primaryHeight = NSScreen.screens.first?.frame.height ?? 0

        return NSRect(x: rect.x, y: primaryHeight - rect.y - rect.h, width: rect.w, height: rect.h)
    }

    private func localStrip() -> NSRect {
        let visible = settings.nsScreen?.visibleFrame ?? NSRect(x: 0, y: 0, width: 1440, height: 900)
        let size = CGFloat(settings.size)

        switch settings.position {
        case "left":
            return NSRect(x: visible.minX, y: visible.minY, width: size, height: visible.height)
        case "top":
            return NSRect(x: visible.minX, y: visible.maxY - size, width: visible.width, height: size)
        case "bottom":
            return NSRect(x: visible.minX, y: visible.minY, width: visible.width, height: size)
        default:
            return NSRect(x: visible.maxX - size, y: visible.minY, width: size, height: visible.height)
        }
    }

    private func flush(_ strip: NSRect) -> NSRect {
        let inset: CGFloat = 6
        var frame = strip.insetBy(dx: inset, dy: inset)

        switch settings.position {
        case "left":
            frame.size.width += inset
        case "top":
            frame.origin.y -= inset
            frame.size.height += inset
        case "bottom":
            frame.size.height += inset
        default:
            frame.origin.x -= inset
            frame.size.width += inset
        }

        return frame
    }

    private func setupFrame(width preferredWidth: CGFloat = 500, height preferredHeight: CGFloat = 700) -> NSRect {
        let visible = settings.nsScreen?.visibleFrame ?? NSRect(x: 0, y: 0, width: 1440, height: 900)
        let width = min(preferredWidth, visible.width - 40)
        let height = min(preferredHeight, visible.height - 40)

        return NSRect(
            x: visible.midX - width / 2,
            y: visible.midY - height / 2,
            width: width,
            height: height
        )
    }
}

MainActor.assumeIsolated {
    let app = NSApplication.shared
    let delegate = AppDelegate()
    app.delegate = delegate
    app.setActivationPolicy(.accessory)
    app.run()
}
