const fs = require('fs');
const content = fs.readFileSync('src/app/layout.tsx', 'utf8');

const headContent = content.match(/<head>([\s\S]*?)<\/head>/)[1];
console.log(headContent);
