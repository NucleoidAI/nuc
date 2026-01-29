import Agent from "../models/Agent";
import { Project } from "@canmingir/link-express/models";
import express from "express";
import platform from "@canmingir/link-express";
const router = express.Router();

router.get("/:id", async (req, res) => {
  const { organizationId } = req.session;
  const { id } = req.params;

  if (organizationId !== id) {
    return res.status(401).end();
  }

  const agents = await Project.findAll({
    where: { organizationId: id },
    include: [
      {
        model: Agent,
        as: "agents",
      },
    ],
  });

  if (!agents) {
    return res.status(404);
  }

  res.json(agents);
});

export default router;
