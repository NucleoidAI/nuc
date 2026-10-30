import Agent from "../models/Agent";
import Conversation from "../models/Conversation";
import Joi from "joi";
import Supervising from "../models/Supervising";
import express from "express";
import { Op, WhereOptions } from "sequelize";
import { event } from "@canmingir/link-express/event/client";
import schemas from "../schemas";
import supervising from "../functions/supervising";

const router = express.Router();

router.post("/", async (req, res) => {
  const teamId = req.session.projectId;

  const { sessionId, conversationId, agentId } = Joi.attempt(
    req.body,
    schemas.Supervising.create
  );

  const agent = await Agent.findByPk(agentId);

  if (!agent) {
    res.status(404);
  }

  if (agent.teamId !== teamId) {
    res.status(401);
  }

  const conversation = await Conversation.findByPk(conversationId);

  if (!conversation) {
    res.status(404);
  }

  const createdSupervising = await supervising.create({
    sessionId,
    conversationId,
    question: conversation.content,
    agentId,
  });

  res.status(201).json(createdSupervising);
});

router.get("/", async (req, res) => {
  const teamId = req.session.projectId;
  const { status, from, to } = Joi.attempt(req.query, schemas.Supervising.list);

  const whereClause: WhereOptions = {};
  if (status) {
    whereClause.status = status;
  }
  if (from && to) {
    whereClause.createdAt = { [Op.between]: [from, to] };
  }

  const supervisings = await Supervising.findAll({
    where: whereClause,
    include: [
      {
        model: Agent,
        where: { teamId },
        attributes: [],
      },
    ],
  });

  if (status && supervisings.length === 1) {
    const supervisingData = supervisings[0].dataValues;

    const formattedData = {
      ...supervisingData,
      createdAt: supervisingData.createdAt?.toISOString(),
    };
    event.publish("SUPERVISING_LOADED", formattedData);
  } else if (status && supervisings.length === 0) {
    event.publish("SUPERVISING_LOADED", null);
  } else {
    event.publish("SUPERVISING_LOADED", supervisings);
  }

  res.status(200).json(supervisings);
});

router.get("/agents", async (req, res) => {
  const teamId = req.session.projectId;
  const { status, from, to } = Joi.attempt(req.query, schemas.Supervising.list);

  const supervisings = await supervising.listWithAgents({
    teamId,
    status,
    from,
    to,
  });

  return res.status(200).json(supervisings);
});

router.get("/agents/:agentId", async (req, res) => {
  const teamId = req.session.projectId;
  const { agentId } = Joi.attempt(req.params, schemas.Supervising.agentParams);
  const { status, from, to } = Joi.attempt(req.query, schemas.Supervising.list);

  const agent = await Agent.findByPk(agentId);

  if (!agent) {
    return res.status(404).end();
  }

  if (agent.teamId !== teamId) {
    return res.status(401).end();
  }

  const supervisings = await supervising.listWithAgents({
    teamId,
    agentId,
    status,
    from,
    to,
  });

  return res.status(200).json(supervisings);
});

router.get("/:id", async (req, res) => {
  const { id } = req.params;
  const teamId = req.session.projectId;

  const validatedId = Joi.attempt(id, schemas.Supervising.id);

  const supervising = await Supervising.findOne({
    where: { id: validatedId },
    include: [
      {
        model: Agent,
        attributes: ["teamId"],
        required: true,
      },
    ],
  });

  if (!supervising) {
    res.status(404);
  }

  if (supervising.Agent.teamId !== teamId) {
    res.status(401);
  }

  const { dataValues } = supervising;

  if (dataValues.Agent) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { Agent, ...rest } = dataValues;
    res.status(200).json(rest);
    event.publish("SUPERVISING_LOADED", rest);
  } else {
    res.status(200).json(dataValues);
    event.publish("SUPERVISING_LOADED", dataValues);
  }
});

router.patch("/:supervisingId", async (req, res) => {
  const { supervisingId } = req.params;
  const teamId = req.session.projectId;

  const { answer, status } = Joi.attempt(req.body, schemas.Supervising.patch);

  const supervisingInstance = await Supervising.findByPk(supervisingId);

  if (!supervisingInstance) {
    return res.status(404).json({ error: "Supervising not found" });
  }

  const agent = await Agent.findByPk(supervisingInstance.agentId);

  if (!agent) {
    return res.status(404).json({ error: "Agent not found" });
  }

  if (agent.teamId !== teamId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const updatedSupervising = await supervising.update({
    teamId,
    supervisingId,
    agentId: agent.id,
    question: supervisingInstance.question,
    answer,
    status,
    taskId: supervisingInstance.taskId,
  });

  res.status(200).json(updatedSupervising);
});

router.patch("/:supervisingId/demo", async (req, res) => {
  const { answer } = Joi.attempt(req.body, schemas.Supervising.patch);

  let response;

  if (answer.includes("handoff")) {
    response = {
      id: "85a763a3-30cc-409f-881f-828e17c44c9e",
      title: "Order and Compliance",
      description:
        "This workflow manages the procurement process for a product requiring compliance certification. It begins by prompting the user to select a product, retrieves the product details, and checks whether a compliance certificate is already assigned. If a certificate exists, the system assigns one, then creates a purchase order and sends a confirmation email. If no certificate is found, the task is handed off to a dedicated compliance manager agent for further handling.",
      agentId: "9f156dc6-bf9b-4541-8d0c-6764cb0d6487",
      blocking: true,
      nodes: [
        {
          id: "ffe7081c-f922-4e30-9ac8-0fdf094913b2",
          properties: {
            label: "Select a Product",
            icon: "mdi:account-question",
            action: "PLATFORM:user_interaction",
            description: "Ask user to select a product",
          },
          type: "NORMAL",
          next: ["3b2bd895-1df4-4cb6-827c-35874f43615f"],
          createdAt: "2025-06-26T06:00:00Z",
        },
        {
          id: "3b2bd895-1df4-4cb6-827c-35874f43615f",
          properties: {
            label: "Find Product",
            icon: "mdi:magnify",
            action: "ORDER:find_product",
            description: "Search and retrieve the product details",
          },
          type: "NORMAL",
          next: ["b375d835-67bc-46f6-a2eb-825a8481e4b4"],
          createdAt: "2025-06-26T06:00:00Z",
        },
        {
          id: "b375d835-67bc-46f6-a2eb-825a8481e4b4",
          properties: {
            label: "Knowledge Lookup",
            icon: "mdi:book-search",
            action: "PLATFORM:knowledge_lookup",
            description:
              "Look up compliance certificate for the product from agent knowledge",
          },
          type: "NORMAL",
          next: ["83a2a833-57bc-41b0-8871-be0dd2866ac7"],
          createdAt: "2025-06-26T06:00:00Z",
        },
        {
          id: "3e8ba55f-ff37-41c3-befd-758e32df3f99",
          properties: {
            label: "Assign Certificate",
            icon: "mdi:certificate-outline",
            action: "ORDER:assign_certificate",
            description: "Assign a compliance certificate to the product",
          },
          type: "NORMAL",
          next: ["c1ab17de-50e4-4c58-8fdc-12058a7a35ec"],
          createdAt: "2025-06-26T06:00:00Z",
        },
        {
          id: "c1ab17de-50e4-4c58-8fdc-12058a7a35ec",
          properties: {
            label: "Create Purchase Order",
            icon: "mdi:file-document-plus",
            action: "ORDER:create_po",
            description: "Create a Purchase Order for the certified product",
          },
          type: "NORMAL",
          next: ["9cc14d43-419c-4d3c-90a1-42133caff37b"],
          createdAt: "2025-06-26T06:00:00Z",
        },
        {
          id: "9cc14d43-419c-4d3c-90a1-42133caff37b",
          properties: {
            label: "Send Email",
            icon: "mdi:email",
            action: "GREY:send_email",
            description:
              "Send email notification about the completed purchase order",
          },
          type: "NORMAL",
          next: null,
          createdAt: "2025-06-26T06:00:00Z",
        },
        {
          id: "83a2a833-57bc-41b0-8871-be0dd2866ac7",
          properties: {
            label: "If certificate exists",
            icon: "mdi:source-branch",
            action: "PLATFORM:decision",
            description:
              "A decision node that branches the flow based on conditions.",
          },
          type: "CONDITION",
          true: ["3e8ba55f-ff37-41c3-befd-758e32df3f99"],
          false: ["26ca02ed-92d9-49ce-b152-ca8536e92202"],
          createdAt: "2026-06-29T16:47:27.253Z",
        },
        {
          id: "26ca02ed-92d9-49ce-b152-ca8536e92202",
          properties: {
            label: "Handoff to compliant_manager_agent",
            icon: "mdi:account-arrow-right",
            action: "PLATFORM:handoff",
            description: "Transfer this task to another agent's blueprint.",
          },
          type: "HANDOFF",
          createdAt: "2026-06-29T16:47:50.254Z",
        },
      ],
      Nodes: [
        {
          id: "ffe7081c-f922-4e30-9ac8-0fdf094913b2",
          properties: {
            label: "Select a Product",
            icon: "mdi:account-question",
            action: "PLATFORM:user_interaction",
            description: "Ask user to select a product",
          },
          type: "NORMAL",
          next: ["3b2bd895-1df4-4cb6-827c-35874f43615f"],
          createdAt: "2025-06-26T06:00:00Z",
        },
        {
          id: "3b2bd895-1df4-4cb6-827c-35874f43615f",
          properties: {
            label: "Find Product",
            icon: "mdi:magnify",
            action: "ORDER:find_product",
            description: "Search and retrieve the product details",
          },
          type: "NORMAL",
          next: ["b375d835-67bc-46f6-a2eb-825a8481e4b4"],
          createdAt: "2025-06-26T06:00:00Z",
        },
        {
          id: "b375d835-67bc-46f6-a2eb-825a8481e4b4",
          properties: {
            label: "Knowledge Lookup",
            icon: "mdi:book-search",
            action: "PLATFORM:knowledge_lookup",
            description:
              "Look up compliance certificate for the product from agent knowledge",
          },
          type: "NORMAL",
          next: ["83a2a833-57bc-41b0-8871-be0dd2866ac7"],
          createdAt: "2025-06-26T06:00:00Z",
        },
        {
          id: "3e8ba55f-ff37-41c3-befd-758e32df3f99",
          properties: {
            label: "Assign Certificate",
            icon: "mdi:certificate-outline",
            action: "ORDER:assign_certificate",
            description: "Assign a compliance certificate to the product",
          },
          type: "NORMAL",
          next: ["c1ab17de-50e4-4c58-8fdc-12058a7a35ec"],
          createdAt: "2025-06-26T06:00:00Z",
        },
        {
          id: "c1ab17de-50e4-4c58-8fdc-12058a7a35ec",
          properties: {
            label: "Create Purchase Order",
            icon: "mdi:file-document-plus",
            action: "ORDER:create_po",
            description: "Create a Purchase Order for the certified product",
          },
          type: "NORMAL",
          next: ["9cc14d43-419c-4d3c-90a1-42133caff37b"],
          createdAt: "2025-06-26T06:00:00Z",
        },
        {
          id: "9cc14d43-419c-4d3c-90a1-42133caff37b",
          properties: {
            label: "Send Email",
            icon: "mdi:email",
            action: "GREY:send_email",
            description:
              "Send email notification about the completed purchase order",
          },
          type: "NORMAL",
          next: null,
          createdAt: "2025-06-26T06:00:00Z",
        },
        {
          id: "83a2a833-57bc-41b0-8871-be0dd2866ac7",
          properties: {
            label: "If certificate exists",
            icon: "mdi:source-branch",
            action: "PLATFORM:decision",
            description:
              "A decision node that branches the flow based on conditions.",
          },
          type: "CONDITION",
          true: ["3e8ba55f-ff37-41c3-befd-758e32df3f99"],
          false: ["26ca02ed-92d9-49ce-b152-ca8536e92202"],
          createdAt: "2026-06-29T16:47:27.253Z",
        },
        {
          id: "26ca02ed-92d9-49ce-b152-ca8536e92202",
          properties: {
            label: "Handoff to compliant_manager_agent",
            icon: "mdi:account-arrow-right",
            action: "PLATFORM:handoff",
            description: "Transfer this task to another agent's blueprint.",
          },
          type: "HANDOFF",
          createdAt: "2026-06-29T16:47:50.254Z",
        },
      ],
    };
  } else {
    response = {
      id: "b1c2d3e4-f5a6-4b1c-9001-200000000009",
      type: "DATA",
      text: '{"product_id": "DSC-760", "product_name": "Duplex Document Scanner", "certificate": "CE"}',
      status: "COMPLETED",
      createdAt: "2025-06-26T06:00:00.000Z",
    };
  }

  return res.status(200).json(response);
});

router.patch("/:supervisingId/demo/submit", async (req, res) => {
  const { supervisingId } = req.params;
  const teamId = req.session.projectId;

  const { answer, status } = Joi.attempt(req.body, schemas.Supervising.patch);

  const supervisingInstance = await Supervising.findByPk(supervisingId);

  if (!supervisingInstance) {
    return res.status(404).json({ error: "Supervising not found" });
  }

  const agent = await Agent.findByPk(supervisingInstance.agentId);

  if (!agent) {
    return res.status(404).json({ error: "Agent not found" });
  }

  if (agent.teamId !== teamId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const updatedSupervising = await supervising.update({
    teamId,
    supervisingId,
    agentId: agent.id,
    question: supervisingInstance.question,
    answer,
    status,
    taskId: supervisingInstance.taskId,
  });

  res.status(200).json(updatedSupervising);
});

export default router;
