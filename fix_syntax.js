const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "src/components/mockup/SocialLaunchMockup.tsx");
let content = fs.readFileSync(filePath, "utf8");

content = content.replace(
  /\{\/\* 3D MacBook Pro in Foreground \*\/\}\s*\{render3DMacBook\(screenRef, screenScale, isExporting\)\}\s*<\/>\s*\)\}/,
  `{/* 3D MacBook Pro in Foreground */}
              {render3DMacBook(screenRef, screenScale, isExporting)}
            </>`
);

fs.writeFileSync(filePath, content, "utf8");
console.log("Patched successfully");
