import {
  COMPLIANCE_AGENT_ID,
  COMPLIANCE_BLUEPRINT_ID,
  ORDER_AGENT_ID,
  ORDER_BLUEPRINT_ID,
  SESSION,
} from "./fixtures/ids";
import { certificateOf, purchaseOrdersFor } from "./harness/mcp/servers/order";
import {
  emailsMatching,
  resetEmails,
  sentEmails,
} from "./harness/mcp/servers/grey";
import { resetMcpMocks } from "./harness/mcp/registry";
import events, { type Watched } from "./harness/events";
import api from "./harness/api";
import { startStack, type Stack } from "./harness/stack";
import { supervisedHandoffNodes } from "./fixtures/supervisedBlueprint";

const SCENARIO_TIMEOUT_MS = 600_000;

let stack: Stack;
let scenario: Watched;

describe("Order & Compliance Team — blueprint to task, end to end", () => {
  beforeAll(async () => {
    resetMcpMocks();
    stack = await startStack();
  }, 180_000);

  afterAll(async () => {
    await stack?.stop();
    resetMcpMocks();
  });

  afterEach(async () => {
    await events.release();
  });

  beforeEach(() => {
    resetEmails();

    scenario = events.watch();
  });

  it(
    "happy path: an order for a certified product runs the blueprint to completion",
    async () => {
      const purchaseOrdersBefore = purchaseOrdersFor("prd-1").length;

      await events.session.userMessaged({
        agentId: ORDER_AGENT_ID,
        sessionId: SESSION.happyPath,
        content: { intent: "create_order" },
      });

      const taskCreated = await scenario.taskCreated;
      const stepAdded = await scenario.stepAdded;

      expect(taskCreated.blueprintId).toBe(ORDER_BLUEPRINT_ID);
      expect(stepAdded.action).toBe("PLATFORM:user_interaction");

      const waiting = await scenario.stepWaitingForUser;

      expect(waiting.stepId).toBe(stepAdded.stepId);

      await events.session.userMessaged({
        agentId: ORDER_AGENT_ID,
        sessionId: SESSION.happyPath,
        content: { product: "product-1" },
      });

      const taskCompleted = await scenario.taskCompleted;

      expect(taskCompleted.taskId).toBe(taskCreated.taskId);

      expect(certificateOf("prd-1")).toBe("FFC");
      expect(purchaseOrdersFor("prd-1")).toHaveLength(purchaseOrdersBefore + 1);
      expect(sentEmails.length).toBeGreaterThan(0);
    },
    SCENARIO_TIMEOUT_MS
  );

  it(
    "supervised via knowledge: the supervisor teaches the certificate and the order goes through",
    async () => {
      const purchaseOrdersBefore = purchaseOrdersFor("prd-4").length;

      expect(certificateOf("prd-4")).toBeUndefined();

      await events.session.userMessaged({
        agentId: ORDER_AGENT_ID,
        sessionId: SESSION.supervisedKnowledge,
        content: { intent: "create_order" },
      });

      const taskCreated = await scenario.taskCreated;
      const stepAdded = await scenario.stepAdded;

      expect(taskCreated.blueprintId).toBe(ORDER_BLUEPRINT_ID);
      expect(stepAdded.action).toBe("PLATFORM:user_interaction");

      const waiting = await scenario.stepWaitingForUser;

      expect(waiting.stepId).toBe(stepAdded.stepId);

      await events.session.userMessaged({
        agentId: ORDER_AGENT_ID,
        sessionId: SESSION.supervisedKnowledge,
        content: { product: "product-4" },
      });

      const raised = await scenario.stepSupervisedNeeded;

      await api.knowledge.create({
        type: "DATA",
        agentId: ORDER_AGENT_ID,
        text: '{"product_id": "prd-4", "product_name": "product-4", "certificate": "CE"}',
      });

      await events.supervising.answered({
        sessionId: SESSION.supervisedKnowledge,
        agentId: ORDER_AGENT_ID,
        taskId: taskCreated.taskId,
        question: raised.question,
        type: "KNOWLEDGE",
        answer:
          '{"product_id": "prd-4", "product_name": "product-4", "certificate": "CE"}',
      });

      await scenario.supervisingAnswered;

      expect(await api.knowledge.textFor(ORDER_AGENT_ID)).toContain("prd-4");

      const taskCompleted = await scenario.taskCompleted;

      expect(taskCompleted.taskId).toBe(taskCreated.taskId);

      expect(certificateOf("prd-4")).toBe("CE");
      expect(purchaseOrdersFor("prd-4")).toHaveLength(purchaseOrdersBefore + 1);
    },
    SCENARIO_TIMEOUT_MS
  );

  it(
    "supervised via blueprint: the supervisor adds a handoff and the compliance manager takes over",
    async () => {
      const orderNodesBefore = await api.blueprints.nodes(ORDER_BLUEPRINT_ID);

      expect(certificateOf("prd-3")).toBeUndefined();

      try {
        await events.session.userMessaged({
          agentId: ORDER_AGENT_ID,
          sessionId: SESSION.supervisedBlueprint,
          content: { intent: "create_order" },
        });

        const taskCreated = await scenario.taskCreated;
        const stepAdded = await scenario.stepAdded;

        expect(taskCreated.blueprintId).toBe(ORDER_BLUEPRINT_ID);
        expect(stepAdded.action).toBe("PLATFORM:user_interaction");

        const elsewhere = (payload: { taskId?: string }) =>
          payload.taskId !== taskCreated.taskId;

        const handoffTaskCreated = events.waitFor(
          "TASK_CREATED",

          (payload) =>
            payload.agentId === COMPLIANCE_AGENT_ID &&
            payload.sessionId === SESSION.supervisedBlueprint
        );
        const vendorLookup = events.waitFor(
          "STEP_ADDED",

          (payload) =>
            elsewhere(payload) && payload.action === "ORDER:get_product_vendor"
        );
        const vendorEmail = events.waitFor(
          "STEP_ADDED",

          (payload) =>
            elsewhere(payload) && payload.action === "GREY:send_email"
        );
        const handoffCompleted = events.waitFor("TASK_COMPLETED", elsewhere);

        const waiting = await scenario.stepWaitingForUser;

        expect(waiting.stepId).toBe(stepAdded.stepId);

        await events.session.userMessaged({
          agentId: ORDER_AGENT_ID,
          sessionId: SESSION.supervisedBlueprint,
          content: { product: "product-3" },
        });

        const raised = await scenario.stepSupervisedNeeded;

        await api.blueprints.setNodes(
          ORDER_BLUEPRINT_ID,
          supervisedHandoffNodes(),
          {
            title: "Order and Compliance",
            description:
              "Find product, check its compliance certificate, and either create the purchase order or hand the product over to the compliance manager.",
          }
        );

        await events.supervising.answered({
          sessionId: SESSION.supervisedBlueprint,
          agentId: ORDER_AGENT_ID,
          taskId: taskCreated.taskId,
          question: raised.question,
          type: "BLUEPRINT",
          answer:
            "I added a handoff to the compliance manager. When a product has no certificate on file, hand the task over to the compliant_manager agent so it can request the certificate from the vendor.",
        });

        await scenario.supervisingAnswered;

        const handedOff = await handoffTaskCreated;

        expect(handedOff.blueprintId).toBe(COMPLIANCE_BLUEPRINT_ID);
        expect(handedOff.taskId).not.toBe(taskCreated.taskId);

        const taskCompleted = await scenario.taskCompleted;

        expect(taskCompleted.taskId).toBe(taskCreated.taskId);
        expect(String(taskCompleted.result)).toContain(COMPLIANCE_AGENT_ID);

        expect((await vendorLookup).taskId).toBe(handedOff.taskId);
        expect((await vendorEmail).taskId).toBe(handedOff.taskId);
        expect((await handoffCompleted).taskId).toBe(handedOff.taskId);

        expect(emailsMatching("gamma@vendor.com").length).toBeGreaterThan(0);

        expect(certificateOf("prd-3")).toBeUndefined();
      } finally {
        await api.blueprints.setNodes(ORDER_BLUEPRINT_ID, orderNodesBefore);
      }
    },
    SCENARIO_TIMEOUT_MS
  );
});
