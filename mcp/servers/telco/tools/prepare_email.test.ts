import { expect, test } from "bun:test";
import { prepareEmailTool } from "./prepare_email";

test("renders the template into subject, text and html", async () => {
  const result = await prepareEmailTool.handler({
    template: "meeting_summary_a",
    meetingName: "Haftalık Toplantı",
    meetingDate: null,
    attendees: ["Ayşe Kaya", "Mehmet Yılmaz"],
    summary: "Ekip bütçeyi görüştü.",
    highlights: [{ topic: "Bütçe", highlights: ["Ek bütçe talep edildi"] }],
    next_steps: null,
  });

  expect(result.isError).toBe(false);
  const email = JSON.parse(result.content[0].text);
  expect(email.subject).toBe("Haftalık Toplantı - Toplantı Özeti");
  expect(email.text).toContain("Ekip bütçeyi görüştü.");
  expect(email.html).toContain("Ek bütçe talep edildi");
  expect(email.html).toContain("Katılımcılar");
  expect(email.html).toContain("Mehmet Yılmaz");
  expect(email.text).toContain("Katılımcılar:\n- Ayşe Kaya\n- Mehmet Yılmaz");
});

test("rejects an unknown template", async () => {
  const result = await prepareEmailTool.handler({ template: "unknown" });

  expect(result.isError).toBe(true);
  expect(JSON.parse(result.content[0].text).error).toContain("Unknown template");
});
