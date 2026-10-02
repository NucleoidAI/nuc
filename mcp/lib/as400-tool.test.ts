import { afterEach, expect, test } from "bun:test";
import { tools as as400 } from "../servers/as400/tools";

const originalFetch = globalThis.fetch;
const oldUrl = process.env.AS400_API_URL;

afterEach(() => {
  globalThis.fetch = originalFetch;
  if (oldUrl === undefined) delete process.env.AS400_API_URL;
  else process.env.AS400_API_URL = oldUrl;
});

function tool(name: string) {
  return as400.find((candidate) => candidate.name === name)!;
}

function stub(payload: unknown = {}, status = 200) {
  const calls: { url: URL; init: RequestInit }[] = [];
  globalThis.fetch = (async (url: any, init: any) => {
    calls.push({ url: new URL(url), init });
    return Response.json(payload, { status });
  }) as unknown as typeof fetch;
  process.env.AS400_API_URL = "http://localhost:5207";
  return calls;
}

const body = (calls: { init: RequestInit }[]) =>
  JSON.parse(String(calls[0].init.body));

test("All 22 tools expose unique names, schemas and handlers", () => {
  expect(as400.length).toBe(22);
  expect(new Set(as400.map((t) => t.name)).size).toBe(22);
  for (const candidate of as400) {
    expect(candidate.name).toMatch(/^AS400:[a-z_]+$/);
    expect(candidate.description.length).toBeGreaterThan(0);
    for (const key of candidate.inputSchema.required)
      expect(candidate.inputSchema.properties[key]).toBeDefined();
  }
});

test("Record reads address the key field and upper case it", async () => {
  const calls = stub({ record: {} });
  expect(
    (await tool("AS400:get_policy").handler({ policy_id: "mtr-20260041" }))
      .isError,
  ).toBe(false);
  expect(calls[0].url.pathname).toBe("/api/files/POLMAST/records/MTR-20260041");
  expect(calls[0].init.method ?? "GET").toBe("GET");
});

test("find_policy builds a filtered statement over the contact logical file", async () => {
  const calls = stub({ rows: [] });
  await tool("AS400:find_policy").handler({
    mobile: "+44 7700 900118",
    status: "A",
  });
  expect(body(calls).sql).toBe(
    "SELECT * FROM LPOLCTC WHERE MOBILE LIKE '+44 7700 900118' AND POLSTS = 'A'",
  );
});

test("find_user escapes quotes and wildcards a partial name", async () => {
  const calls = stub({ rows: [] });
  await tool("AS400:find_user").handler({ name: "O'Kafor" });
  expect(body(calls).sql).toBe(
    "SELECT * FROM USRMAST WHERE USRNAM LIKE '%O''Kafor%'",
  );
});

test("A search tool with no argument fails without calling the API", async () => {
  const calls = stub({ rows: [] });
  const result = await tool("AS400:find_user").handler({});
  expect(result.isError).toBe(true);
  expect(calls.length).toBe(0);
});

test("update_policy patches only the fields that were given", async () => {
  const calls = stub({ status: "updated" });
  await tool("AS400:update_policy").handler({
    policy_id: "MTR-20260041",
    status: "L",
    postcode: "WC2B 6LH",
  });
  expect(calls[0].init.method).toBe("PATCH");
  expect(body(calls)).toEqual({ POLSTS: "L", PSTCDE: "WC2B 6LH" });
});

test("update_policy_phone patches only the telephone fields and returns them", async () => {
  const calls = stub({
    status: "updated",
    recordsAffected: 1,
    record: {
      POLID: "MTR-20260041",
      PHONE: "+44 20 7946 0999",
      MOBILE: "+44 7700 900118",
      PSTCDE: "WC2B 6LH",
    },
  });
  const result = await tool("AS400:update_policy_phone").handler({
    policy_id: "MTR-20260041",
    phone: "+44 20 7946 0999",
  });
  expect(calls[0].init.method).toBe("PATCH");
  expect(calls[0].url.pathname).toBe("/api/files/POLMAST/records/MTR-20260041");
  expect(body(calls)).toEqual({ PHONE: "+44 20 7946 0999" });
  expect(JSON.parse(result.content[0].text)).toEqual({
    status: "updated",
    policy_id: "MTR-20260041",
    phone: "+44 20 7946 0999",
    mobile: "+44 7700 900118",
  });
});

test("update_policy_phone rejects address fields", async () => {
  const calls = stub();
  const result = await tool("AS400:update_policy_phone").handler({
    policy_id: "MTR-20260041",
    postcode: "WC2B 6LH",
  });
  expect(result.isError).toBe(true);
  expect(calls.length).toBe(0);
});

test("update_policy_address patches only the address fields and returns them", async () => {
  const calls = stub({
    status: "updated",
    recordsAffected: 1,
    record: {
      POLID: "MTR-20260041",
      ADDR1: "1 High Street",
      ADDR2: null,
      CITY: "Leeds",
      COUNTY: "West Yorkshire",
      PSTCDE: "LS1 1AA",
      PHONE: "+44 20 7946 0112",
    },
  });
  const result = await tool("AS400:update_policy_address").handler({
    policy_id: "MTR-20260041",
    address_1: "1 High Street",
    city: "Leeds",
    county: "West Yorkshire",
    postcode: "LS1 1AA",
  });
  expect(body(calls)).toEqual({
    ADDR1: "1 High Street",
    CITY: "Leeds",
    COUNTY: "West Yorkshire",
    PSTCDE: "LS1 1AA",
  });
  expect(JSON.parse(result.content[0].text)).toEqual({
    status: "updated",
    policy_id: "MTR-20260041",
    address_1: "1 High Street",
    address_2: null,
    city: "Leeds",
    county: "West Yorkshire",
    postcode: "LS1 1AA",
  });
});

test("update_policy_address rejects telephone fields", async () => {
  const calls = stub();
  const result = await tool("AS400:update_policy_address").handler({
    policy_id: "MTR-20260041",
    phone: "+44 20 7946 0999",
  });
  expect(result.isError).toBe(true);
  expect(calls.length).toBe(0);
});

test("update_user without a changed field fails without calling the API", async () => {
  const calls = stub();
  expect(
    (await tool("AS400:update_user").handler({ user_id: "MELLIS" })).isError,
  ).toBe(true);
  expect(calls.length).toBe(0);
});

test("list_records routes logical files to the logicals endpoint", async () => {
  const calls = stub({ records: [] });
  await tool("AS400:list_records").handler({ file: "lpolctc" });
  expect(calls[0].url.pathname).toBe("/api/logicals/LPOLCTC");
  await tool("AS400:list_records").handler({ file: "polmast" });
  expect(calls[1].url.pathname).toBe("/api/files/POLMAST/records");
});

test("describe_file asks the green screen for the field descriptions", async () => {
  const calls = stub({ ok: true });
  await tool("AS400:describe_file").handler({ file: "usrmast" });
  expect(calls[0].url.pathname).toBe("/api/cl");
  expect(body(calls).command).toBe("DSPFFD FILE(USRMAST)");
});

test("reply_to_message answers the inquiry on the operator queue", async () => {
  const calls = stub({ status: "replied" });
  await tool("AS400:reply_to_message").handler({
    message_id: "m0003",
    reply: "G",
  });
  expect(calls[0].url.pathname).toBe("/api/messages/M0003/reply");
  expect(body(calls)).toEqual({ reply: "G" });
});

test("An enum argument outside the list is rejected", async () => {
  const calls = stub();
  const result = await tool("AS400:find_policy").handler({
    policy_type: "BOAT",
  });
  expect(result.isError).toBe(true);
  expect(calls.length).toBe(0);
});

test("A mock error response is surfaced as an MCP error", async () => {
  stub(
    { error: "SQL0803 - Duplicate key value specified for file POLMAST." },
    409,
  );
  const result = await tool("AS400:create_policy").handler({
    policy_id: "MTR-20260041",
    user_id: "MELLIS",
    policy_type: "MOTOR",
    status: "A",
    start_date: "2026-01-01",
    renewal_date: "2027-01-01",
    premium: 10,
    payment_frequency: "M",
    currency: "GBP",
    address_1: "12 Kingsway",
    city: "London",
    postcode: "WC2B 6LH",
  });
  expect(result.isError).toBe(true);
  expect(result.content[0].text).toContain("SQL0803");
});

test("AS400_API_URL must be configured", async () => {
  delete process.env.AS400_API_URL;
  const result = await tool("AS400:list_files").handler({});
  expect(result.isError).toBe(true);
  expect(result.content[0].text).toContain("AS400_API_URL");
});
