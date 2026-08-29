const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "src/components/mockup/SocialLaunchMockup.tsx");
let content = fs.readFileSync(filePath, "utf8");

content = content.replace(
  /cardTop: "-top-16 sm:-top-20"/g,
  'cardTop: "-top-28 sm:-top-36"'
);

fs.writeFileSync(filePath, content, "utf8");
console.log("Patched successfully");
