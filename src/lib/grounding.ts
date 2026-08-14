// validate_grounding atom — the reliability mechanism PRD-FINAL §4 relies on:
// AI populates copy into fixed shell slots, grounded only in scraped facts.
// This is a cheap heuristic gate, not a second AI call — it catches the
// obvious failure modes (fabricated numbers, banned generic-stock phrases)
// before a generated section reaches QA.

import type { Facts } from "@/lib/ai";

const GENERIC_SLOP_PHRASES = [
  "world-class",
  "cutting-edge",
  "state-of-the-art",
  "unparalleled",
  "synergy",
  "game-changer",
  "revolutionize",
  "seamless experience",
];

export interface GroundingResult {
  pass: boolean;
  reasons: string[];
}

// Numbers in the generated text that don't appear anywhere in facts are the
// single highest-risk fabrication (invented review counts, years-in-business,
// prices). Flags them for a human to check during QA rather than blocking
// generation outright — some numbers (e.g. "24/7", "1-2 days") are idiomatic,
// not claims, so this is advisory, not a hard fail.
function findUngroundedNumbers(text: string, factsText: string): string[] {
  const numbers = text.match(/\b\d[\d,]*(\.\d+)?%?\b/g) || [];
  return numbers.filter((n) => !factsText.includes(n) && !["24", "7", "365"].includes(n));
}

export function validateGrounding(text: string, facts: Facts): GroundingResult {
  const reasons: string[] = [];
  const factsText = JSON.stringify(facts);

  const slop = GENERIC_SLOP_PHRASES.filter((phrase) => text.toLowerCase().includes(phrase));
  if (slop.length > 0) reasons.push(`Contains forbidden generic phrase(s): ${slop.join(", ")}`);

  if (/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(text)) reasons.push("Contains an emoji — zero emoji anywhere per PRD §5 design rules");

  const ungroundedNumbers = findUngroundedNumbers(text, factsText);
  if (ungroundedNumbers.length > 0) reasons.push(`Numbers not found in facts (verify manually): ${ungroundedNumbers.join(", ")}`);

  return { pass: reasons.length === 0, reasons };
}
