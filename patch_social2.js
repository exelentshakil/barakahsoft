const fs = require('fs');
let code = fs.readFileSync('src/components/admin/SocialMockupPanel.tsx', 'utf8');

// I will just remove the whole useEffect containing setInterval
const lines = code.split('\n');
const newLines = [];
let skip = false;
for (const line of lines) {
  if (line.includes('useEffect(() => {') && lines[lines.indexOf(line) + 1].includes('if (!socialMotion')) {
    skip = true;
  }
  if (!skip) {
    newLines.push(line);
  }
  if (skip && line.includes('}, [socialMotion, lead.id]);')) {
    skip = false;
  }
}
fs.writeFileSync('src/components/admin/SocialMockupPanel.tsx', newLines.join('\n'));
