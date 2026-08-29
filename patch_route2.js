const fs = require('fs');
const path = './src/app/api/leads/[id]/generate/route.ts';
let content = fs.readFileSync(path, 'utf8');

// Remove the remaining model declaration that causes TypeScript error
content = content.replace(/const model = typeof body\.model === "string".*?undefined;\n/g, '');

fs.writeFileSync(path, content);
