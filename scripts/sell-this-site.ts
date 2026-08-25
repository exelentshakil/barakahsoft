#!/usr/bin/env tsx
import {
  criticiseSite,
  loadSections,
  promptSection,
  replaceSection,
  saveSections,
} from "../src/lib/section-surgery";
import type { GenerationProvider } from "../src/lib/generate/model";

function arg(name: string): string | null {
  const index = process.argv.indexOf(name);
  if (index === -1) return null;
  return process.argv[index + 1] ?? null;
}

function has(name: string): boolean {
  return process.argv.includes(name);
}

function usage(): never {
  console.log(`Usage:
  tsx --env-file=.env.local scripts/sell-this-site.ts --url <preview-url-or-slug>
  tsx --env-file=.env.local scripts/sell-this-site.ts --url <url> --section hero --prompt "make hero premium" --provider openai

Options:
  --url       Required. /s/[slug] URL or plain slug.
  --section   Optional section id to refine.
  --prompt    Optional prompt for section surgery. Requires --section.
  --provider  openai | gemini. Default openai.
  --list      List sections only.
`);
  process.exit(1);
}

async function main() {
  const url = arg("--url");
  if (!url) usage();

  const sectionId = arg("--section");
  const prompt = arg("--prompt");
  const provider = ((arg("--provider") ?? "openai") as GenerationProvider);
  const loaded = await loadSections(url);

  console.log(`Loaded ${loaded.sections.length} sections for ${loaded.leadSlug}:`);
  for (const section of loaded.sections) console.log(`- ${section.id} (${section.label})`);

  if (has("--list")) return;

  const before = await criticiseSite(url);
  console.log(`Critic before: passes=${before.passes} blockers=${before.blockers.length} warnings=${before.warnings.length}`);
  for (const blocker of before.blockers) console.log(`BLOCKER: ${blocker}`);
  for (const warning of before.warnings.slice(0, 8)) console.log(`WARNING: ${warning}`);

  if (sectionId || prompt) {
    if (!sectionId || !prompt) throw new Error("--section and --prompt must be provided together");
    console.log(`Refining section "${sectionId}" with ${provider}...`);
    const replacement = await promptSection(url, sectionId, prompt, provider);
    const nextSections = replaceSection(loaded.sections, replacement);
    await saveSections(url, nextSections, { css: loaded.css });
    console.log(`Saved replacement for section "${sectionId}".`);
  }

  const after = await criticiseSite(url);
  console.log(`Critic after: passes=${after.passes} blockers=${after.blockers.length} warnings=${after.warnings.length}`);
  for (const blocker of after.blockers) console.log(`BLOCKER: ${blocker}`);
  for (const warning of after.warnings.slice(0, 8)) console.log(`WARNING: ${warning}`);

  if (!after.passes) process.exitCode = 2;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
