const fs = require('fs');
const path = './src/app/layout.tsx';
let content = fs.readFileSync(path, 'utf8');

const headRegex = /<head>([\s\S]*?)<\/head>/;
const bodyRegex = /<body(.*?)>([\s\S]*?)<\/body>/;

const headMatch = content.match(headRegex);
const bodyMatch = content.match(bodyRegex);

let newHead = headMatch[1];
let newBody = bodyMatch[2];

// Extract noscript block
const noscriptBlock = `        <noscript>
          <img
            height="1"
            width="1"
            style={{ display: "none" }}
            src="https://www.facebook.com/tr?id=1777973306713413&ev=PageView&noscript=1"
            alt=""
          />
        </noscript>`;

// Remove from head
newHead = newHead.replace(noscriptBlock, '');

// Prepend to body
newBody = `\n        {/* Meta Pixel Fallback */}\n${noscriptBlock}` + newBody;

content = content.replace(headMatch[0], `<head>${newHead}</head>`);
content = content.replace(bodyMatch[0], `<body${bodyMatch[1]}>${newBody}</body>`);

fs.writeFileSync(path, content, 'utf8');
console.log("Fixed layout");
