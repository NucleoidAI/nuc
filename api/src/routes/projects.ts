import { Permission, Project } from "@canmingir/link-express/models";
import Joi from "joi";
import TeamDetails from "../models/TeamDetails";
import express from "express";
import schemas from "../schemas";

const router = express.Router();

router.post("/", async (req, res) => {
  const { userId, appId } = req.session;
  const project = Joi.attempt(req.body, schemas.Project) as {
    name: string;
    icon: string;
    description?: string | null;
    type?: string | null;
    organizationId?: string | null;
    coach?: string | null;
  };

  const projectInstance = await Project.create(project);

  if (!projectInstance.organizationId) {
    return res.status(400).json({ error: "Organization ID is required" });
  }

  await Permission.create({
    userId,
    organizationId: projectInstance.organizationId,
    role: "OWNER",
    projectId: projectInstance.id,
    appId,
  });

  await TeamDetails.create({
    id: projectInstance.id,
    coach: "Marcus Aurelius",
    coachAvatar: ":12:",
  });

  await res.status(201).json(projectInstance);
});

export default router;
