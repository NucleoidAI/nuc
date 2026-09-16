//AI-generated
import dotenv from "dotenv";
import jwt from "jsonwebtoken";

dotenv.config();

function createServiceToken({ projectId }: { projectId: string }): string {
  const jwtSecret = process.env.JWT_SECRET;

  if (!jwtSecret) {
    throw new Error("JWT_SECRET environment variable is required");
  }

  return jwt.sign({ iss: "whatsapp", aud: projectId }, jwtSecret, {
    expiresIn: "12h",
  });
}

export { createServiceToken };
