const fs = require('fs');

function replaceInFile(file, regex, replacement) {
  let code = fs.readFileSync(file, 'utf8');
  code = code.replace(regex, replacement);
  fs.writeFileSync(file, code);
}

replaceInFile(
  'src/lib/render-shell.ts',
  /const contact = resolveBusinessContact\(scrapeResults, \{ phone: lead\.phone, email: lead\.email \}\);/,
  'const contact = resolveBusinessContact(scrapeResults, { phone: lead.phone, email: lead.email }, { forceFallback: lead.source === "outreach" || lead.source === "manual" });'
);

replaceInFile(
  'src/lib/build-site-brief.ts',
  /const contact = resolveBusinessContact\(scrapeResults, \{ phone: lead\.phone, email: lead\.email \}\);/,
  'const contact = resolveBusinessContact(scrapeResults, { phone: lead.phone, email: lead.email }, { forceFallback: lead.source === "outreach" || lead.source === "manual" });'
);

replaceInFile(
  'src/components/admin/AdminLeadWorkspace.tsx',
  /const contact = resolveBusinessContact\(scrapeResults, \{ phone: lead\.phone, email: lead\.email \}\);/,
  'const contact = resolveBusinessContact(scrapeResults, { phone: lead.phone, email: lead.email }, { forceFallback: lead.source === "outreach" || lead.source === "manual" });'
);

