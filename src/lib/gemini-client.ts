// Bare Gemini REST wrapper — its own module so both ai.ts and
// generate-with-critique.ts (which ai.ts now also imports, for the
// draft/critique/revise loop) can depend on it without a circular import.
export async function callGemini(prompt: string, model = "gemini-3.6-flash"): Promise<string | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.error("[ai] GEMINI_API_KEY is not set in this environment");
    return null;
  }

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "<unreadable body>");
      throw new Error(`Gemini API ${res.status}: ${body}`);
    }
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    return text?.trim() || null;
  } catch (err) {
    console.error("[ai] Gemini call failed —", err);
    return null;
  }
}
