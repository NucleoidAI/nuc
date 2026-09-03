import path from "node:path";

const MEETING_ID = "95172263413";

const MEETING_DIR = path.join(__dirname, "meeting", MEETING_ID);

const MEETING_TOPIC = "Yonetim Sync (B-I-S)";

const PARTICIPANTS = [
  {
    userId: "16778240",
    participantUserId: "e93Kt1zLRcC336N5T8gAoQ",
    name: "Selçuk Koçyiğit",
    email: "selcuk.kocyigit@meeting.invalid",
    joinTime: "2026-08-24T06:56:46Z",
    leaveTime: "2026-08-24T09:43:48Z",
    audioFile: "16778240.wav",
  },
  {
    userId: "16779264",
    participantUserId: "wXzW8g3jRcCqnij2qzqkHw",
    name: "Onur Temel",
    email: "onur.temel@meeting.invalid",
    joinTime: "2026-08-24T07:04:22Z",
    leaveTime: "2026-08-24T09:43:48Z",
    audioFile: "16779264.wav",
  },
  {
    userId: "16781312",
    participantUserId: "ptGyXWgxRTOmoICKfueszw",
    name: "İsmail Odabaşı",
    email: "ismail.odabasi@meeting.invalid",
    joinTime: "2026-08-24T07:10:24Z",
    leaveTime: "2026-08-24T09:43:50Z",
    audioFile: "16781312.wav",
  },
  {
    userId: "16782336",
    participantUserId: "PwfjEpEQSX-_MJgWj0ZKxw",
    name: "GM Umraniye T203 T.O.",
    email: "gm.umraniye.t203@meeting.invalid",
    joinTime: "2026-08-24T07:12:54Z",
    leaveTime: "2026-08-24T09:43:52Z",
    audioFile: "16782336.wav",
  },
];

function meetingRequest(): string {
  return JSON.stringify({
    directoryPath: MEETING_DIR,
    meetingId: MEETING_ID,
    topic: MEETING_TOPIC,
    status: "completed",
    recording: {
      mixedAudio: "meeting-audio.wav",
    },
    participants: PARTICIPANTS,
  });
}

export { MEETING_DIR, MEETING_ID, MEETING_TOPIC, PARTICIPANTS, meetingRequest };
