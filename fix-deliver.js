const fs = require("fs");
let path = "src/app/api/leads/[id]/deliver/route.ts";
let content = fs.readFileSync(path, "utf8");

content = content.replace(
  /const customIntro =[\s\S]*?body\.message\.trim\(\)[\s\S]*?tailored to your brand\.";/,
  `const rawIntro = typeof body.message === "string" && body.message.trim() ? body.message.trim() : (stepNumber === 2 ? \`Hi \${lead.contact_name || "there"}, just checking if you had a moment to review the high-speed homepage concept we put together for <strong>\${businessName}</strong>.\` : stepNumber === 3 ? \`Hi \${lead.contact_name || "there"}, following up one last time on the custom website files and Google speed audit for <strong>\${businessName}</strong> before we archive the staging preview.\` : \`Hi \${lead.contact_name || "there"}, we finished your free 48-hour homepage redesign for <strong>\${businessName}</strong>. We audited your mobile speed, mapped your local search rankings, and built a fresh concept tailored to your brand.\`);\n  const customIntro = rawIntro.replace(/\\n/g, '<br/>').replace(/https:\\/\\/portal\\.barakahsoft\\.com\\S+/g, match => \`<a href="\${match}" style="color: #533afd;">\${match}</a>\`);`
);

fs.writeFileSync(path, content, "utf8");
console.log("Fixed deliver route!");
