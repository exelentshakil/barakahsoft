const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "src/components/mockup/SocialLaunchMockup.tsx");
let content = fs.readFileSync(filePath, "utf8");

content = content.replace(
  /className="w-full h-auto object-cover object-top min-h-full"/g,
  `className="w-full h-auto object-cover object-top min-h-full origin-top"
            style={{ 
              imageRendering: "high-quality", 
              transform: "translateZ(0)", 
              backfaceVisibility: "hidden"
            }}`
);

fs.writeFileSync(filePath, content, "utf8");
console.log("Patched successfully");
