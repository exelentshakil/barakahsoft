const fs = require('fs');
const path = './src/lib/generate/standard.ts';
let content = fs.readFileSync(path, 'utf8');

const badText = 'Every hero section must look like a high-end , never center-align a generic brochure paragraph, and never leave the hero without immediate trust proof and action targets.0,000 bespoke agency build with clear visual hierarchy, disciplined grid, and above-the-fold conversion power. NO CHEAP website design will be accepted:';
const fixedText = 'Every hero section must look like a high-end $20,000 bespoke agency build with clear visual hierarchy, disciplined grid, and above-the-fold conversion power. NO CHEAP website design will be accepted:';

if (content.includes(badText)) {
  content = content.replace(badText, fixedText);
  fs.writeFileSync(path, content, 'utf8');
  console.log("Fixed the $20,000 bug");
} else {
  console.log("Could not find the bad text");
}
