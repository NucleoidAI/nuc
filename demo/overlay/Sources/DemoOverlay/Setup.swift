import AppKit
import SwiftUI

struct ScreenInfo: Identifiable {
    let id: Int
    let name: String
    let size: CGSize
    let primary: Bool
}

@MainActor
final class OverlaySettings: ObservableObject {
    @Published var configuring = true
    @Published var pendingFile: String?
    @Published var editingLayout = false
    @Published var screen: Int { didSet { save() } }
    @Published var position: String { didSet { save() } }
    @Published var verticalSize: Double { didSet { save() } }
    @Published var horizontalSize: Double { didSet { save() } }
    @Published var reserve: Bool { didSet { save() } }
    @Published var opacity: Double { didSet { save() } }
    @Published var caseFile: String? { didSet { save() } }

    private let defaults = UserDefaults.standard

    init(opacity fallbackOpacity: Double) {
        screen = defaults.object(forKey: "screen") as? Int ?? 0
        position = defaults.string(forKey: "position") ?? "right"
        verticalSize = defaults.object(forKey: "verticalSize") as? Double ?? 360
        horizontalSize = defaults.object(forKey: "horizontalSize") as? Double ?? 150
        reserve = defaults.object(forKey: "reserve") as? Bool ?? true
        opacity = defaults.object(forKey: "opacity") as? Double ?? fallbackOpacity
        caseFile = defaults.string(forKey: "caseFile")

        if screen >= NSScreen.screens.count {
            screen = 0
        }
    }

    var vertical: Bool {
        position == "left" || position == "right"
    }

    var size: Double {
        get { vertical ? verticalSize : horizontalSize }
        set {
            if vertical {
                verticalSize = newValue
            } else {
                horizontalSize = newValue
            }
        }
    }

    var sizeRange: ClosedRange<Double> {
        vertical ? 260...560 : 100...260
    }

    var screens: [ScreenInfo] {
        NSScreen.screens.enumerated().map { index, screen in
            ScreenInfo(
                id: index,
                name: screen.localizedName,
                size: screen.frame.size,
                primary: index == 0
            )
        }
    }

    var nsScreen: NSScreen? {
        NSScreen.screens.indices.contains(screen) ? NSScreen.screens[screen] : NSScreen.screens.first
    }

    private func save() {
        defaults.set(screen, forKey: "screen")
        defaults.set(position, forKey: "position")
        defaults.set(verticalSize, forKey: "verticalSize")
        defaults.set(horizontalSize, forKey: "horizontalSize")
        defaults.set(reserve, forKey: "reserve")
        defaults.set(opacity, forKey: "opacity")
        defaults.set(caseFile, forKey: "caseFile")
    }
}

struct SetupView: View {
    @ObservedObject var client: RunnerClient
    @ObservedObject var settings: OverlaySettings
    @EnvironmentObject var actions: OverlayActions
    let start: () -> Void

    private let positions = [("left", "Left"), ("right", "Right"), ("top", "Top"), ("bottom", "Bottom")]

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            HStack {
                Text("Demo setup").font(.system(size: 20, weight: .semibold))
                Spacer()
                Circle()
                    .fill(client.online ? Color.accent : Color.danger)
                    .frame(width: 7, height: 7)
                Text(client.online ? "Runner connected" : "Runner offline")
                    .font(.system(size: 11))
                    .foregroundStyle(Color.muted)
            }

            group("Screen") {
                VStack(spacing: 6) {
                    ForEach(settings.screens) { screen in
                        choice(selected: settings.screen == screen.id) {
                            settings.screen = screen.id
                        } label: {
                            Image(systemName: screen.size.width >= screen.size.height ? "display" : "rectangle.portrait")
                            Text(screen.name).fontWeight(.medium)
                            Spacer()
                            Text("\(Int(screen.size.width))×\(Int(screen.size.height))\(screen.primary ? " · main" : "")")
                                .font(.system(size: 11, design: .monospaced))
                                .foregroundStyle(Color.muted)
                        }
                    }
                }
            }

            group("Indicator") {
                HStack(alignment: .top, spacing: 14) {
                    Preview(settings: settings)
                        .frame(width: 130, height: 130)

                    VStack(alignment: .leading, spacing: 10) {
                        Picker("", selection: $settings.position) {
                            ForEach(positions, id: \.0) { value, label in
                                Text(label).tag(value)
                            }
                        }
                        .pickerStyle(.segmented)
                        .labelsHidden()

                        slider(
                            settings.vertical ? "Width" : "Height",
                            value: Binding(get: { settings.size }, set: { settings.size = $0 }),
                            range: settings.sizeRange,
                            format: { "\(Int($0)) pt" }
                        )

                        slider(
                            "Opacity",
                            value: $settings.opacity,
                            range: 0.4...1,
                            format: { "\(Int($0 * 100))%" }
                        )

                        Toggle("Keep windows out of the strip", isOn: $settings.reserve)
                            .toggleStyle(.switch)
                            .controlSize(.small)
                            .font(.system(size: 12))
                    }
                }
            }

            group("Demo") {
                ScrollView {
                    VStack(spacing: 6) {
                        ForEach(client.cases) { item in
                            choice(selected: settings.caseFile == item.file) {
                                settings.caseFile = item.file
                            } label: {
                                Text(item.name).fontWeight(.medium)
                                Spacer()
                                Text("\(item.steps) steps").font(.system(size: 11)).foregroundStyle(Color.muted)
                            }
                        }

                        if client.cases.isEmpty {
                            Text(client.online ? "No demo cases found in demo/cases" : "Start the runner: bun run demo")
                                .font(.system(size: 12, design: .monospaced))
                                .foregroundStyle(Color.muted)
                                .frame(maxWidth: .infinity, alignment: .leading)
                        }
                    }
                }
                .frame(maxHeight: 170)
            }

            Spacer(minLength: 0)

            if let error = client.error {
                Text(error)
                    .font(.system(size: 12))
                    .foregroundStyle(Color.danger)
                    .fixedSize(horizontal: false, vertical: true)
                    .textSelection(.enabled)
            }

            HStack(spacing: 16) {
                Button("Quit") { actions.quit() }
                    .buttonStyle(.plain)
                    .foregroundStyle(Color.muted)
                if client.state?.def != nil {
                    Button("Back to demo") { settings.configuring = false }
                        .buttonStyle(.plain)
                        .foregroundStyle(Color.muted)
                }
                Spacer()
                Button(action: start) {
                    Text(settings.pendingFile == nil ? "Start demo" : "Starting…")
                        .fontWeight(.semibold)
                        .padding(.horizontal, 18)
                        .padding(.vertical, 8)
                        .background(canStart ? Color.accent : Color.white.opacity(0.15), in: RoundedRectangle(cornerRadius: 8))
                        .foregroundStyle(canStart ? Color.black.opacity(0.8) : Color.muted)
                }
                .buttonStyle(.plain)
                .disabled(!canStart)
                .keyboardShortcut(.defaultAction)
            }
        }
        .padding(20)
        .onAppear {
            client.send("cases")
            if settings.caseFile == nil {
                settings.caseFile = client.state?.file ?? client.cases.first?.file
            }
        }
        .onChange(of: client.cases.map(\.file)) { _, files in
            if settings.caseFile == nil || !files.contains(settings.caseFile ?? "") {
                settings.caseFile = client.state?.file ?? files.first
            }
        }
    }

    private var canStart: Bool {
        client.online
            && settings.pendingFile == nil
            && settings.caseFile != nil
            && client.cases.contains { $0.file == settings.caseFile }
    }

    private func group<Content: View>(_ title: String, @ViewBuilder content: () -> Content) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            SectionLabel(text: title).padding(.leading, -6)
            content()
        }
    }

    private func choice<Label: View>(
        selected: Bool,
        action: @escaping () -> Void,
        @ViewBuilder label: () -> Label
    ) -> some View {
        Button(action: action) {
            HStack(spacing: 8) {
                label()
            }
            .font(.system(size: 13))
            .padding(.horizontal, 10)
            .padding(.vertical, 8)
            .frame(maxWidth: .infinity, alignment: .leading)
            .background(selected ? Color.accent.opacity(0.16) : Color.card, in: RoundedRectangle(cornerRadius: 8))
            .overlay(RoundedRectangle(cornerRadius: 8).strokeBorder(selected ? Color.accent : .clear))
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
    }

    private func slider(
        _ title: String,
        value: Binding<Double>,
        range: ClosedRange<Double>,
        format: @escaping (Double) -> String
    ) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            HStack {
                Text(title)
                Spacer()
                Text(format(value.wrappedValue)).font(.system(size: 11, design: .monospaced)).foregroundStyle(Color.muted)
            }
            .font(.system(size: 12))
            Slider(value: value, in: range).controlSize(.small)
        }
    }
}

struct Preview: View {
    @ObservedObject var settings: OverlaySettings

    var body: some View {
        GeometryReader { geometry in
            let screen = settings.nsScreen?.frame.size ?? CGSize(width: 16, height: 10)
            let scale = min(geometry.size.width / screen.width, geometry.size.height / screen.height)
            let width = screen.width * scale
            let height = screen.height * scale
            let strip = settings.size * scale

            ZStack(alignment: alignment) {
                RoundedRectangle(cornerRadius: 4)
                    .fill(Color.white.opacity(0.08))
                    .overlay(RoundedRectangle(cornerRadius: 4).strokeBorder(Color.white.opacity(0.25)))

                RoundedRectangle(cornerRadius: 3)
                    .fill(Color.accent.opacity(0.7))
                    .frame(
                        width: settings.vertical ? strip : nil,
                        height: settings.vertical ? nil : strip
                    )
                    .padding(2)
            }
            .frame(width: width, height: height)
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .animation(.easeOut(duration: 0.2), value: settings.position)
        }
    }

    private var alignment: Alignment {
        switch settings.position {
        case "left": return .leading
        case "top": return .top
        case "bottom": return .bottom
        default: return .trailing
        }
    }
}
