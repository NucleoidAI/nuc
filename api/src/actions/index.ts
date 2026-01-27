import actions from "./actions.json";

function find(action: string) {
  return actions.find((a) => a.action === action);
}

function list() {
  return {
    role: "SYSTEM",
    content: { actions },
  } as {
    role: "USER" | "SYSTEM" | "ASSISTANT";
    content: object;
  };
}

export default {
  find,
  list,
};
