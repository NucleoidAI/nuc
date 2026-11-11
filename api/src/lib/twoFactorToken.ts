import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

export function createToken() {
  return randomBytes(32).toString("hex");
}
export function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
export function matchesToken(token: string, hash: string) {
  return (
    /^[a-f0-9]{64}$/.test(token) &&
    /^[a-f0-9]{64}$/.test(hash) &&
    timingSafeEqual(
      Buffer.from(hashToken(token), "hex"),
      Buffer.from(hash, "hex"),
    )
  );
}
export function approvalLinks(
  base: string | undefined,
  taskId: string,
  stepId: string,
  token: string,
) {
  if (!base)
    throw new Error(
      "TWO_FACTOR_PUBLIC_URL is required for email approval links",
    );
  const url = new URL(
    `${base.replace(/\/$/, "")}/tasks/${encodeURIComponent(
      taskId,
    )}/two-factor/email`,
  );
  if (
    url.protocol !== "https:" &&
    !(
      url.protocol === "http:" &&
      ["localhost", "127.0.0.1"].includes(url.hostname)
    )
  )
    throw new Error("TWO_FACTOR_PUBLIC_URL must use HTTPS");
  url.searchParams.set("stepId", stepId);
  url.searchParams.set("token", token);
  url.searchParams.set("decision", "APPROVED");
  const approve = url.toString();
  url.searchParams.set("decision", "REJECTED");
  return { approve, reject: url.toString() };
}
