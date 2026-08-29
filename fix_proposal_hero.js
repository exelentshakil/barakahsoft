const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "src/components/portal/sections/ProposalHero.tsx");
let content = fs.readFileSync(filePath, "utf8");

content = content.replace(
  /data=\{\{ \.\.\.mockupData, stageMode: "rock" \}\}/g,
  "data={mockupData}"
);

fs.writeFileSync(filePath, content, "utf8");
console.log("Patched successfully");
