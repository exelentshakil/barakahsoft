// Length limits that respect where prose actually ends.
//
// A bare `.slice(0, n)` on client copy shipped "...money flow out of state to
// non-resident roofing corporati" onto a client's proposal. A budget is a
// budget, but it should land on a sentence.

/**
 * Trims to `maxChars`, preferring the last completed sentence inside the
 * budget. Falls back to the last whole word with an ellipsis when the budget
 * lands early in a long sentence, so it never cuts a word in half.
 */
export function trimToSentence(text: string, maxChars: number): string {
  const clean = text.trim();
  if (clean.length <= maxChars) return clean;

  const window = clean.slice(0, maxChars);
  const lastStop = Math.max(
    window.lastIndexOf(". "),
    window.lastIndexOf("! "),
    window.lastIndexOf("? "),
    window.lastIndexOf(".\n"),
    window.lastIndexOf("!\n"),
    window.lastIndexOf("?\n")
  );

  // Only honour a sentence break if it keeps enough of the copy to be worth
  // showing; otherwise a single long opening sentence would gut the section.
  if (lastStop >= maxChars * 0.45) return clean.slice(0, lastStop + 1).trim();

  const lastSpace = window.lastIndexOf(" ");
  const cut = lastSpace > 0 ? clean.slice(0, lastSpace) : window;
  return cut.replace(/[\s,;:—–-]+$/, "") + "…";
}

/**
 * The same budget, applied across paragraph breaks: keeps at most
 * `maxParagraphs` and stops once the running length would exceed `maxChars`.
 * Always returns at least one paragraph, itself trimmed to the budget.
 */
export function trimParagraphs(text: string, maxChars: number, maxParagraphs = 2): string {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (paragraphs.length === 0) return "";

  const kept: string[] = [];
  let used = 0;
  for (const paragraph of paragraphs.slice(0, maxParagraphs)) {
    if (kept.length > 0 && used + paragraph.length > maxChars) break;
    kept.push(paragraph);
    used += paragraph.length;
  }

  return trimToSentence(kept.join("\n\n"), maxChars);
}
