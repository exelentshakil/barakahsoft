const fs = require('fs');
let code = fs.readFileSync('src/components/admin/SocialMockupPanel.tsx', 'utf8');

const regex = /useEffect\(\(\) => \{\n\s*if \(\!socialMotion.*?\n\s*const timer = setInterval[\s\S]*?clearInterval\(timer\);\n\s*\}, \[socialMotion, lead\.id\]\);/g;
code = code.replace(regex, '');

fs.writeFileSync('src/components/admin/SocialMockupPanel.tsx', code);
