import { Server } from "socket.io";
import { createSession } from "../api/createSession";
import dotenv from "dotenv";
import { event } from "@canmingir/link-express/event/client";
import { getAgent } from "../api/getAgent";
import jwt from "jsonwebtoken";
import { sendMessageToSession } from "../api/sendMessageSession";

const sockets = {};
dotenv.config();

export type Agent = {
  id: string;
  teamId: string;
  name: string;
};

export type Session = {
  id: string;
  agentId: string;
};

const setup = async (io: Server) => {
  io.on("connection", async (socket) => {
    try {
      const env = process.env.PROFILE;

      console.log("Environment:", env);
      console.log("New socket connection:", socket.id);

      let token;
      let agentId;
      let decoded;

      if (env !== "TEST") {
        token = socket.handshake.auth.token;
        agentId = socket.handshake.query.agentId as string;

        const jwtSecret = process.env.JWT_SECRET;

        if (!jwtSecret) {
          throw new Error("JWT_SECRET environment variable is required");
        }

        decoded = jwt.verify(token, jwtSecret);

        if (typeof decoded !== "object" || decoded === null) {
          throw new Error(
            "Invalid JWT payload: expected an object, got a string",
          );
        }
      } else {
        agentId = process.env.AGENT_ID;
        decoded = {
          aud: process.env.PROJECT_ID,
        };
      }

      console.log("Agent ID:", agentId);
      console.log("Token:", token);
      console.log("Decoded:", decoded);

      const session: Session = await createSession(token, agentId);
      const agent: Agent = await getAgent(token, agentId);

      console.log("Session:", session);
      console.log("Agent:", agent);

      if (!agent || agent.teamId !== decoded.aud) {
        console.log("Agent not found or team ID does not match");
        socket.disconnect();
        return;
      }

      socket.on("disconnect", () => {
        console.log("Disconnected from socket");
        delete sockets[session.id];
      });

      sockets[session.id] = socket.id;

      console.log("Sockets:", sockets);

      socket.on("customer_message", async ({ content }, callback) => {
        try {
          console.log("Customer message received:", content);
          await sendMessageToSession(session.id, token, content);

          callback({ status: "success" });
        } catch (error) {
          console.error("Error processing customer message:", error);
          const errorMessage =
            error instanceof Error ? error.message : "An error occurred";
          socket.emit("error_message", {
            message:
              errorMessage ||
              "Failed to process your message. Please try again.",
          });
          callback({
            status: "error",
            error: errorMessage,
          });
        }
      });
    } catch (err) {
      socket.disconnect();
      console.error(err);
    }
  });

  io.on("error", (err) => {
    console.error("Socket error:", err);
  });

  await event.subscribe<{ sessionId: string; content: string }>(
    "AI_ASSISTANT_MESSAGED",
    ({ sessionId, content }) => {
      console.log("subscribed AI_MESSAGED", sessionId, content);
      const socketId = sockets[sessionId];
      if (socketId) {
        io.to(socketId).emit("ai_message", {
          content,
        });
      }
    },
  );

  await event.subscribe<{ sessionId: string; message: string }>(
    "ERROR_OCCURRED",
    ({ sessionId, message }) => {
      console.log("subscribed ERROR_OCCURRED", sessionId, message);
      const socketId = sockets[sessionId];
      if (socketId) {
        io.to(socketId).emit("error_message", {
          message,
        });
      }
    },
  );
};

export default { setup };
