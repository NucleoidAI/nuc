import { on, publish, releaseAll, waitFor } from "./bus";
import { init, watch } from "./scenario";
import session from "./session";
import supervising from "./supervising";

const events = {
  init,
  on,
  publish,
  waitFor,
  watch,
  release: releaseAll,
  session,
  supervising,
};

export default events;
export type { Watched } from "./scenario";
export type {
  AiAssistantMessaged,
  EventMap,
  EventName,
  Payload,
  SessionUserMessaged,
  StepAdded,
  StepSettled,
  StepSupervisedNeeded,
  SupervisingAnswered,
  SupervisingRaised,
  TaskCompleted,
  TaskCreated,
} from "./types";
