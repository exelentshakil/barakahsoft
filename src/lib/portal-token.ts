import { createHmac, timingSafeEqual } from "node:crypto";

const TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;

function secret() {
  const value = process.env.PORTAL_TOKEN_SECRET;
  if (!value) throw new Error("PORTAL_TOKEN_SECRET is not configured");
  return value;
}

function encode(value: string) {
  return Buffer.from(value).toString("base64url");
}

function sign(payload: string) {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function createPortalToken(leadId: string, now = Math.floor(Date.now() / 1000)) {
  const payload = encode(JSON.stringify({ leadId, exp: now + TOKEN_TTL_SECONDS }));
  return `${payload}.${sign(payload)}`;
}

export function verifyPortalToken(token: string | undefined, leadId: string, now = Math.floor(Date.now() / 1000)) {
  if (!token) return false;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return false;

  const expected = sign(payload);
  const actualBytes = Buffer.from(signature);
  const expectedBytes = Buffer.from(expected);
  if (actualBytes.length !== expectedBytes.length || !timingSafeEqual(actualBytes, expectedBytes)) return false;

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as { leadId?: string; exp?: number };
    return parsed.leadId === leadId && typeof parsed.exp === "number" && parsed.exp >= now;
  } catch {
    return false;
  }
}
