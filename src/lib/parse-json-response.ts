// Gemini sometimes wraps JSON replies in markdown code fences despite being
// asked not to — strips those before parsing. Shared by every call site that
// asks Gemini for structured JSON (compose-sections, caption-photos,
// generate-extra-sections) instead of duplicating the same few lines.
export function parseJsonResponse(raw: string): Record<string, unknown> | null {
  // Extract JSON block if the model included conversational filler
  let cleaned = raw;
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (match) {
    cleaned = match[0];
  }
  
  try {
    const parsed = JSON.parse(cleaned);
    return typeof parsed === "object" && parsed !== null ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}
