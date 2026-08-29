const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "src/components/mockup/SocialLaunchMockup.tsx");
let content = fs.readFileSync(filePath, "utf8");

content = content.replace(
  /className="relative w-full aspect-\[16\/11\] bg-slate-950 overflow-hidden"/g,
  'className="relative w-full aspect-video bg-slate-950 overflow-hidden"'
);

// We might want to make sure the image scales perfectly without being distorted
// And if we want to ensure no side cropping ever, we can use w-full h-auto for the image
// But object-cover with aspect-video works great if the screenshot is 16:9.
content = content.replace(
  /className="w-full h-full object-cover object-top"/g,
  'className="w-full h-auto object-cover object-top min-h-full"'
);

fs.writeFileSync(filePath, content, "utf8");
console.log("Patched successfully");
