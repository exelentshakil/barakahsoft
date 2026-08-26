const fs = require('fs');
const content = fs.readFileSync('src/app/layout.tsx', 'utf8');
console.log(content.includes('isLandingHost'));
