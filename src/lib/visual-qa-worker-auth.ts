import { createHash, timingSafeEqual } from "crypto";

function digest(value: string): Buffer {
  return createHash("sha256").update(value).digest();
}

export function isVisualQaWorker(headers: Headers): boolean {
  const expected = process.env.VISUAL_QA_WORKER_TOKEN?.trim();
  const authorization = headers.get("authorization") ?? "";
  const supplied = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
  if (!expected || !supplied) return false;
  return timingSafeEqual(digest(expected), digest(supplied));
}
