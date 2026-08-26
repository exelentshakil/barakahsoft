const fs = require("fs");
let path = "src/app/api/leads/[id]/route.ts";
let content = fs.readFileSync(path, "utf8");

content = content.replace(
  /const updates: Record<string, string \| null> = \{\};/,
  "const updates: Record<string, any> = {};"
);

content = content.replace(
  /if \(typeof body\?\.google_site_verification === "string"\) updates\.google_site_verification = body\.google_site_verification\.trim\(\) \|\| null;/,
  `if (typeof body?.google_site_verification === "string") updates.google_site_verification = body.google_site_verification.trim() || null;
  if (Array.isArray(body?.pain_points)) updates.pain_points = body.pain_points.filter(p => typeof p === "string" && p.trim() !== "");`
);

fs.writeFileSync(path, content, "utf8");
console.log("Updated PATCH route to support pain_points");
