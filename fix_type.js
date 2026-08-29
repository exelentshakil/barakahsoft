const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "src/components/mockup/SocialLaunchMockup.tsx");
let content = fs.readFileSync(filePath, "utf8");

content = content.replace(
  /imageRendering: "high-quality"/g,
  'imageRendering: "high-quality" as any'
);

fs.writeFileSync(filePath, content, "utf8");
console.log("Patched successfully");
