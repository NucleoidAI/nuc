import {
  COMPLIANCE_AGENT_ID,
  COMPLIANCE_BLUEPRINT_ID,
  ORDER_AGENT_ID,
  ORDER_BLUEPRINT_ID,
  SESSION,
} from "./fixtures/ids";
import event from "./mocks/events";

import { mcp } from "./mocks/mcp";
import supertest from "supertest";
import { supervisedHandoffNodes } from "./fixtures/supervisedBlueprint";

describe("Order Agent", () => {
  afterEach(event.releaseAll);

  it("completes an order when the product is certified", async () => {
    mcp.tool("ORDER:find_product").returns({
      product: { id: "prd-1", name: "product-1", vendor_id: "vnd-1" },
    });

    mcp
      .tool("ORDER:assign_certificate")
      .expects({ product_id: "prd-1", certificate: "FFC" })
      .returns({ product_id: "prd-1", certificate: "FFC", assigned: true });

    mcp
      .tool("ORDER:create_po")
      .expects({ product_id: "prd-1" })
      .returns({
        purchase_order: {
          order_id: "po-2001",
          product_id: "prd-1",
          city: "Atlanta",
          quantity: 5,
        },
      });

    mcp
      .tool("GREY:send_email")
      .expects({})
      .returns({ success: true, messageId: "<e2e-1@greycollar.test>" });

    await event.publish("SESSION_USER_MESSAGED", {
      agentId: ORDER_AGENT_ID,
      sessionId: SESSION.happyPath,
      content: JSON.stringify({ intent: "create_order" }),
    });

    const created = await event.waitFor("TASK_CREATED");
    const added = await event.waitFor("STEP_ADDED");

    expect(created.blueprintId).toBe(ORDER_BLUEPRINT_ID);
    expect(added.action).toBe("PLATFORM:user_interaction");

    const waitingStep = await event.waitFor("STEP_WAITING_FOR_USER");
    expect(waitingStep.stepId).toBe(added.stepId);

    await event.publish("SESSION_USER_MESSAGED", {
      agentId: ORDER_AGENT_ID,
      sessionId: SESSION.happyPath,
      content: JSON.stringify({ product: "product-1" }),
    });

    const completedTask = await event.waitFor("TASK_COMPLETED");
    expect(completedTask.taskId).toBe(created.taskId);

    expect(mcp.tool("ORDER:create_po").lastCall).toMatchObject({
      product_id: "prd-1",
    });
  }, 600_000);

  it("completes an order after the supervisor provides the missing certificate knowledge", async () => {
    mcp.tool("ORDER:find_product").returns({
      product: { id: "prd-4", name: "product-4", vendor_id: "vnd-1" },
    });

    mcp
      .tool("ORDER:assign_certificate")
      .expects({ product_id: "prd-4", certificate: "CE" })
      .returns({ product_id: "prd-4", certificate: "CE", assigned: true });

    mcp
      .tool("ORDER:create_po")
      .expects({ product_id: "prd-4" })
      .returns({
        purchase_order: {
          order_id: "po-2002",
          product_id: "prd-4",
          city: "Atlanta",
          quantity: 5,
        },
      });

    mcp
      .tool("GREY:send_email")
      .returns({ success: true, messageId: "<e2e-2@greycollar.test>" });

    expect(mcp.tool("ORDER:assign_certificate").calls).toHaveLength(0);

    await event.publish("SESSION_USER_MESSAGED", {
      agentId: ORDER_AGENT_ID,
      sessionId: SESSION.supervisedKnowledge,
      content: JSON.stringify({ intent: "create_order" }),
    });

    const created = await event.waitFor("TASK_CREATED");
    const added = await event.waitFor("STEP_ADDED");

    expect(created.blueprintId).toBe(ORDER_BLUEPRINT_ID);
    expect(added.action).toBe("PLATFORM:user_interaction");

    const waitingStep = await event.waitFor("STEP_WAITING_FOR_USER");
    expect(waitingStep.stepId).toBe(added.stepId);

    await event.publish("SESSION_USER_MESSAGED", {
      agentId: ORDER_AGENT_ID,
      sessionId: SESSION.supervisedKnowledge,
      content: JSON.stringify({ product: "product-4" }),
    });

    const raised = await event.waitFor("STEP_SUPERVISED_NEEDED");

    await supertest(app)
      .post("/knowledge")
      .send({
        type: "DATA",
        agentId: ORDER_AGENT_ID,
        text: '{"product_id": "prd-4", "product_name": "product-4", "certificate": "CE"}',
      })
      .expect(201);

    await event.publish("SUPERVISING_ANSWERED", {
      sessionId: SESSION.supervisedKnowledge,
      agentId: ORDER_AGENT_ID,
      taskId: created.taskId,
      question: raised.question,
      type: "KNOWLEDGE",
      answer:
        '{"product_id": "prd-4", "product_name": "product-4", "certificate": "CE"}',
    });

    await event.waitFor("SUPERVISING_ANSWERED");

    const knowledge = await supertest(app)
      .get("/knowledge")
      .query({ agentId: ORDER_AGENT_ID })
      .expect(200);

    expect(
      knowledge.body
        .map((entry: { text: string | null }) => entry.text)
        .join("\n"),
    ).toContain("prd-4");

    const completedTask = await event.waitFor("TASK_COMPLETED");
    expect(completedTask.taskId).toBe(created.taskId);

    expect(mcp.tool("ORDER:assign_certificate").lastCall).toMatchObject({
      product_id: "prd-4",
      certificate: "CE",
    });
  }, 600_000);

  it("hands the order over to the compliance manager agent when the supervisor adds a handoff", async () => {
    mcp.tool("ORDER:find_product").returns({
      product: { id: "prd-3", name: "product-3", vendor_id: "vnd-3" },
    });

    mcp
      .tool("ORDER:get_product_vendor")
      .expects({ product_id: "prd-3" })
      .returns({
        vendor: {
          id: "vnd-3",
          name: "Vendor Gamma",
          email: "gamma@vendor.com",
        },
      });

    mcp
      .tool("GREY:send_email")
      .expects({ to: expect.stringContaining("gamma@vendor.com") })
      .returns({ success: true, messageId: "<e2e-3@greycollar.test>" });

    mcp.tool("ORDER:assign_certificate").expectsNoCalls();

    const { body: orderBlueprint } = await supertest(app)
      .get(`/blueprints/${ORDER_BLUEPRINT_ID}`)
      .expect(200);

    try {
      await event.publish("SESSION_USER_MESSAGED", {
        agentId: ORDER_AGENT_ID,
        sessionId: SESSION.supervisedBlueprint,
        content: JSON.stringify({ intent: "create_order" }),
      });

      const created = await event.waitFor("TASK_CREATED");
      const added = await event.waitFor("STEP_ADDED");

      expect(created.blueprintId).toBe(ORDER_BLUEPRINT_ID);
      expect(added.action).toBe("PLATFORM:user_interaction");

      const elsewhere = (payload: { taskId?: string }) =>
        payload.taskId !== created.taskId;

      const waitingStep = await event.waitFor("STEP_WAITING_FOR_USER");
      expect(waitingStep.stepId).toBe(added.stepId);

      await event.publish("SESSION_USER_MESSAGED", {
        agentId: ORDER_AGENT_ID,
        sessionId: SESSION.supervisedBlueprint,
        content: JSON.stringify({ product: "product-3" }),
      });

      const raised = await event.waitFor("STEP_SUPERVISED_NEEDED");

      await supertest(app)
        .put(`/blueprints/${ORDER_BLUEPRINT_ID}`)
        .send({
          title: "Order and Compliance",
          description:
            "Find product, check its compliance certificate, and either create the purchase order or hand the product over to the compliance manager.",
          agentId: orderBlueprint.agentId,
          nodes: supervisedHandoffNodes(),
        })
        .expect(200);

      await event.publish("SUPERVISING_ANSWERED", {
        sessionId: SESSION.supervisedBlueprint,
        agentId: ORDER_AGENT_ID,
        taskId: created.taskId,
        question: raised.question,
        type: "BLUEPRINT",
        answer:
          "I added a handoff to the compliance manager. When a product has no certificate on file, hand the task over to the compliant_manager agent so it can request the certificate from the vendor.",
      });

      await event.waitFor("SUPERVISING_ANSWERED");

      const handedOff = await event.waitFor(
        "TASK_CREATED",
        (payload) =>
          payload.agentId === COMPLIANCE_AGENT_ID &&
          payload.sessionId === SESSION.supervisedBlueprint,
      );

      expect(handedOff.blueprintId).toBe(COMPLIANCE_BLUEPRINT_ID);
      expect(handedOff.taskId).not.toBe(created.taskId);

      const completedTask = await event.waitFor("TASK_COMPLETED");
      expect(completedTask.taskId).toBe(created.taskId);
      expect(String(completedTask.result)).toContain(COMPLIANCE_AGENT_ID);

      const vendorLookup = await event.waitFor(
        "STEP_ADDED",
        (payload) =>
          elsewhere(payload) && payload.action === "ORDER:get_product_vendor",
      );
      const vendorEmail = await event.waitFor(
        "STEP_ADDED",
        (payload) => elsewhere(payload) && payload.action === "GREY:send_email",
      );

      expect(vendorLookup.taskId).toBe(handedOff.taskId);
      expect(vendorEmail.taskId).toBe(handedOff.taskId);
      const completedHandoffTask = await event.waitFor(
        "TASK_COMPLETED",
        elsewhere,
      );
      expect(completedHandoffTask.taskId).toBe(handedOff.taskId);

      expect(mcp.tool("GREY:send_email").lastCall).toMatchObject({
        to: expect.stringContaining("gamma@vendor.com"),
      });
    } finally {
      await supertest(app)
        .put(`/blueprints/${ORDER_BLUEPRINT_ID}`)
        .send({
          title: orderBlueprint.title,
          description: orderBlueprint.description,
          agentId: orderBlueprint.agentId,
          nodes: orderBlueprint.nodes ?? [],
        })
        .expect(200);
    }
  }, 600_000);
});
