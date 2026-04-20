import crypto from "node:crypto";

export function stableHash(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}

