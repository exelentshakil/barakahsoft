/**
 * Pull the real story out of a scraped About page.
 *
 * The brief carries that page as raw markdown, and most of it is the site's
 * own navigation: repeated logo links, a hamburger label, three copies of the
 * menu, a cookie banner, a copyright line. Handing all of it to the copy model
 * buried four genuinely good paragraphs — the founders' names, the engineering
 * background, why they started the company, the ten-year warranty — in noise.
 */
export function cleanAboutContent(raw: string | null): string {
  if (!raw) return "";

  // Markdown is stripped GLOBALLY first. The line-based version of this
  // assumed the scrape arrives one element per line; when a site's About page
  // came back as a single long line it passed straight through and the raw
  // "[![](https://...)](https://...)" ended up rendered on the client's page.
  const flattened = raw
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[#>*_`|]/g, " ")
    // Known chrome debris, removed before sentences are formed — otherwise a
    // menu glued to the front of a real paragraph takes the paragraph down
    // with it, which is how the founders' names went missing.
    .replace(/hamburger site navigation icon|skip to (?:main )?content|site navigation/gi, " ")
    .replace(/(^|\s)[-–—]\s+(?=[A-Z])/g, " ");

  // Sentences, not lines, so a single-line document still splits correctly.
  const sentences = flattened
    .split(/(?<=[.!?])\s+|\n{2,}/)
    .map((sentence) =>
      sentence
        .replace(/\s+/g, " ")
        .trim()
        // A run of Title Case words glued to the front of a real sentence is
        // the page's own headings ("About Saddle Roofing Our Story Welcome
        // to..."). Cut back to where the prose starts. Anchored to ^, so this
        // has to run AFTER the trim — a single leading space defeated it.
        .replace(/^(?:[A-Z][\w'&-]*\s+){2,}(?=[A-Z][a-z]+\s+(?:to|the|a|we|our|is|was|has|have)\b)/, "")
        .trim()
    )
    .filter((sentence) => {
      if (sentence.length < 50) return false;
      if (/cookies?|copyright|all rights reserved|powered by|social link|navigation icon|skip to|privacy policy/i.test(sentence)) return false;
      // A "sentence" that is mostly punctuation or nav labels is not prose.
      const words = sentence.split(/\s+/);
      // Prose has plenty of lowercase words; a menu is almost all Title Case.
      return words.length >= 8 && words.filter((word) => /^[a-z]/.test(word)).length / words.length >= 0.4;
    });

  return [...new Set(sentences)].join(" ").slice(0, 4000);
}
