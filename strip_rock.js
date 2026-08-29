const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "src/components/mockup/SocialLaunchMockup.tsx");
let content = fs.readFileSync(filePath, "utf8");

// Remove the rock pedestal function entirely
const renderRockRegex = /const renderRockPedestalShowcase = \([\s\S]*?\)\s*=>\s*\([\s\S]*?<\/svg>\s*<\/div>\s*<\/div>\s*\);/;
content = content.replace(renderRockRegex, "");

// Remove the stageMode condition
content = content.replace(/\{stageMode === "rock" \? \([\s\S]*?\) : \(\s*<>/, "<>");

// Remove the stage mode switcher from controls
const switcherRegex = /\{\/\* 1\. Stage Mode Switcher \(Rock Pedestal vs Clean Studio\) \*\/\}[\s\S]*?\{\/\* 2\. Headline Hook Mode \*\/\}/;
content = content.replace(switcherRegex, "{/* 2. Headline Hook Mode */}");

fs.writeFileSync(filePath, content, "utf8");
console.log("Patched successfully");
