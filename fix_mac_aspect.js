const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "src/components/mockup/SocialLaunchMockup.tsx");
let content = fs.readFileSync(filePath, "utf8");

content = content.replace(
  /className="relative aspect-\[16\/10\] w-full rounded-lg bg-\[#0e1626\] overflow-hidden shadow-inner border border-black\/90 flex flex-col"/g,
  'className="relative aspect-video w-full rounded-lg bg-[#0e1626] overflow-hidden shadow-inner border border-black/90 flex flex-col"'
);

fs.writeFileSync(filePath, content, "utf8");
console.log("Patched successfully");
