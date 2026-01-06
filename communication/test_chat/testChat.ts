import { createSession } from "../api/createSession";
import express from "express";
import { getColleague } from "../api/getColleague";
import { sendMessageToSession } from "../api/sendMessageSession";

const router = express.Router();

router.use(express.json());

router.post("/", async (req, res) => {
  let stringResponse;

  try {
    const authorization = req.headers.authorization;

    let token = authorization?.split(" ")[1];

    if (!token) {
      return res
        .status(401)
        .json({ error: "Missing Authorization Bearer token" });
    }

    if (token !== "dcf0ac50d784ea9837ebf2e1a57d70d9") {
      return res
        .status(401)
        .json({ error: "Invalid Authorization Bearer token" });
    }

    const agentId = process.env.COLLEAGUE_ID;
    const decoded = { aud: process.env.PROJECT_ID };

    if (!agentId) {
      return res.status(400).json({ error: "Missing agentId" });
    }

    stringResponse = "Creating session...";

    const sessionData = await createSession(token, agentId);
    stringResponse = "Session created";

    stringResponse = "Getting colleague...";
    const colleague = await getColleague(token, agentId);
    stringResponse = "Colleague found";

    if (!colleague || colleague.teamId !== decoded?.aud) {
      return res
        .status(403)
        .json({ error: "Colleague not found or team ID mismatch" });
    }

    const content: string =
      (req.body?.content as string) || "Where is the parking lot?";

    stringResponse = "Sending message to session...";

    const messageResponse = await sendMessageToSession(
      sessionData.id,
      token,
      content
    );

    stringResponse = "Message sent";

    return res.status(200).json({
      status: "success",
      session: sessionData,
      colleague,
      stringResponse,
      message: messageResponse,
    });
  } catch (error: any) {
    return res
      .status(500)
      .json({ error: error?.message, message: stringResponse });
  }
});

export default router;
