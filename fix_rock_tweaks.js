const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "src/components/mockup/SocialLaunchMockup.tsx");
let content = fs.readFileSync(filePath, "utf8");

// 1. Move the card up a bit in the rock showcase
// Currently it is:
// cardTop: "-top-12 sm:-top-16",
// Change to:
// cardTop: "-top-16 sm:-top-20",

content = content.replace(
  /renderRockPedestalShowcase\('preview', screenRef, screenScale, "w-\[92%\] max-w-\[465px\]", isExporting, \{\s*cardTop: "-top-12 sm:-top-16",/g,
  `renderRockPedestalShowcase('preview', screenRef, screenScale, "w-[92%] max-w-[465px]", isExporting, {
              cardTop: "-top-16 sm:-top-20",`
);

// 2. Remove the white and black lines on top of the rock
// They are:
// stroke={`url(#rockRim-${idPrefix})`}
// strokeWidth="1.75"
// and 
// {/* Subtle Chiseled Ridge Lines */}
// <path ...
// Basically I need to undo the stroke addition and paths from the plateau SVG

content = content.replace(
  /fill=\{\`url\(#rockPlateau-\$\{idPrefix\}\)\`\}\s*stroke=\{\`url\(#rockRim-\$\{idPrefix\}\)\`\}\s*strokeWidth="1\.75"\s*\/>\s*\{\/\* Subtle Chiseled Ridge Lines \*\/\}\s*<path d="M 220,68 L 250,148" stroke="rgba\(255,255,255,0\.15\)" strokeWidth="1\.5" strokeLinecap="round" \/>\s*<path d="M 460,68 L 440,148" stroke="rgba\(0,0,0,0\.5\)" strokeWidth="1\.5" strokeLinecap="round" \/>\s*<path d="M 330,75 L 345,145" stroke="rgba\(0,0,0,0\.4\)" strokeWidth="1\.2" strokeLinecap="round" \/>/,
  `fill={\`url(#rockPlateau-\${idPrefix})\`}
          />`
);


// 3. I should also remove the rockRim gradient to clean it up since it's not used
content = content.replace(
  /\{\/\* Rim Highlight \*\/\}\s*<linearGradient id=\{\`rockRim-\$\{idPrefix\}\`\} x1="0%" y1="0%" x2="100%" y2="0%">\s*<stop offset="0%" stopColor="rgba\(255,255,255,0\.7\)" \/>\s*<stop offset="30%" stopColor="rgba\(255,255,255,0\.3\)" \/>\s*<stop offset="70%" stopColor="rgba\(255,255,255,0\.6\)" \/>\s*<stop offset="100%" stopColor="rgba\(255,255,255,0\.15\)" \/>\s*<\/linearGradient>\s*\{\/\* Main Chiseled Front Face \*\/\}/,
  `{/* Main Chiseled Front Face */}`
);

fs.writeFileSync(filePath, content, "utf8");
console.log("Patched successfully");
