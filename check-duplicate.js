const fs = require("fs");
let path = "src/app/api/leads/add-url/route.ts";
let content = fs.readFileSync(path, "utf8");

const importLine = 'import { generateUniqueDomainSlug } from "@/lib/domain-slug";';
const newHelper = `import { generateUniqueDomainSlug } from "@/lib/domain-slug";

function extractDomain(urlStr: string) {
  try {
    return new URL(urlStr).hostname.replace(/^www\\./, "").toLowerCase();
  } catch {
    return null;
  }
}`;

content = content.replace(importLine, newHelper);

// Single Ingestion Mode
const singleCheck = `  const slug = await generateUniqueDomainSlug(admin, rawUrl);`;
const singleNew = `  const domain = extractDomain(rawUrl);
  if (domain) {
    const { data: existing } = await admin.from("leads").select("id, status").ilike("source_url", \`%\${domain}%\`).limit(1).maybeSingle();
    if (existing) {
      return NextResponse.json({ error: \`A lead for \${domain} already exists (status: \${existing.status}).\` }, { status: 400 });
    }
  }

  const slug = await generateUniqueDomainSlug(admin, rawUrl);`;

content = content.replace(singleCheck, singleNew);

// Bulk Ingestion Mode
const bulkCheck = `      try {
        const slug = await generateUniqueDomainSlug(admin, rawUrl);`;
const bulkNew = `      try {
        const domain = extractDomain(rawUrl);
        if (domain) {
          const { data: existing } = await admin.from("leads").select("id").ilike("source_url", \`%\${domain}%\`).limit(1).maybeSingle();
          if (existing) {
            errors.push({ url: rawUrl, error: "Lead already exists" });
            continue;
          }
        }
        const slug = await generateUniqueDomainSlug(admin, rawUrl);`;

content = content.replace(bulkCheck, bulkNew);

fs.writeFileSync(path, content, "utf8");
console.log("Added duplicate checking to add-url route");
