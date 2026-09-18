import {
  MEETING_SUMMARY_A_BLUEPRINT_ID,
  MEETING_TEAM_ID,
  SESSION,
  TEAM_ID,
} from "./fixtures/ids";
import {
  meetingRequest,
  meetingTranscripts,
  meetingWavFiles,
} from "./fixtures/meeting";

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
    const wavFiles = meetingWavFiles();
    const transcripts = meetingTranscripts();

    mcp.tool("TELCO:pcm_to_wav").returns({
      success: true,
      converted: wavFiles,
      totalFound: wavFiles.length,
      totalConverted: wavFiles.length,
    });

    mcp.tool("TELCO:transcribe_meeting").returns(transcripts);

    mcp.tool("TELCO:summarize_meeting").returns({
      summary:
        "Toplantida butce, vendor iliskileri, yapay zeka calismalari ve personel " +
        "konulari ele alindi. Ekipler mevcut durumu degerlendirip onceliklendirme " +
        "yapti ve acik kalan maddeleri bir sonraki toplantiya birakti.",
      highlights: [
        {
          topic: "Butce",
          highlights: ["DMA icin ek butce talebi gorusuldu"],
        },
        {
          topic: "Personel",
          highlights: ["Ekiplerin kapasite planlamasi ele alindi"],
        },
      ],
    });

    mcp.tool("TELCO:judge_summary").expectsNoCalls();
    mcp.tool("TELCO:prepare_meeting_attachments").expectsNoCalls();

    mcp
      .tool("TELCO:send_email_ews")
      .returns({ success: true, transport: "ews-ntlm" });

    await supertest(app)
      .post(`/sessions/${SESSION.meetingSummaryA}`)
      .send({ content: meetingRequest() })
      .expect(200);

    const created = await event.waitFor(
      "TASK_CREATED",
      (payload) => payload.sessionId === SESSION.meetingSummaryA
    );

    expect(created.blueprintId).toBe(MEETING_SUMMARY_A_BLUEPRINT_ID);

    const completedTask = await event.waitFor(
      "TASK_COMPLETED",
      (payload) => payload.taskId === created.taskId
    );

    expect(completedTask.taskId).toBe(created.taskId);
    expect(mcp.tool("TELCO:transcribe_meeting").lastCall).toMatchObject({
      includeSpeakerTranscripts: false,
    });
    expect(mcp.tool("TELCO:summarize_meeting").lastCall).toMatchObject({
      transcript: transcripts.full_meeting_transcript,
    });
    expect(mcp.tool("TELCO:send_email_ews").calls.length).toBeGreaterThan(0);
  }, 900_000);
});
