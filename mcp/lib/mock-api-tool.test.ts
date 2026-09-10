import { afterEach, expect, test } from "bun:test";
import { tools as stripe } from "../servers/stripe/tools";
import { tools as fedex } from "../servers/fedex/tools";
const originalFetch = globalThis.fetch;
const oldStripe = process.env.STRIPE_API_URL,
  oldFedex = process.env.FEDEX_API_URL;
afterEach(() => {
  globalThis.fetch = originalFetch;
  for (const [key, value] of [
    ["STRIPE_API_URL", oldStripe],
    ["FEDEX_API_URL", oldFedex],
  ]) {
    if (value === undefined) delete process.env[key!];
    else process.env[key!] = value;
  }
});
function tool(name: string) {
  return [...stripe, ...fedex].find((t) => t.name === name)!;
}
function stub(payload: unknown = {}, status = 200) {
  const calls: { url: URL; init: RequestInit }[] = [];
  globalThis.fetch = (async (url: any, init: any) => {
    calls.push({ url: new URL(url), init });
    return Response.json(payload, { status });
  }) as unknown as typeof fetch;
  process.env.STRIPE_API_URL = "http://localhost:5204/";
  process.env.FEDEX_API_URL = "http://localhost:5205";
  return calls;
}
test("All 17 tools expose unique names, schemas and handlers", () => {
  const tools = [...stripe, ...fedex];
  expect(tools.length).toBe(17);
  expect(new Set(tools.map((t) => t.name)).size).toBe(17);
  for (const t of tools)
    for (const key of t.inputSchema.required)
      expect(t.inputSchema.properties[key]).toBeDefined();
});
test("Stripe forwards pagination and integer payment amounts", async () => {
  const calls = stub({ object: "list", data: [] });
  expect(
    (
      await tool("STRIPE:list_payment_intents").handler({
        limit: 2,
        customer: "cus_demo",
      })
    ).isError
  ).toBe(false);
  expect(calls[0].url.searchParams.get("limit")).toBe("2");
  expect(calls[0].url.pathname).toBe("/v1/payment_intents");
  await tool("STRIPE:create_payment_intent").handler({
    amount: 1000,
    currency: "usd",
    confirm: true,
  });
  expect(JSON.parse(String(calls[1].init.body))).toEqual({
    amount: 1000,
    currency: "usd",
    confirm: true,
  });
});
test("Validation blocks malformed and unknown arguments before fetch", async () => {
  const calls = stub();
  for (const args of [
    { amount: 1.5, currency: "usd" },
    { amount: -1, currency: "usd" },
    { amount: 100 },
    { amount: 100, currency: "usd", unexpected: true },
  ])
    expect(
      (await tool("STRIPE:create_payment_intent").handler(args)).isError
    ).toBe(true);
  expect(calls).toHaveLength(0);
});
test("FedEx maps flat inputs and defaults into requestedShipment", async () => {
  const calls = stub();
  const result = await tool("FEDEX:create_shipment").handler({
    sender_postal_code: "10001",
    sender_country_code: "US",
    recipient_postal_code: "94105",
    recipient_country_code: "US",
    weight: 2,
  });
  expect(result.isError).toBe(false);
  const body = JSON.parse(String(calls[0].init.body));
  expect(body.requestedShipment.recipients[0].address.postalCode).toBe("94105");
  expect(body.requestedShipment.requestedPackageLineItems[0].weight).toEqual({
    units: "KG",
    value: 2,
  });
  expect(calls[0].url.pathname).toBe("/ship/v1/shipments");
});
test("FedEx cancellation uses PUT and tracking numbers are mapped", async () => {
  const calls = stub();
  await tool("FEDEX:cancel_shipment").handler({ tracking_number: "123" });
  expect(calls[0].init.method).toBe("PUT");
  expect(JSON.parse(String(calls[0].init.body))).toEqual({
    trackingNumber: "123",
  });
  await tool("FEDEX:track_shipment").handler({ tracking_number: "123" });
  expect(
    JSON.parse(String(calls[1].init.body)).trackingInfo[0].trackingNumberInfo
      .trackingNumber
  ).toBe("123");
});
test("Preserves API errors and catches HTTP-200 tracking errors", async () => {
  stub({ error: { message: "Refund exceeds remaining amount" } }, 400);
  expect(
    (
      await tool("STRIPE:create_refund").handler({
        payment_intent: "pi_demo",
        amount: 999999,
      })
    ).isError
  ).toBe(true);
  stub({
    output: {
      completeTrackResults: [
        { trackResults: [{ error: { code: "NOT_FOUND" } }] },
      ],
    },
  });
  expect(
    (await tool("FEDEX:track_shipment").handler({ tracking_number: "missing" }))
      .isError
  ).toBe(true);
});
test("Missing config, network and non-JSON failures become MCP errors", async () => {
  delete process.env.STRIPE_API_URL;
  expect(
    (await tool("STRIPE:list_customers").handler({})).content[0].text
  ).toContain("STRIPE_API_URL");
  stub();
  globalThis.fetch = (async () => {
    throw new Error("network unavailable");
  }) as unknown as typeof fetch;
  expect((await tool("STRIPE:list_customers").handler({})).isError).toBe(true);
  globalThis.fetch = (async () =>
    new Response("<html>oops</html>", { status: 502 })) as unknown as typeof fetch;
  expect(
    (await tool("STRIPE:list_customers").handler({})).content[0].text
  ).toContain("non-JSON");
});
