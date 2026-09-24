import SwiftUI

struct LayoutEditor: View {
    @ObservedObject var client: RunnerClient
    @EnvironmentObject var actions: OverlayActions
    let state: RunnerState
    let def: DemoCase

    @State private var draft = LayoutDef(panes: [])
    @State private var ratio = 0.5

    private let sides = [("off", "Off"), ("left", "Left"), ("full", "Full"), ("right", "Right")]

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            VStack(alignment: .leading, spacing: 4) {
                Text("Layout").font(.system(size: 20, weight: .semibold))
                Text(stepTitle)
                    .font(.system(size: 12))
                    .foregroundStyle(Color.muted)
                    .lineLimit(1)
            }

            Preview(draft: draft, ratio: ratio)
                .frame(height: 110)

            VStack(spacing: 8) {
                ForEach(windowKeys, id: \.self) { key in
                    VStack(alignment: .leading, spacing: 6) {
                        HStack(spacing: 10) {
                            VStack(alignment: .leading, spacing: 1) {
                                Text(key).font(.system(size: 13, weight: .medium))
                                Text(detail(key))
                                    .font(.system(size: 10.5))
                                    .foregroundStyle(Color.faint)
                                    .lineLimit(1)
                            }
                            Spacer(minLength: 8)
                            Picker("", selection: binding(for: key)) {
                                ForEach(sides, id: \.0) { value, label in
                                    Text(label).tag(value)
                                }
                            }
                            .pickerStyle(.segmented)
                            .labelsHidden()
                            .frame(width: 210)
                        }

                        if draft.panes.contains(where: { $0.window == key }), def.windows?[key]?.type != "app" {
                            TextField("Route, e.g. /agents/{{agentId}}", text: route(for: key))
                                .textFieldStyle(.roundedBorder)
                                .font(.system(size: 12, design: .monospaced))
                                .onSubmit(save)
                        }
                    }
                    .padding(.horizontal, 10)
                    .padding(.vertical, 7)
                    .background(Color.card, in: RoundedRectangle(cornerRadius: 8))
                }
            }

            if hasBothSides {
                VStack(alignment: .leading, spacing: 2) {
                    HStack {
                        Text("Left side width")
                        Spacer()
                        Text("\(Int(ratio * 100))% / \(100 - Int(ratio * 100))%")
                            .font(.system(size: 11, design: .monospaced))
                            .foregroundStyle(Color.muted)
                    }
                    .font(.system(size: 12))
                    Slider(value: $ratio, in: 0.2...0.8, step: 0.05) { editing in
                        if !editing {
                            draft.ratio = ratio
                            save()
                        }
                    }
                    .controlSize(.small)
                }
            }

            if let error = client.error {
                Text(error).font(.system(size: 12)).foregroundStyle(Color.danger)
            }

            Spacer(minLength: 0)

            HStack(spacing: 16) {
                Button("Swap sides") { swap() }
                    .buttonStyle(.plain)
                    .foregroundStyle(hasBothSides ? Color.white : Color.faint)
                    .disabled(!hasBothSides)
                Button("Re-apply") { client.send("arrange") }
                    .buttonStyle(.plain)
                    .foregroundStyle(Color.muted)
                Spacer()
                Button {
                    save()
                    actions.closeLayout()
                } label: {
                    Text("Done")
                        .fontWeight(.semibold)
                        .padding(.horizontal, 18)
                        .padding(.vertical, 8)
                        .background(Color.accent, in: RoundedRectangle(cornerRadius: 8))
                        .foregroundStyle(Color.black.opacity(0.8))
                }
                .buttonStyle(.plain)
                .keyboardShortcut(.defaultAction)
            }
        }
        .padding(20)
        .onAppear(perform: reset)
        .onChange(of: state.index) { reset() }
    }

    private var stepTitle: String {
        guard def.steps.indices.contains(state.index) else {
            return ""
        }

        return "Step \(state.index + 1) · \(def.steps[state.index].title)"
    }

    private var windowKeys: [String] {
        let used = draft.panes.map(\.window)
        let rest = (def.windows ?? [:]).keys.filter { !used.contains($0) }.sorted()
        return used + rest
    }

    private var hasBothSides: Bool {
        draft.panes.contains { $0.side == "left" } && draft.panes.contains { $0.side == "right" }
    }

    private func detail(_ key: String) -> String {
        guard let window = def.windows?[key] else {
            return ""
        }

        switch window.type {
        case "chrome-app":
            return "Chrome app · \(window.app ?? "")"
        case "chrome":
            return window.profile.map { "Chrome · \($0)" } ?? "Chrome"
        default:
            return window.app ?? window.type
        }
    }

    private func binding(for key: String) -> Binding<String> {
        Binding(
            get: { draft.panes.first { $0.window == key }?.side ?? "off" },
            set: { choose(key, side: $0) }
        )
    }

    private func route(for key: String) -> Binding<String> {
        Binding(
            get: { draft.panes.first { $0.window == key }?.route ?? "" },
            set: { value in
                guard let index = draft.panes.firstIndex(where: { $0.window == key }) else {
                    return
                }

                draft.panes[index].route = value.isEmpty ? nil : value
            }
        )
    }

    private func choose(_ key: String, side: String) {
        var panes = draft.panes

        if side == "full" {
            panes.removeAll { $0.window != key }
        } else if side != "off" {
            panes.removeAll { $0.side == "full" && $0.window != key }
        }

        if side == "off" {
            panes.removeAll { $0.window == key }
        } else if let index = panes.firstIndex(where: { $0.window == key }) {
            panes[index].side = side
        } else {
            panes.append(PaneDef(window: key, side: side))
        }

        draft.panes = panes
        save()
    }

    private func swap() {
        draft.panes = draft.panes.map { pane in
            var pane = pane
            pane.side = pane.side == "left" ? "right" : pane.side == "right" ? "left" : pane.side
            return pane
        }
        ratio = 1 - ratio
        draft.ratio = ratio
        save()
    }

    private func save() {
        guard !draft.panes.isEmpty else {
            return
        }

        draft.preset = nil

        guard
            let data = try? JSONEncoder().encode(draft),
            let layout = try? JSONSerialization.jsonObject(with: data)
        else {
            return
        }

        client.error = nil
        client.send("set-layout", ["index": state.index, "layout": layout])
    }

    private func reset() {
        let current = state.currentLayout ?? LayoutDef(panes: [])
        ratio = current.ratio ?? 0.5

        if current.panes.contains(where: { $0.side != nil }) {
            draft = current
            return
        }

        let full = current.preset == "full" || current.panes.count == 1

        draft = LayoutDef(
            preset: nil,
            ratio: ratio,
            panes: current.panes.enumerated().compactMap { index, pane in
                if full && index > 0 {
                    return nil
                }

                var pane = pane
                pane.side = full ? "full" : index == 0 ? "left" : "right"
                return pane
            }
        )
    }

    private struct Preview: View {
        let draft: LayoutDef
        let ratio: Double

        var body: some View {
            GeometryReader { geometry in
                let size = geometry.size
                let left = draft.panes.filter { $0.side == "left" }
                let right = draft.panes.filter { $0.side == "right" }
                let full = draft.panes.filter { $0.side == "full" }
                let split = !left.isEmpty && !right.isEmpty
                let leftWidth = split ? size.width * ratio : size.width
                let rightWidth = split ? size.width * (1 - ratio) : size.width

                ZStack(alignment: .topLeading) {
                    RoundedRectangle(cornerRadius: 6).fill(Color.white.opacity(0.05))

                    if let pane = full.first {
                        tile(pane.window).frame(width: size.width, height: size.height)
                    } else {
                        column(left, width: leftWidth, height: size.height)
                        column(right, width: rightWidth, height: size.height)
                            .offset(x: split ? leftWidth : 0)
                    }
                }
                .animation(.easeOut(duration: 0.2), value: draft)
                .animation(.easeOut(duration: 0.2), value: ratio)
            }
        }

        private func column(_ panes: [PaneDef], width: CGFloat, height: CGFloat) -> some View {
            VStack(spacing: 0) {
                ForEach(panes, id: \.window) { pane in
                    tile(pane.window).frame(width: width, height: height / CGFloat(max(panes.count, 1)))
                }
            }
        }

        private func tile(_ label: String) -> some View {
            RoundedRectangle(cornerRadius: 5)
                .fill(Color.accent.opacity(0.18))
                .overlay(RoundedRectangle(cornerRadius: 5).strokeBorder(Color.accent.opacity(0.7)))
                .overlay(Text(label).font(.system(size: 12, weight: .medium)))
                .padding(3)
        }
    }
}
