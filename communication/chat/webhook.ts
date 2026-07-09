import express from "express";
import jwt from "jsonwebtoken";
import { createSession } from "../api/createSession";
import { getBlueprint } from "../api/getBlueprint";
import { sendMessageToSession } from "../api/sendMessageSession";

const router = express.Router();

router.use(express.json());

const createServiceToken = (projectId: string): string => {
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) throw new Error("JWT_SECRET environment variable is required");

  return jwt.sign(
    { iss: "webhook", aud: projectId },
    jwtSecret,
    { expiresIn: "12h" },
  );
};

router.post("/:projectId/:blueprintId", async (req, res) => {
  try {
    const { projectId, blueprintId } = req.params;
    const variables = req.body;

    const token = createServiceToken(projectId);

    const blueprint = await getBlueprint(token, blueprintId);
    const { agentId } = blueprint;

    const session = await createSession(token, agentId, blueprintId, variables);

    await sendMessageToSession(session.id, token, JSON.stringify(variables));

    return res.status(201).json({ sessionId: session.id });
  } catch (error: any) {
    return res.status(500).json({ error: error?.message });
  }
});

export default router;
