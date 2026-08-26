const fs = require('fs');
const path = './src/inngest/functions/bespoke-generate.ts';
let content = fs.readFileSync(path, 'utf8');

const anchor = `    const stylesheet = await step.run("stylesheet", async () => {`;
const replacement = `    await bumpProgress(admin, lead_id, 3);\n\n    const stylesheet = await step.run("stylesheet", async () => {`;

if (content.includes(anchor)) {
  content = content.replace(anchor, replacement);
  fs.writeFileSync(path, content, 'utf8');
  console.log("Added bumpProgress(3)");
} else {
  console.log("Could not find anchor");
}
