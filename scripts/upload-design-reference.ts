// v6 -- one-time, operator-run script (never wired into the Inngest
// pipeline): resizes every full-page PNG under design-reference/**
// (currently up to ~11MB each) down to a compact JPEG and uploads it to the
// private `design-reference` Supabase Storage bucket at
// {persona-slug}/{n}.jpg, so src/lib/design-reference.ts can fetch a real
// niche's screenshot set at generation time without ever reading local
// disk in the deployed serverless function (untraced, unreliable there).
//
// Run manually after sourcing new screenshots for a trade:
//   npx tsx --env-file=.env.local scripts/upload-design-reference.ts
import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import sharp from "sharp";
import { createAdminClient } from "@/lib/supabase/admin";

const ROOT = join(process.cwd(), "design-reference/home-services-trades");
const RESIZE_WIDTH = 900;
const JPEG_QUALITY = 60;

async function main() {
  const admin = createAdminClient();
  const trades = readdirSync(ROOT, { withFileTypes: true }).filter((e) => e.isDirectory());

  for (const trade of trades) {
    const dir = join(ROOT, trade.name);
    const files = readdirSync(dir).filter((f) => f.toLowerCase().endsWith(".png"));
    if (files.length === 0) {
      console.log(`[${trade.name}] no screenshots, skipping`);
      continue;
    }

    console.log(`[${trade.name}] uploading ${files.length} screenshots...`);
    for (let i = 0; i < files.length; i++) {
      const srcPath = join(dir, files[i]);
      const buffer = await sharp(readFileSync(srcPath)).resize({ width: RESIZE_WIDTH }).jpeg({ quality: JPEG_QUALITY }).toBuffer();
      const destPath = `${trade.name}/${i + 1}.jpg`;
      const { error } = await admin.storage.from("design-reference").upload(destPath, buffer, {
        contentType: "image/jpeg",
        upsert: true,
      });
      if (error) {
        console.error(`  ${files[i]} -> ${destPath} FAILED:`, error.message);
      } else {
        console.log(`  ${files[i]} -> ${destPath} (${buffer.length} bytes)`);
      }
    }
  }
}

main();
