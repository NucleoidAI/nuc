import Foundation

enum JSONValue: Decodable {
    case string(String)
    case number(Double)
    case bool(Bool)
    case array([JSONValue])
    case object([String: JSONValue])
    case null

    init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()

        if container.decodeNil() {
            self = .null
        } else if let value = try? container.decode(Bool.self) {
            self = .bool(value)
        } else if let value = try? container.decode(Double.self) {
            self = .number(value)
        } else if let value = try? container.decode(String.self) {
            self = .string(value)
        } else if let value = try? container.decode([JSONValue].self) {
            self = .array(value)
        } else {
            self = .object(try container.decode([String: JSONValue].self))
        }
    }

    var text: String {
        switch self {
        case .string(let value):
            return value
        case .number(let value):
            return value.rounded() == value ? String(Int(value)) : String(value)
        case .bool(let value):
            return String(value)
        case .array(let values):
            return values.map(\.text).joined(separator: "|")
        case .object(let values):
            return values.map { "\($0.key) \($0.value.text)" }.joined(separator: ", ")
        case .null:
            return "null"
        }
    }
}

struct Trigger: Decodable {
    let event: String?
    let delay: Double?
    let label: String?
    let `where`: [String: JSONValue]?
}

struct PaneDef: Codable, Equatable {
    let window: String
    var side: String?
    var url: String?
    var route: String?
}

struct LayoutDef: Codable, Equatable {
    var preset: String?
    var ratio: Double?
    var panes: [PaneDef]
}

struct WindowInfo: Decodable {
    let type: String
    let app: String?
    let url: String?
    let profile: String?
}

struct Step: Decodable, Identifiable {
    let id: String
    let title: String
    let note: String?
    let advance: [Trigger]?
    let layout: LayoutDef?
}

struct Indicator: Decodable {
    let position: String?
    let size: Double?
}

struct DemoCase: Decodable {
    let name: String
    let indicator: Indicator?
    let windows: [String: WindowInfo]?
    let steps: [Step]
}

struct Rect: Decodable, Equatable {
    let x: Double
    let y: Double
    let w: Double
    let h: Double
}

struct EffectiveIndicator: Decodable, Equatable {
    let screen: Int
    let position: String
    let size: Double
    let reserve: Bool
}

struct LogEntry: Decodable {
    let at: Double
    let type: String
    let matched: Bool
    let simulated: Bool
}

struct RunnerState: Decodable {
    let file: String?
    let def: DemoCase?
    let index: Int
    let finished: Bool
    let startedAt: Double
    let enteredAt: [Double?]
    let log: [LogEntry]
    let connected: Bool
    let layoutError: String?
    let indicatorRect: Rect?
    let indicator: EffectiveIndicator?
    let currentLayout: LayoutDef?
    let eventUrl: String
    let now: Double

    func entered(_ index: Int) -> Double? {
        index < enteredAt.count ? enteredAt[index] : nil
    }
}

struct CaseSummary: Decodable, Identifiable {
    let file: String
    let name: String
    let steps: Int

    var id: String { file }
}

private struct Envelope: Decodable {
    let kind: String
    let state: RunnerState?
    let cases: [CaseSummary]?
    let message: String?
}

@MainActor
final class RunnerClient: ObservableObject {
    @Published var state: RunnerState?
    @Published var cases: [CaseSummary] = []
    @Published var online = false
    @Published var error: String?

    var skew: Double = 0

    private let url: URL
    private var task: URLSessionWebSocketTask?

    init(url: URL) {
        self.url = url
    }

    var now: Double {
        Date().timeIntervalSince1970 * 1000 - skew
    }

    func connect() {
        task?.cancel(with: .goingAway, reason: nil)

        let task = URLSession.shared.webSocketTask(with: url)
        self.task = task
        task.resume()
        receive(on: task)
    }

    func send(_ action: String, _ body: [String: Any] = [:]) {
        var payload = body
        payload["action"] = action

        guard
            let data = try? JSONSerialization.data(withJSONObject: payload),
            let text = String(data: data, encoding: .utf8)
        else {
            return
        }

        task?.send(.string(text)) { _ in }
    }

    private func receive(on task: URLSessionWebSocketTask) {
        task.receive { [weak self] result in
            Task { @MainActor in
                guard let self, self.task === task else {
                    return
                }

                switch result {
                case .success(let message):
                    self.online = true
                    self.handle(message)
                    self.receive(on: task)
                case .failure:
                    self.online = false
                    try? await Task.sleep(for: .seconds(1))
                    self.connect()
                }
            }
        }
    }

    private func handle(_ message: URLSessionWebSocketTask.Message) {
        let data: Data

        switch message {
        case .string(let text):
            data = Data(text.utf8)
        case .data(let raw):
            data = raw
        @unknown default:
            return
        }

        guard let envelope = try? JSONDecoder().decode(Envelope.self, from: data) else {
            return
        }

        switch envelope.kind {
        case "state":
            if let state = envelope.state {
                skew = Date().timeIntervalSince1970 * 1000 - state.now
                self.state = state
            }
        case "cases":
            cases = envelope.cases ?? []
        case "error":
            error = envelope.message
        default:
            break
        }
    }
}

func clock(_ milliseconds: Double) -> String {
    let total = max(0, Int(milliseconds / 1000))

    return String(format: "%d:%02d", total / 60, total % 60)
}
