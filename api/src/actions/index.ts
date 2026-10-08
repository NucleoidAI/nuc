import actions from "./actions.json";

function find(action: string) {
  return actions.find((a) => a.action === action);
}

function definitions({ blocking = true }: { blocking?: boolean } = {}) {
  return blocking
    ? actions
    : actions.filter((a) => a.action !== "PLATFORM:ask_supervisor");
}

function list() {
  return {
    role: "system",
    content: { actions },
  } as {
    role: "user" | "system" | "assistant";
    content: object;
  };
}

export default {
  find,
  definitions,
  list,
};
