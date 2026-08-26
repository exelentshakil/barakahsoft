const fs = require('fs');
let path = 'src/app/api/leads/add-url/route.ts';
let content = fs.readFileSync(path, 'utf8');

content = content.replaceAll('source: "home"', 'source: "outreach"');

fs.writeFileSync(path, content, 'utf8');
console.log("Restored source: outreach");
