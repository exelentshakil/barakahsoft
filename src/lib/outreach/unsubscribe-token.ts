import { createHmac, timingSafeEqual } from "node:crypto";

// An unsubscribe link that never expires.
//
// Deliberately not the portal token, which lives for seven days: a cold email
// can sit unread for months, and a "stop emailing me" link that has quietly
// stopped working is both the rudest possible failure and, under PECR and
// CAN-SPAM, not a working opt-out at all.
//
// Signed rather than a raw id so a stranger cannot unsubscribe someone else by
// walking uuids, and so the id itself is not readable from the URL.

function secret(): string {
  const value = process.env.PORTAL_TOKEN_SECRET;
  if (!value) throw new Error("PORTAL_TOKEN_SECRET is not configured");
  return value;
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(`unsub:${payload}`).digest("base64url");
}

export function createUnsubscribeToken(leadId: string): string {
  const payload = Buffer.from(leadId).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

/** The lead this token unsubscribes, or null if it was not issued by us. */
export function readUnsubscribeToken(token: string | undefined | null): string | null {
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expected = sign(payload);
  const actual = Buffer.from(signature);
  const wanted = Buffer.from(expected);
  if (actual.length !== wanted.length || !timingSafeEqual(actual, wanted)) return null;

  try {
    return Buffer.from(payload, "base64url").toString("utf8") || null;
  } catch {
    return null;
  }
}

export function unsubscribeUrl(baseUrl: string, leadId: string): string {
  return `${baseUrl.replace(/\/$/, "")}/api/unsubscribe?t=${createUnsubscribeToken(leadId)}`;
}
