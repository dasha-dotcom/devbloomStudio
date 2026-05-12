import { createHash, randomBytes } from "node:crypto";

export function generateStudentSessionToken() {
  return randomBytes(32).toString("base64url");
}

export function hashStudentSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}
