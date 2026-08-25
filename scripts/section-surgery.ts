#!/usr/bin/env bun
/**
 * Local CLI / OpenCode module for Section Surgery.
 * Run with: bun ./scripts/section-surgery.ts <leadSlug> [command] [args...]
 * Commands:
 *   - list: Shows all sections and their IDs.
 *   - load <sectionId>: Dumps the HTML of a section to stdout.
 *   - save <sectionId> <html_file>: Updates a section from a local HTML file.
 *   - prompt <sectionId> "<instruction>": Uses AI to refine a section based on instructions.
 *   - critic: Runs the design critic on the entire assembled site. Block deployments if failing.
 */

import { readFileSync, writeFileSync } from "fs";
import { loadSections, saveSections, promptSection, criticiseSite, replaceSection } from "../src/lib/section-surgery";
import { resolve } from "path";

async function main() {
  const [,, leadSlug, command, ...args] = process.argv;

  if (!leadSlug || !command) {
    console.error("Usage: bun ./scripts/section-surgery.ts <leadSlug> <command> [args...]");
    console.error("Commands: list, load, save, prompt, critic");
    process.exit(1);
  }

  try {
    switch (command) {
      case "list": {
        const { sections } = await loadSections(leadSlug);
        console.log(`Found ${sections.length} sections for ${leadSlug}:`);
        for (const s of sections) {
          console.log(`- ${s.id} (${s.label}) ${s.locked ? "[LOCKED]" : ""}`);
        }
        break;
      }
      case "load": {
        const sectionId = args[0];
        if (!sectionId) throw new Error("Missing sectionId");
        const { sections } = await loadSections(leadSlug);
        const sec = sections.find((s) => s.id === sectionId);
        if (!sec) throw new Error(`Section ${sectionId} not found`);
        console.log(sec.html);
        break;
      }
      case "save": {
        const sectionId = args[0];
        const filePath = args[1];
        if (!sectionId || !filePath) throw new Error("Missing sectionId or filePath");
        
        const html = readFileSync(resolve(process.cwd(), filePath), "utf-8");
        const { sections, css } = await loadSections(leadSlug);
        
        const secIndex = sections.findIndex((s) => s.id === sectionId);
        if (secIndex === -1) throw new Error(`Section ${sectionId} not found`);
        
        sections[secIndex].html = html;

        // Run critic before saving
        console.log("Running critic on proposed changes...");
        // To do this properly we must temporarily save or mock. 
        // Actually, criticSite loads from DB. Let's save first, then critic.
        await saveSections(leadSlug, sections, { css });
        
        const result = await criticiseSite(leadSlug);
        if (!result.passes) {
          console.error("\n❌ Critic Loop Failed! Deployment blocked.");
          console.error("Blockers:", result.blockers);
          console.error("Warnings:", result.warnings);
          process.exit(1);
        } else {
          console.log("✅ Critic passed! Section updated and verified.");
        }
        break;
      }
      case "prompt": {
        const sectionId = args[0];
        const instruction = args[1];
        if (!sectionId || !instruction) throw new Error("Missing sectionId or instruction");
        
        console.log(`Prompting section ${sectionId} with: "${instruction}"...`);
        const newSection = await promptSection(leadSlug, sectionId, instruction, "openai");
        
        const { sections, css } = await loadSections(leadSlug);
        const updated = replaceSection(sections, newSection);
        
        await saveSections(leadSlug, updated, { css });
        console.log(`✅ Section ${sectionId} regenerated and saved.`);
        
        console.log("Running critic to verify changes...");
        const result = await criticiseSite(leadSlug);
        if (!result.passes) {
          console.warn("⚠️ Critic found issues after prompt:");
          console.warn("Blockers:", result.blockers);
        } else {
          console.log("✅ Critic passed!");
        }
        break;
      }
      case "critic": {
        console.log(`Running critic on ${leadSlug}...`);
        const result = await criticiseSite(leadSlug);
        if (result.passes) {
          console.log("✅ Site passes critic!");
          if (result.warnings.length) console.log("Warnings:", result.warnings);
        } else {
          console.error("❌ Site failed critic!");
          console.error("Blockers:", result.blockers);
          if (result.warnings.length) console.log("Warnings:", result.warnings);
          process.exit(1);
        }
        break;
      }
      default:
        console.error(`Unknown command: ${command}`);
        process.exit(1);
    }
  } catch (error: any) {
    console.error("Error:", error.message);
    process.exit(1);
  }
}

main();
