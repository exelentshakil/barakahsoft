// Turning a model's reply into an object, given that it is prose until proven
// otherwise.
//
// The previous version took everything between the first "{" and the last "}"
// with a greedy regex. That works for a clean reply and fails in the two ways
// that actually happen:
//
// TRAILING PROSE. "…} Hope this helps!" is fine, but a closing brace inside
// that prose — or a second JSON block — swallows the wrong span.
//
// TRUNCATION. A response cut off at the token limit has no final "}" at all,
// so the regex matches nothing and a complete, usable object is thrown away
// over its last two characters. This is the common failure with reasoning
// models, which spend the completion budget thinking before they write.
//
// So: find the first plausible opening brace, walk it with a real brace
// counter that understands strings and escapes, and if the walk never closes,
// repair the truncation rather than discarding the answer.

/** Which structures are still open at the end of `text`, in order. */
function unclosed(text: string, start = 0): string[] {
  const stack: string[] = [];
  let inString = false;
  let escaped = false;
  for (let i = start; i < text.length; i += 1) {
    const char = text[i];
    if (escaped) {
      escaped = false;
      continue;
    }
    if (char === "\\") {
      escaped = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (char === "{" || char === "[") stack.push(char);
    else if (char === "}" || char === "]") stack.pop();
  }
  return stack;
}

/** Walk from `start`, returning the balanced span or null if it never closes. */
function balancedSpan(text: string, start: number): { span: string; open: string[] } {
  const stack: string[] = [];
  let inString = false;
  let escaped = false;

  for (let i = start; i < text.length; i += 1) {
    const char = text[i];

    if (escaped) {
      escaped = false;
      continue;
    }
    if (char === "\\") {
      escaped = true;
      continue;
    }
    if (char === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;

    if (char === "{" || char === "[") stack.push(char);
    else if (char === "}" || char === "]") {
      stack.pop();
      if (stack.length === 0) return { span: text.slice(start, i + 1), open: [] };
    }
  }

  return { span: text.slice(start), open: stack };
}

/**
 * Close an object that was cut off mid-write.
 *
 * Drops whatever partial value trails the last complete structure, then closes
 * what is still open. A PRD truncated inside its ninth section is a PRD with
 * eight good sections; the schema's own minimums decide whether that is enough,
 * which is a better judge than a brace count.
 */
function repairTruncated(span: string): string {
  let text = span;

  // Prefer cutting back to the last COMPLETE structure. Cutting back to the
  // last quote instead patches a half-written value into a whole one — a
  // section whose kind arrives as "membership-tie" reads as real and is not.
  // Dropping the partial object loses one item and keeps the rest honest.
  const lastStructure = Math.max(text.lastIndexOf("}"), text.lastIndexOf("]"));
  if (lastStructure > 0) {
    text = text.slice(0, lastStructure + 1);
  } else {
    // Nothing complete to cut to, so this is a flat object truncated mid-value.
    // Drop the trailing incomplete pair rather than closing its string.
    text = text.replace(/,\s*"[^"]*"?\s*:?\s*(?:"[^"]*)?$/, "");
    const quotes = (text.match(/(?<!\\)"/g) ?? []).length;
    if (quotes % 2 === 1) text = text.replace(/"[^"]*$/, "");
  }

  text = text.replace(/,\s*$/, "");

  // Recomputed, not reused. Trimming back to the last complete structure also
  // closed some of what the original walk saw open, so replaying that stack
  // appends braces the trim already supplied and the result does not parse.
  const stillOpen = unclosed(text);
  for (let i = stillOpen.length - 1; i >= 0; i -= 1) {
    text += stillOpen[i] === "{" ? "}" : "]";
  }
  return text;
}

export function parseJsonResponse(raw: string): Record<string, unknown> | null {
  if (!raw) return null;

  // Fenced blocks first: they mark the boundary explicitly, so honour it.
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const source = fenced ? fenced[1] : raw;

  const start = source.indexOf("{");
  if (start === -1) return null;

  const { span, open } = balancedSpan(source, start);

  const attempts = open.length ? [repairTruncated(span), span] : [span];
  for (const attempt of attempts) {
    try {
      const parsed = JSON.parse(attempt);
      if (typeof parsed === "object" && parsed !== null) {
        if (open.length) console.warn("[parse-json] response was truncated; recovered the complete portion");
        return parsed as Record<string, unknown>;
      }
    } catch {
      // try the next candidate
    }
  }
  return null;
}
