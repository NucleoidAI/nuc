import { afterEach, beforeEach, expect, test } from "bun:test";
import { sendEmailEwsTool } from "./send_email_ews";

const config = {
  EWS_MOCK: "true",
  EWS_URL: "https://ews.test/EWS/Exchange.asmx",
  EWS_USER: "GREYTEST\\ews-test",
  EWS_PASS: "greycollar-ews-test-only",
  EWS_MAILBOX: "ews-test@example.test",
  // A mock must succeed without starting a worker. Real mode must report failure.
  EWS_NODE_BIN: "/nonexistent/ews-test-node",
};
let previous: Record<string, string | undefined>;
beforeEach(() => {
  previous = Object.fromEntries(Object.keys(config).map((key) => [key, process.env[key]]));
  Object.assign(process.env, config);
});
afterEach(() => {
  for (const [key, value] of Object.entries(previous)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

const args = { to: "recipient@example.test", subject: "Test", text: "Hello" };

test("mock prepares a template and attachments without starting the worker", async () => {
  const result = await sendEmailEwsTool.handler({
    to: args.to,
    template: "meeting_summary_a",
    data: {},
    attachments: [{ filename: "transcript.txt", content: "Meeting transcript" }],
  });
  expect(result.isError).toBe(false);
  expect(JSON.parse(result.content[0].text)).toMatchObject({
    success: true, mock: true, transport: "ews-mock",
    mailbox: config.EWS_MAILBOX, attachments: ["transcript.txt"],
  });
});

for (const key of ["EWS_URL", "EWS_USER", "EWS_PASS", "EWS_MAILBOX"]) {
  test(`mock rejects incorrect ${key}`, async () => {
    process.env[key] = "incorrect";
    expect((await sendEmailEwsTool.handler(args)).isError).toBe(true);
  });
  test(`mock rejects missing ${key}`, async () => {
    delete process.env[key];
    expect((await sendEmailEwsTool.handler(args)).isError).toBe(true);
  });
}

test("mock preserves message validation", async () => {
  for (const invalid of [{ ...args, to: "" }, { ...args, subject: "" }, { ...args, text: "" }, { ...args, template: "unknown" }]) {
    expect((await sendEmailEwsTool.handler(invalid)).isError).toBe(true);
  }
});

test("real worker failure does not fall back to mock success", async () => {
  delete process.env.EWS_MOCK;
  const result = await sendEmailEwsTool.handler(args);
  expect(result.isError).toBe(true);
  expect(JSON.parse(result.content[0].text).error).toContain("Cannot start EWS worker");
});
