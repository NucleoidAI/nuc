import {
  MEETING_AGENT_ID,
  MEETING_SUMMARY_A_BLUEPRINT_ID,
  MEETING_SUMMARY_B_BLUEPRINT_ID,
  SESSION,
} from "./fixtures/ids";
import { meetingRequest } from "./fixtures/meeting";

import event from "./mocks/events";
import { mcp } from "./mocks/mcp";

describe("Meeting Agent", () => {
  afterEach(event.releaseAll);

  it("summarizes the meeting from the full transcript only and emails the participants", async () => {
    mcp
      .tool("GREY:send_email")
      .returns({ success: true, messageId: "<e2e-meeting-a@greycollar.test>" });

    await event.publish("SESSION_USER_MESSAGED", {
      agentId: MEETING_AGENT_ID,
      sessionId: SESSION.meetingSummaryA,
      content: meetingRequest(),
    });

    const created = await event.waitFor(
      "TASK_CREATED",
      (payload) => payload.sessionId === SESSION.meetingSummaryA,
    );

    expect(created.blueprintId).toBe(MEETING_SUMMARY_A_BLUEPRINT_ID);

    const completedTask = await event.waitFor(
      "TASK_COMPLETED",
      (payload) => payload.taskId === created.taskId,
    );

    expect(completedTask.taskId).toBe(created.taskId);
    expect(mcp.tool("GREY:send_email").calls.length).toBeGreaterThan(0);
  }, 900_000);

  it("summarizes the meeting per speaker and emails the participants and the manager", async () => {
    mcp
      .tool("GREY:send_email")
      .returns({ success: true, messageId: "<e2e-meeting-b@greycollar.test>" });

    await event.publish("SESSION_USER_MESSAGED", {
      agentId: MEETING_AGENT_ID,
      sessionId: SESSION.meetingSummaryB,
      content: meetingRequest(),
    });

    const created = await event.waitFor(
      "TASK_CREATED",
      (payload) => payload.sessionId === SESSION.meetingSummaryB,
    );

    expect(created.blueprintId).toBe(MEETING_SUMMARY_B_BLUEPRINT_ID);

    const completedTask = await event.waitFor(
      "TASK_COMPLETED",
      (payload) => payload.taskId === created.taskId,
    );

    expect(completedTask.taskId).toBe(created.taskId);
    expect(mcp.tool("GREY:send_email").calls.length).toBeGreaterThan(0);
  }, 900_000);
});
