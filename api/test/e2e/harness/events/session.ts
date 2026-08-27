import { publish } from "./bus";

type Message = {
  agentId: string;
  sessionId: string;
  content: string | Record<string, unknown>;
};

function userMessaged({ agentId, sessionId, content }: Message) {
  return publish("SESSION_USER_MESSAGED", {
    agentId,
    sessionId,
    content: typeof content === "string" ? content : JSON.stringify(content),
  });
}

export default { userMessaged };
export type { Message };
