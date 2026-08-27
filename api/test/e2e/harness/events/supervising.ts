import { publish } from "./bus";
import type { SupervisingAnswered, SupervisingRaised } from "./types";

function raised(question: SupervisingRaised) {
  return publish("SUPERVISING_RAISED", question);
}

function answered(answer: SupervisingAnswered) {
  return publish("SUPERVISING_ANSWERED", answer);
}

export default { raised, answered };
