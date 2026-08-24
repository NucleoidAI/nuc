import { describe, it, beforeAll, afterAll } from "bun:test";
import assert from "assert";

import {
  COMPLIANCE_AGENT_ID,
  COMPLIANCE_BLUEPRINT_ID,
  ORDER_AGENT_ID,
  ORDER_BLUEPRINT_ID,
} from "./fixtures/ids";
import {
  certificateOf,
  purchaseOrdersFor,
  resetOrderDb,
} from "./harness/orderDb";
import {
  driveTask,
  listTasks,
  startSession,
  stepActions,
} from "./harness/drive";
import { startStack, type Stack } from "./harness/stack";
import { supervisedHandoffNodes } from "./fixtures/supervisedBlueprint";
import { waitFor } from "./harness/wait";

const SCENARIO_TIMEOUT_MS = 600_000;

let stack: Stack;

/** Waits for the task the agent creates out of a blueprint for this session. */
async function waitForTask(agentId: string, sessionId: string) {
  return await waitFor(
    async () =>
      (
        await listTasks(stack, agentId)
      ).find((task) => task.sessionId === sessionId),
    {
      timeoutMs: 180_000,
      description: `a task to be created from a blueprint for session ${sessionId}`,
    }
  );
}

/** Answers a supervision the way the dashboard's supervising drawer does. */
async function answerSupervising(
  supervisingId: string,
  answer: string,
  knowledge?: { agentId: string; text: string }
) {
  if (knowledge) {
    await stack.client.post("/knowledge", {
      type: "DATA",
      agentId: knowledge.agentId,
      text: knowledge.text,
    });
  }

  await stack.client.patch(`/supervisings/${supervisingId}`, {
    answer,
    status: "ANSWERED",
  });
}

describe("Order & Compliance Team — blueprint to task, end to end", () => {
  beforeAll(async () => {
    resetOrderDb();
    stack = await startStack();

    // Both agents ship with a policy in their seeded knowledge — never invent
    // a compliance certificate, never invent a vendor address (see
    // api/src/seeds/Knowledge.json). Without those the scenarios below would
    // be testing the model's guessing habits rather than the platform's
    // supervision and handoff.
  }, 180_000);

  afterAll(async () => {
    await stack?.stop();
    // The ORDER MCP server keeps its data in a tracked file; leave it as the
    // repository has it rather than with this run's purchase orders in it.
    resetOrderDb();
  });

  it(
    "happy path: an order for a certified product runs the blueprint to completion",
    async () => {
      stack.smtp.reset();

      const purchaseOrdersBefore = purchaseOrdersFor("prd-1").length;

      const sessionId = await startSession(
        stack,
        ORDER_AGENT_ID,
        "I would like to place an order for product-1."
      );

      const task = await waitForTask(ORDER_AGENT_ID, sessionId);

      assert.strictEqual(
        task.blueprintId,
        ORDER_BLUEPRINT_ID,
        "the agent should have picked the Order and Compliance blueprint"
      );

      const settled = await driveTask({
        stack,
        taskId: task.id,
        agentId: ORDER_AGENT_ID,
        sessionId,
        userAnswers: ["product-1"],
        timeoutMs: SCENARIO_TIMEOUT_MS - 60_000,
      });

      assert.strictEqual(
        settled.status,
        "COMPLETED",
        `task ended ${settled.status}: ${settled.comment}`
      );

      const actions = await stepActions(stack, task.id);

      assert.ok(
        actions.includes("ORDER:find_product"),
        `expected the product lookup to run, got ${actions.join(", ")}`
      );
      assert.ok(
        actions.includes("ORDER:create_po"),
        `expected a purchase order to be created, got ${actions.join(", ")}`
      );
      assert.ok(
        !actions.includes("PLATFORM:ask_supervisor"),
        "the certificate was known, so no supervision should have been raised"
      );

      // The certificate was already known, so it survives the run unchanged
      // and the purchase order lands in the ORDER system.
      assert.strictEqual(certificateOf("prd-1"), "FFC");
      assert.strictEqual(
        purchaseOrdersFor("prd-1").length,
        purchaseOrdersBefore + 1,
        "exactly one purchase order should have been placed for prd-1"
      );
      assert.ok(
        stack.smtp.emails.length > 0,
        "a confirmation email should have been sent"
      );
    },
    SCENARIO_TIMEOUT_MS
  );

  it(
    "supervised via knowledge: the supervisor teaches the certificate and the order goes through",
    async () => {
      stack.smtp.reset();

      const purchaseOrdersBefore = purchaseOrdersFor("prd-4").length;

      assert.strictEqual(
        certificateOf("prd-4"),
        undefined,
        "prd-4 must start out without a certificate"
      );

      const sessionId = await startSession(
        stack,
        ORDER_AGENT_ID,
        "I would like to place an order for product-4."
      );

      const task = await waitForTask(ORDER_AGENT_ID, sessionId);

      assert.strictEqual(task.blueprintId, ORDER_BLUEPRINT_ID);

      let supervisionQuestion: string | null = null;

      const settled = await driveTask({
        stack,
        taskId: task.id,
        agentId: ORDER_AGENT_ID,
        sessionId,
        userAnswers: ["product-4"],
        timeoutMs: SCENARIO_TIMEOUT_MS - 60_000,
        onSupervising: async (supervising) => {
          supervisionQuestion = supervising.question;

          // The supervisor answers with the missing fact and stores it as
          // agent knowledge, which is what unblocks the task.
          await answerSupervising(
            supervising.id,
            "The compliance certificate for product-4 (prd-4) is CE. " +
              "Assign certificate CE to prd-4 and continue with the purchase order.",
            {
              agentId: ORDER_AGENT_ID,
              text: '{"product_id": "prd-4", "product_name": "product-4", "certificate": "CE"}',
            }
          );
        },
      });

      assert.notStrictEqual(
        supervisionQuestion,
        null,
        "the agent should have asked the supervisor about the missing certificate"
      );
      assert.strictEqual(
        settled.status,
        "COMPLETED",
        `task ended ${settled.status}: ${settled.comment}`
      );

      const actions = await stepActions(stack, task.id);
      assert.ok(actions.includes("PLATFORM:ask_supervisor"));
      assert.ok(
        actions.includes("ORDER:assign_certificate"),
        `expected the taught certificate to be assigned, got ${actions.join(
          ", "
        )}`
      );

      // The supervisor's answer is now permanent agent knowledge.
      const learned = await stack.client.get<
        { type: string; text?: string | null }[]
      >(`/knowledge?agentId=${ORDER_AGENT_ID}`);
      assert.ok(
        learned.some((entry) => String(entry.text ?? "").includes("prd-4")),
        "the supervisor's answer should have been stored as agent knowledge, " +
          `agent knows: ${JSON.stringify(
            learned.map(
              (entry) => `${entry.type}:${String(entry.text).slice(0, 60)}`
            )
          )}`
      );

      // ...and the flow used it to certify the product and place the order.
      assert.strictEqual(certificateOf("prd-4"), "CE");
      assert.strictEqual(
        purchaseOrdersFor("prd-4").length,
        purchaseOrdersBefore + 1
      );
    },
    SCENARIO_TIMEOUT_MS
  );

  it(
    "supervised via blueprint: the supervisor adds a handoff and the compliance manager takes over",
    async () => {
      stack.smtp.reset();

      assert.strictEqual(
        certificateOf("prd-3"),
        undefined,
        "prd-3 must start out without a certificate"
      );

      const sessionId = await startSession(
        stack,
        ORDER_AGENT_ID,
        "I would like to place an order for product-3."
      );

      const task = await waitForTask(ORDER_AGENT_ID, sessionId);

      assert.strictEqual(task.blueprintId, ORDER_BLUEPRINT_ID);

      const settled = await driveTask({
        stack,
        taskId: task.id,
        agentId: ORDER_AGENT_ID,
        sessionId,
        userAnswers: ["product-3"],
        timeoutMs: SCENARIO_TIMEOUT_MS - 180_000,
        onSupervising: async (supervising) => {
          // Instead of answering with a fact, the supervisor reshapes the
          // blueprint: products without a certificate now branch off to the
          // compliance manager.
          await stack.client.put(`/blueprints/${ORDER_BLUEPRINT_ID}`, {
            title: "Order and Compliance",
            description:
              "Find product, check its compliance certificate, and either create the purchase order or hand the product over to the compliance manager.",
            agentId: ORDER_AGENT_ID,
            nodes: supervisedHandoffNodes(),
          });

          await answerSupervising(
            supervising.id,
            "I added a handoff to the compliance manager. When a product has no certificate on file, hand the task over to the compliant_manager agent so it can request the certificate from the vendor."
          );
        },
      });

      assert.strictEqual(
        settled.status,
        "COMPLETED",
        `task ended ${settled.status}: ${settled.comment}`
      );
      assert.ok(
        String(settled.result).includes(COMPLIANCE_AGENT_ID),
        `expected a handoff to the compliance manager, got "${settled.result}"`
      );

      const actions = await stepActions(stack, task.id);
      assert.ok(actions.includes("PLATFORM:ask_supervisor"));

      // The handoff created a task for the compliance manager on its own
      // blueprint, carrying the original steps as inherited context.
      const handedOff = await waitFor(
        async () =>
          (
            await listTasks(stack, COMPLIANCE_AGENT_ID)
          ).find((candidate) => candidate.sessionId === sessionId),
        {
          timeoutMs: 60_000,
          description: "a task handed off to the compliance manager",
        }
      );

      assert.strictEqual(handedOff.blueprintId, COMPLIANCE_BLUEPRINT_ID);
      assert.notStrictEqual(handedOff.id, task.id);

      const handoffSettled = await driveTask({
        stack,
        taskId: handedOff.id,
        agentId: COMPLIANCE_AGENT_ID,
        sessionId,
        timeoutMs: 240_000,
      });

      assert.strictEqual(
        handoffSettled.status,
        "COMPLETED",
        `handed-off task ended ${handoffSettled.status}: ${handoffSettled.comment}`
      );

      const handoffActions = await stepActions(stack, handedOff.id);
      assert.ok(
        handoffActions.includes("ORDER:get_product_vendor"),
        `expected the vendor lookup to run, got ${handoffActions.join(", ")}`
      );
      assert.ok(handoffActions.includes("GREY:send_email"));

      // product-3 belongs to Vendor Gamma, who is the one asked for the
      // certificate.
      assert.ok(
        stack.smtp.matching("gamma@vendor.com").length > 0,
        "the certificate request should have gone to the vendor the tool returned, " +
          `mails went to ${JSON.stringify(
            stack.smtp.emails.map((email) => email.to)
          )}`
      );

      // No certificate was invented for an uncertified product.
      assert.strictEqual(certificateOf("prd-3"), undefined);
    },
    SCENARIO_TIMEOUT_MS
  );
});
