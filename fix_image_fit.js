const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "src/components/mockup/SocialLaunchMockup.tsx");
let content = fs.readFileSync(filePath, "utf8");

// Fix container background
content = content.replace(
  /<div className="relative w-full h-full overflow-hidden bg-slate-950">/g,
  '<div className="relative w-full h-full overflow-hidden bg-white">'
);

content = content.replace(
  /<div className="relative w-full aspect-video bg-slate-950 overflow-hidden">/g,
  '<div className="relative w-full aspect-video bg-white overflow-hidden">'
);

// Fix image scaling to guarantee 100% width and proportional height without distortion or cropping on the sides
content = content.replace(
  /className="w-full h-auto object-cover object-top min-h-full origin-top"/g,
  'className="w-full h-auto origin-top"'
);

fs.writeFileSync(filePath, content, "utf8");
console.log("Patched successfully");
