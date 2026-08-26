import {
  COMPLIANCE_AGENT_ID,
  COMPLIANCE_BLUEPRINT_ID,
  ORDER_AGENT_ID,
  ORDER_BLUEPRINT_ID,
  SESSION,
} from "./fixtures/ids";
import {
  certificateOf,
  purchaseOrdersFor,
  resetOrderDb,
} from "./harness/orderDb";
import type {
  StepAdded,
  StepSettled,
  StepSupervisedNeeded,
  SupervisingAnswered,
  SupervisingRaised,
  TaskCompleted,
  TaskCreated,
} from "./harness/eventTypes";
import { event } from "./harness/event";
import {
  blueprintNodes,
  insertKnowledge,
  knowledgeFor,
  updateBlueprintNodes,
} from "./harness/db";
import { startStack, type Stack } from "./harness/stack";
import { supervisedHandoffNodes } from "./fixtures/supervisedBlueprint";

const SCENARIO_TIMEOUT_MS = 600_000;

type AiAssistantMessaged = {
  sessionId: string;
  content: string;
  blueprintId?: string;
};

let stack: Stack;
let scenarioEvents: {
  aiAssistantMessaged: Promise<AiAssistantMessaged>;
  stepAdded: Promise<StepAdded>;
  stepWaitingForUser: Promise<StepSettled>;
  stepCompleted: Promise<StepSettled>;
  supervisingRaised: Promise<SupervisingRaised>;
  taskCreated: Promise<TaskCreated>;
  taskCompleted: Promise<TaskCompleted>;
  stepSupervisedNeeded: Promise<StepSupervisedNeeded>;
  supervisingAnswered: Promise<SupervisingAnswered>;
};

describe("Order & Compliance Team — blueprint to task, end to end", () => {
  beforeAll(async () => {
    resetOrderDb();
    stack = await startStack();
  }, 180_000);

  afterAll(async () => {
    await stack?.stop();
    resetOrderDb();
  });

  beforeEach(() => {
    stack.smtp.reset();

    scenarioEvents = {
      aiAssistantMessaged: event.subscribe<AiAssistantMessaged>(
        "AI_ASSISTANT_MESSAGED",
      ),
      stepAdded: event.subscribe<StepAdded>("STEP_ADDED"),
      stepWaitingForUser: event.subscribe<StepSettled>("STEP_WAITING_FOR_USER"),
      stepCompleted: event.subscribe<StepSettled>("STEP_COMPLETED"),
      supervisingRaised:
        event.subscribe<SupervisingRaised>("SUPERVISING_RAISED"),
      stepSupervisedNeeded: event.subscribe<StepSupervisedNeeded>(
        "STEP_SUPERVISED_NEEDED",
      ),
      taskCreated: event.subscribe<TaskCreated>("TASK_CREATED"),
      taskCompleted: event.subscribe<TaskCompleted>("TASK_COMPLETED"),
      supervisingAnswered: event.subscribe<SupervisingAnswered>(
        "SUPERVISING_ANSWERED",
      ),
    };
  });

  it(
    "happy path: an order for a certified product runs the blueprint to completion",
    async () => {
      const purchaseOrdersBefore = purchaseOrdersFor("prd-1").length;

      await event.publish("SESSION_USER_MESSAGED", {
        agentId: ORDER_AGENT_ID,
        sessionId: SESSION.happyPath,
        content: JSON.stringify({ intent: "create_order" }),
      });

      const taskCreated = await scenarioEvents.taskCreated;
      const stepAdded = await scenarioEvents.stepAdded;

      expect(taskCreated.blueprintId).toBe(ORDER_BLUEPRINT_ID);
      expect(stepAdded.action).toBe("PLATFORM:user_interaction");

      const waiting = await scenarioEvents.stepWaitingForUser;

      expect(waiting.stepId).toBe(stepAdded.stepId);

      await event.publish("SESSION_USER_MESSAGED", {
        agentId: ORDER_AGENT_ID,
        sessionId: SESSION.happyPath,
        content: JSON.stringify({ product: "product-1" }),
      });

      const taskCompleted = await scenarioEvents.taskCompleted;

      expect(taskCompleted.taskId).toBe(taskCreated.taskId);

      expect(certificateOf("prd-1")).toBe("FFC");
      expect(purchaseOrdersFor("prd-1")).toHaveLength(purchaseOrdersBefore + 1);
      expect(stack.smtp.emails.length).toBeGreaterThan(0);
    },
    SCENARIO_TIMEOUT_MS,
  );

  it(
    "supervised via knowledge: the supervisor teaches the certificate and the order goes through",
    async () => {
      const purchaseOrdersBefore = purchaseOrdersFor("prd-4").length;

      expect(certificateOf("prd-4")).toBeUndefined();

      await event.publish("SESSION_USER_MESSAGED", {
        agentId: ORDER_AGENT_ID,
        sessionId: SESSION.supervisedKnowledge,
        content: JSON.stringify({ intent: "create_order" }),
      });

      const taskCreated = await scenarioEvents.taskCreated;
      const stepAdded = await scenarioEvents.stepAdded;

      expect(taskCreated.blueprintId).toBe(ORDER_BLUEPRINT_ID);
      expect(stepAdded.action).toBe("PLATFORM:user_interaction");

      const waiting = await scenarioEvents.stepWaitingForUser;

      expect(waiting.stepId).toBe(stepAdded.stepId);

      await event.publish("SESSION_USER_MESSAGED", {
        agentId: ORDER_AGENT_ID,
        sessionId: SESSION.supervisedKnowledge,
        content: JSON.stringify({ product: "product-4" }),
      });

      const raised = await scenarioEvents.stepSupervisedNeeded;

      await insertKnowledge({
        type: "DATA",
        agentId: ORDER_AGENT_ID,
        text: '{"product_id": "prd-4", "product_name": "product-4", "certificate": "CE"}',
      });

      await event.publish("SUPERVISING_ANSWERED", {
        sessionId: SESSION.supervisedKnowledge,
        agentId: ORDER_AGENT_ID,
        taskId: taskCreated.taskId,
        question: raised.question,
        type: "KNOWLEDGE",
        answer:
          '{"product_id": "prd-4", "product_name": "product-4", "certificate": "CE"}',
      });

      await scenarioEvents.supervisingAnswered;

      const knowledge = await knowledgeFor(ORDER_AGENT_ID);

      expect(
        knowledge.map((entry) => String(entry.text ?? "")).join("\n"),
      ).toContain("prd-4");

      const taskCompleted = await scenarioEvents.taskCompleted;

      expect(taskCompleted.taskId).toBe(taskCreated.taskId);

      expect(certificateOf("prd-4")).toBe("CE");
      expect(purchaseOrdersFor("prd-4")).toHaveLength(purchaseOrdersBefore + 1);
    },
    SCENARIO_TIMEOUT_MS,
  );

  it.only(
    "supervised via blueprint: the supervisor adds a handoff and the compliance manager takes over",
    async () => {
      const orderNodesBefore = await blueprintNodes(ORDER_BLUEPRINT_ID);

      expect(certificateOf("prd-3")).toBeUndefined();

      try {
        await event.publish("SESSION_USER_MESSAGED", {
          agentId: ORDER_AGENT_ID,
          sessionId: SESSION.supervisedBlueprint,
          content: JSON.stringify({ intent: "create_order" }),
        });

        const taskCreated = await scenarioEvents.taskCreated;
        const stepAdded = await scenarioEvents.stepAdded;

        expect(taskCreated.blueprintId).toBe(ORDER_BLUEPRINT_ID);
        expect(stepAdded.action).toBe("PLATFORM:user_interaction");

        const elsewhere = (payload: { taskId?: string }) =>
          payload.taskId !== taskCreated.taskId;

        const handoffTaskCreated = event.waitFor<TaskCreated>(
          "TASK_CREATED",
          (payload) =>
            payload.agentId === COMPLIANCE_AGENT_ID &&
            payload.sessionId === SESSION.supervisedBlueprint,
        );
        const vendorLookup = event.waitFor<StepAdded>(
          "STEP_ADDED",
          (payload) =>
            elsewhere(payload) && payload.action === "ORDER:get_product_vendor",
        );
        const vendorEmail = event.waitFor<StepAdded>(
          "STEP_ADDED",
          (payload) =>
            elsewhere(payload) && payload.action === "GREY:send_email",
        );
        const handoffCompleted = event.waitFor<TaskCompleted>(
          "TASK_COMPLETED",
          elsewhere,
        );

        const waiting = await scenarioEvents.stepWaitingForUser;

        expect(waiting.stepId).toBe(stepAdded.stepId);

        await event.publish("SESSION_USER_MESSAGED", {
          agentId: ORDER_AGENT_ID,
          sessionId: SESSION.supervisedBlueprint,
          content: JSON.stringify({ product: "product-3" }),
        });

        const raised = await scenarioEvents.stepSupervisedNeeded;

        await updateBlueprintNodes({
          blueprintId: ORDER_BLUEPRINT_ID,
          title: "Order and Compliance",
          description:
            "Find product, check its compliance certificate, and either create the purchase order or hand the product over to the compliance manager.",
          nodes: supervisedHandoffNodes(),
        });

        await event.publish("SUPERVISING_ANSWERED", {
          sessionId: SESSION.supervisedBlueprint,
          agentId: ORDER_AGENT_ID,
          taskId: taskCreated.taskId,
          question: raised.question,
          type: "BLUEPRINT",
          answer:
            "I added a handoff to the compliance manager. When a product has no certificate on file, hand the task over to the compliant_manager agent so it can request the certificate from the vendor.",
        });

        await scenarioEvents.supervisingAnswered;

        const handedOff = await handoffTaskCreated;

        expect(handedOff.blueprintId).toBe(COMPLIANCE_BLUEPRINT_ID);
        expect(handedOff.taskId).not.toBe(taskCreated.taskId);

        const taskCompleted = await scenarioEvents.taskCompleted;

        expect(taskCompleted.taskId).toBe(taskCreated.taskId);
        expect(String(taskCompleted.result)).toContain(COMPLIANCE_AGENT_ID);

        expect((await vendorLookup).taskId).toBe(handedOff.taskId);
        expect((await vendorEmail).taskId).toBe(handedOff.taskId);
        expect((await handoffCompleted).taskId).toBe(handedOff.taskId);

        expect(stack.smtp.matching("gamma@vendor.com").length).toBeGreaterThan(
          0,
        );

        // No certificate was invented for an uncertified product.
        expect(certificateOf("prd-3")).toBeUndefined();
      } finally {
        await updateBlueprintNodes({
          blueprintId: ORDER_BLUEPRINT_ID,
          nodes: orderNodesBefore,
        });
      }
    },
    SCENARIO_TIMEOUT_MS,
  );
});
