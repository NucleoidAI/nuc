import AppKit
import SwiftUI

extension Color {
    static let accent = Color(red: 0.31, green: 0.82, blue: 0.65)
    static let warn = Color(red: 0.96, green: 0.69, blue: 0.30)
    static let danger = Color(red: 0.94, green: 0.42, blue: 0.42)
    static let muted = Color.white.opacity(0.6)
    static let faint = Color.white.opacity(0.38)
    static let card = Color.white.opacity(0.07)
}

final class OverlayActions: ObservableObject {
    var setup: () -> Void = {}
    var editLayout: () -> Void = {}
    var closeLayout: () -> Void = {}
    var hide: () -> Void = {}
    var quit: () -> Void = {}
}

struct Blur: NSViewRepresentable {
    func makeNSView(context: Context) -> NSVisualEffectView {
        let view = NSVisualEffectView()
        view.material = .hudWindow
        view.blendingMode = .behindWindow
        view.state = .active
        view.appearance = NSAppearance(named: .darkAqua)
        return view
    }

    func updateNSView(_ view: NSVisualEffectView, context: Context) {}
}

struct OverlayView: View {
    @ObservedObject var client: RunnerClient
    @ObservedObject var settings: OverlaySettings
    @EnvironmentObject var actions: OverlayActions
    @State private var hovering = false

    let start: () -> Void

    var body: some View {
        TimelineView(.periodic(from: .now, by: 1)) { _ in
            content
                .padding(14)
                .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        }
        .background(
            ZStack {
                Blur()
                Color.black.opacity(0.35)
            }
        )
        .clipShape(RoundedRectangle(cornerRadius: 14, style: .continuous))
        .overlay(
            RoundedRectangle(cornerRadius: 14, style: .continuous)
                .strokeBorder(Color.white.opacity(0.1))
        )
        .opacity(hovering || settings.configuring || settings.editingLayout ? 1 : settings.opacity)
        .animation(.easeOut(duration: 0.2), value: hovering)
        .onHover { hovering = $0 }
        .environment(\.colorScheme, .dark)
        .foregroundStyle(.white)
    }

    @ViewBuilder
    private var content: some View {
        if settings.configuring {
            SetupView(client: client, settings: settings, start: start)
        } else if settings.editingLayout, let state = client.state, let def = state.def {
            LayoutEditor(client: client, state: state, def: def)
        } else if !client.online {
            VStack(spacing: 12) {
                Placeholder(title: "Runner offline", detail: "Start it with: bun run demo")
                HStack(spacing: 6) {
                    IconButton(symbol: "gearshape", help: "Setup (⌃⌥S)") { actions.setup() }
                    IconButton(symbol: "xmark", help: "Quit overlay") { actions.quit() }
                }
            }
        } else if let state = client.state, let def = state.def {
            if horizontal(state) {
                HorizontalFlow(client: client, state: state, def: def)
            } else {
                VerticalFlow(client: client, state: state, def: def)
            }
        } else {
            CasePicker(client: client)
        }
    }

    private func horizontal(_ state: RunnerState) -> Bool {
        let position = state.indicator?.position ?? state.def?.indicator?.position ?? "right"
        return position == "top" || position == "bottom"
    }
}

struct Placeholder: View {
    let title: String
    let detail: String

    var body: some View {
        VStack(spacing: 6) {
            Text(title).font(.headline)
            Text(detail).font(.system(.caption, design: .monospaced)).foregroundStyle(Color.muted)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

struct CasePicker: View {
    @ObservedObject var client: RunnerClient

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("Choose a demo").font(.headline)
            ScrollView {
                VStack(alignment: .leading, spacing: 6) {
                    ForEach(client.cases) { item in
                        Button {
                            client.send("load", ["file": item.file])
                        } label: {
                            VStack(alignment: .leading, spacing: 2) {
                                Text(item.name).fontWeight(.medium)
                                Text("\(item.steps) steps").font(.caption).foregroundStyle(Color.muted)
                            }
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(10)
                            .background(Color.card, in: RoundedRectangle(cornerRadius: 8))
                        }
                        .buttonStyle(.plain)
                    }
                }
            }
        }
    }
}

struct Header: View {
    @ObservedObject var client: RunnerClient
    let state: RunnerState
    let def: DemoCase

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack(spacing: 8) {
                Circle()
                    .fill(state.connected ? Color.accent : Color.danger)
                    .frame(width: 7, height: 7)
                    .help(state.connected ? "Event bus connected" : "Event bus offline")
                Text(def.name).fontWeight(.semibold).lineLimit(1)
                Spacer(minLength: 4)
                Text(clock(elapsed)).font(.system(size: 11, design: .monospaced)).foregroundStyle(Color.muted)
            }
            GeometryReader { geometry in
                ZStack(alignment: .leading) {
                    Capsule().fill(Color.white.opacity(0.12))
                    Capsule().fill(Color.accent).frame(width: geometry.size.width * progress)
                }
            }
            .frame(height: 3)
            .animation(.easeOut(duration: 0.4), value: progress)
        }
    }

    private var progress: Double {
        state.finished ? 1 : Double(state.index) / Double(max(def.steps.count, 1))
    }

    private var elapsed: Double {
        (state.finished ? state.entered(def.steps.count) ?? client.now : client.now) - state.startedAt
    }
}

enum RowKind {
    case done, next, later
}

struct StepRow: View {
    @ObservedObject var client: RunnerClient
    let state: RunnerState
    let step: Step
    let index: Int
    let kind: RowKind
    var compact = false

    var body: some View {
        Button {
            client.send("goto", ["index": index])
        } label: {
            HStack(alignment: .top, spacing: 9) {
                ZStack {
                    Circle()
                        .strokeBorder(kind == .done ? Color.accent : Color.faint, lineWidth: 1.5)
                        .background(Circle().fill(kind == .done ? Color.accent.opacity(0.15) : .clear))
                    Text(kind == .done ? "✓" : "\(index + 1)")
                        .font(.system(size: 10, weight: .semibold))
                        .foregroundStyle(kind == .done ? Color.accent : Color.faint)
                }
                .frame(width: 20, height: 20)

                Text(step.title)
                    .font(.system(size: 13, weight: .medium))
                    .foregroundStyle(kind == .later ? Color.faint : Color.muted)
                    .lineLimit(compact ? 2 : 1)
                    .frame(maxWidth: .infinity, alignment: .leading)

                if !compact, kind == .done, let time = duration {
                    Text(time).font(.system(size: 10, design: .monospaced)).foregroundStyle(Color.faint)
                }
            }
            .padding(.vertical, 5)
            .padding(.horizontal, 6)
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
    }

    private var duration: String? {
        guard let start = state.entered(index), let end = state.entered(index + 1) else {
            return nil
        }

        return clock(end - start)
    }
}

struct NowCard: View {
    @ObservedObject var client: RunnerClient
    let state: RunnerState
    let def: DemoCase
    var compact = false

    var body: some View {
        VStack(alignment: .leading, spacing: compact ? 5 : 9) {
            if state.finished {
                Text("COMPLETE").font(.system(size: 10, weight: .bold)).kerning(1.2).foregroundStyle(Color.accent)
                Text("That's the demo 🎉").font(.system(size: compact ? 15 : 18, weight: .semibold))
            } else {
                let step = def.steps[state.index]

                HStack {
                    Text("NOW · \(state.index + 1)/\(def.steps.count)")
                    Spacer()
                    if let entered = state.entered(state.index) {
                        Text(clock(client.now - entered)).font(.system(size: 10, design: .monospaced))
                    }
                }
                .font(.system(size: 10, weight: .bold))
                .kerning(1.2)
                .foregroundStyle(Color.accent)

                Text(step.title).font(.system(size: compact ? 15 : 18, weight: .semibold))

                if let note = step.note, !note.isEmpty {
                    Text(note)
                        .font(.system(size: 12.5))
                        .foregroundStyle(Color.white.opacity(0.8))
                        .lineLimit(compact ? 2 : nil)
                        .fixedSize(horizontal: false, vertical: !compact)
                }

                ForEach(Array(waits(step).enumerated()), id: \.offset) { _, wait in
                    HStack(spacing: 7) {
                        Pulse()
                        Text(wait).lineLimit(1).truncationMode(.tail)
                    }
                    .font(.system(size: 11, design: .monospaced))
                    .foregroundStyle(Color.muted)
                    .padding(.vertical, 5)
                    .padding(.horizontal, 8)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .background(Color.card, in: RoundedRectangle(cornerRadius: 7))
                }
            }
        }
        .padding(compact ? 10 : 13)
        .background(Color.white.opacity(0.06), in: RoundedRectangle(cornerRadius: 12))
        .overlay(RoundedRectangle(cornerRadius: 12).strokeBorder(Color.accent.opacity(0.9)))
        .shadow(color: Color.accent.opacity(0.25), radius: 8)
    }

    private func waits(_ step: Step) -> [String] {
        guard let triggers = step.advance, !triggers.isEmpty else {
            return ["Press ⌃⌥→ to continue"]
        }

        return triggers.map(describe)
    }

    private func describe(_ trigger: Trigger) -> String {
        if let label = trigger.label {
            return label
        }

        if let delay = trigger.delay {
            let entered = state.entered(state.index) ?? client.now
            return "auto in \(clock(delay - (client.now - entered) + 999))"
        }

        let filters = (trigger.where ?? [:])
            .sorted { $0.key < $1.key }
            .map { key, value -> String in
                if case .object(let condition) = value, let (op, operand) = condition.first {
                    return "\(key) \(op) \(operand.text)"
                }
                return "\(key)=\(value.text)"
            }
            .joined(separator: ", ")

        let event = trigger.event ?? "event"
        return filters.isEmpty ? event : "\(event) · \(filters)"
    }
}

struct Pulse: View {
    @State private var dim = false

    var body: some View {
        Circle()
            .fill(Color.warn)
            .frame(width: 7, height: 7)
            .opacity(dim ? 0.25 : 1)
            .onAppear {
                withAnimation(.easeInOut(duration: 0.7).repeatForever()) {
                    dim = true
                }
            }
    }
}

struct Controls: View {
    @ObservedObject var client: RunnerClient
    @EnvironmentObject var actions: OverlayActions
    let state: RunnerState

    var body: some View {
        HStack(spacing: 6) {
            IconButton(symbol: "chevron.left", help: "Previous (⌃⌥←)") { client.send("prev") }
            Button {
                client.send("next")
            } label: {
                Text(state.finished ? "Done" : "Next")
                    .fontWeight(.semibold)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 6)
                    .background(Color.accent, in: RoundedRectangle(cornerRadius: 8))
                    .foregroundStyle(Color.black.opacity(0.8))
            }
            .buttonStyle(.plain)
            .help("Next (⌃⌥→)")
            IconButton(symbol: "arrow.counterclockwise", help: "Restart (⌃⌥R)") { client.send("restart") }
            IconButton(symbol: "rectangle.split.2x1", help: "Edit layout") { actions.editLayout() }
            IconButton(symbol: "gearshape", help: "Setup (⌃⌥S)") { actions.setup() }
            IconButton(symbol: "xmark", help: "Quit overlay") { actions.quit() }
        }
    }
}

struct IconButton: View {
    let symbol: String
    let help: String
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Image(systemName: symbol)
                .frame(width: 28, height: 28)
                .background(Color.card, in: RoundedRectangle(cornerRadius: 8))
        }
        .buttonStyle(.plain)
        .help(help)
    }
}

struct Ticker: View {
    let state: RunnerState
    var limit = 4

    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            ForEach(Array(state.log.prefix(limit).enumerated()), id: \.offset) { _, entry in
                Text("\(time(entry.at)) \(entry.matched ? "▸" : "·") \(entry.type)\(entry.simulated ? " (sim)" : "")")
                    .foregroundStyle(entry.matched ? Color.accent : Color.faint)
                    .lineLimit(1)
            }
        }
        .font(.system(size: 10, design: .monospaced))
    }

    private func time(_ at: Double) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "HH:mm:ss"
        return formatter.string(from: Date(timeIntervalSince1970: at / 1000))
    }
}

struct Alerts: View {
    @ObservedObject var client: RunnerClient
    let state: RunnerState

    var body: some View {
        let alerts = [
            state.connected ? nil : "Event bus offline (\(state.eventUrl))",
            state.layoutError.map { "Layout: \($0)" },
            client.error,
        ].compactMap { $0 }

        ForEach(alerts, id: \.self) { alert in
            Text(alert).font(.system(size: 11)).foregroundStyle(Color.danger).lineLimit(2)
        }
    }
}

struct SectionLabel: View {
    let text: String

    var body: some View {
        Text(text.uppercased())
            .font(.system(size: 9.5, weight: .semibold))
            .kerning(1.3)
            .foregroundStyle(Color.faint)
            .padding(.top, 6)
            .padding(.leading, 6)
    }
}

struct VerticalFlow: View {
    @ObservedObject var client: RunnerClient
    let state: RunnerState
    let def: DemoCase

    var body: some View {
        VStack(alignment: .leading, spacing: 10) {
            Header(client: client, state: state, def: def)

            ScrollViewReader { proxy in
                ScrollView(showsIndicators: false) {
                    VStack(alignment: .leading, spacing: 2) {
                        let doneCount = state.finished ? def.steps.count : state.index

                        if doneCount > 0 {
                            SectionLabel(text: "Done")
                            ForEach(0..<doneCount, id: \.self) { index in
                                StepRow(client: client, state: state, step: def.steps[index], index: index, kind: .done)
                            }
                        }

                        SectionLabel(text: state.finished ? "Finished" : "Now")
                        NowCard(client: client, state: state, def: def).id("now").padding(.vertical, 4)

                        if !state.finished, state.index + 1 < def.steps.count {
                            SectionLabel(text: "Next")
                            ForEach(state.index + 1..<def.steps.count, id: \.self) { index in
                                StepRow(
                                    client: client, state: state, step: def.steps[index], index: index,
                                    kind: index == state.index + 1 ? .next : .later
                                )
                            }
                        }
                    }
                    .padding(.horizontal, 2)
                }
                .onChange(of: state.index) { withAnimation { proxy.scrollTo("now", anchor: .center) } }
                .onAppear { proxy.scrollTo("now", anchor: .center) }
            }

            Controls(client: client, state: state)
            Ticker(state: state)
            Alerts(client: client, state: state)
        }
    }
}

struct HorizontalFlow: View {
    @ObservedObject var client: RunnerClient
    let state: RunnerState
    let def: DemoCase

    var body: some View {
        HStack(alignment: .center, spacing: 14) {
            Header(client: client, state: state, def: def)
                .frame(width: 180)

            HStack(spacing: 8) {
                let pastStart = max(0, state.index - 2)

                if !state.finished {
                    ForEach(pastStart..<state.index, id: \.self) { index in
                        StepRow(client: client, state: state, step: def.steps[index], index: index, kind: .done, compact: true)
                            .frame(maxWidth: 170)
                        Arrow()
                    }
                }

                NowCard(client: client, state: state, def: def, compact: true)
                    .frame(minWidth: 280, maxWidth: 560)

                if !state.finished {
                    ForEach(state.index + 1..<min(def.steps.count, state.index + 3), id: \.self) { index in
                        Arrow()
                        StepRow(
                            client: client, state: state, step: def.steps[index], index: index,
                            kind: index == state.index + 1 ? .next : .later, compact: true
                        )
                        .frame(maxWidth: 170)
                    }
                }
            }
            .frame(maxWidth: .infinity)

            VStack(alignment: .leading, spacing: 8) {
                Controls(client: client, state: state)
                Ticker(state: state, limit: 2)
                Alerts(client: client, state: state)
            }
            .frame(width: 270)
        }
        .frame(maxHeight: .infinity)
    }
}

struct Arrow: View {
    var body: some View {
        Image(systemName: "arrow.right").font(.system(size: 10)).foregroundStyle(Color.faint)
    }
}
