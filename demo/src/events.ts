import { io, type Socket } from "socket.io-client";

const KNOWN_EVENTS = [
  "SESSION_INITIATED",
  "SESSION_USER_MESSAGED",
  "AI_ASSISTANT_MESSAGED",
  "MESSAGE_USER_MESSAGED",
  "MESSAGE_ASSISTANT_MESSAGED",
  "SUPERVISING_RAISED",
  "SUPERVISING_ANSWERED",
  "TASK_CREATED",
  "TASK_COMPLETED",
  "STEP_ADDED",
  "STEP_COMPLETED",
  "STEP_FAILED",
  "KNOWLEDGE_CREATED",
  "BLUEPRINT_CREATED",
  "EMAIL_RECEIVED",
  "EMAIL_SENT",
  "ERROR_OCCURRED",
];

class EventListener {
  private socket: Socket;
  private types = new Set<string>(KNOWN_EVENTS);

  constructor(
    url: string,
    onEvent: (type: string, payload: unknown) => void,
    onStatus: (connected: boolean) => void,
  ) {
    this.socket = io(url, { reconnection: true });

    this.socket.on("connect", () => {
      this.types.forEach((type) => this.socket.emit("subscribe", type));
      onStatus(true);
    });

    this.socket.on("disconnect", () => onStatus(false));

    this.socket.on("event", ({ type, payload }) => onEvent(type, payload));
  }

  watch(types: string[]) {
    types
      .filter((type) => type !== "*" && !this.types.has(type))
      .forEach((type) => {
        this.types.add(type);

        if (this.socket.connected) {
          this.socket.emit("subscribe", type);
        }
      });
  }
}

export { EventListener };
