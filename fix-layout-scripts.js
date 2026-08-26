const fs = require('fs');
const path = './src/app/layout.tsx';
let content = fs.readFileSync(path, 'utf8');

const headRegex = /<head>([\s\S]*?)<\/head>/;
const bodyRegex = /<body(.*?)>([\s\S]*?)<\/body>/;

const headMatch = content.match(headRegex);
const bodyMatch = content.match(bodyRegex);

let newHead = headMatch[1];
let newBody = bodyMatch[2];

// Extract Scripts
const metaPixelScriptRegex = /\{\/\* Meta Pixel for Facebook Ads \*\/\}[\s\S]*?<\/Script>/;
const clarityScriptRegex = /\{\/\* Microsoft Clarity Analytics & Heatmaps \(Restricted to main landing page only\) \*\/\}[\s\S]*?<\/Script>/;

const metaPixelScript = newHead.match(metaPixelScriptRegex)[0];
const clarityScript = newHead.match(clarityScriptRegex)[0];

newHead = newHead.replace(metaPixelScriptRegex, '');
newHead = newHead.replace(clarityScriptRegex, '');

// Prepend to body
newBody = `\n        ${metaPixelScript}\n        ${clarityScript}` + newBody;

content = content.replace(headMatch[0], `<head>${newHead}</head>`);
content = content.replace(bodyMatch[0], `<body${bodyMatch[1]}>${newBody}</body>`);

fs.writeFileSync(path, content, 'utf8');
console.log("Moved scripts to body");
