import {
  MEETING_SUMMARY_A_BLUEPRINT_ID,
  MEETING_SUMMARY_B_BLUEPRINT_ID,
  MEETING_TEAM_ID,
  SESSION,
  TEAM_ID,
} from "./fixtures/ids";
import { meetingRequest } from "./fixtures/meeting";

import event from "./mocks/events";
import { mcp } from "./mocks/mcp";
import supertest from "supertest";

describe("Meeting Agent", () => {
  beforeAll(() => {
    process.env.PROJECT_ID = MEETING_TEAM_ID;
  });

  afterAll(() => {
    process.env.PROJECT_ID = TEAM_ID;
  });

  afterEach(event.releaseAll);

  it("summarizes the meeting from the full transcript only and emails the participants", async () => {
    mcp
      .tool("GREY:send_email")
      .returns({ success: true, messageId: "<e2e-meeting-a@greycollar.test>" });

    await supertest(app)
      .post(`/sessions/${SESSION.meetingSummaryA}`)
      .send({ content: meetingRequest() })
      .expect(200);

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

    await supertest(app)
      .post(`/sessions/${SESSION.meetingSummaryB}`)
      .send({ content: meetingRequest() })
      .expect(200);

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
