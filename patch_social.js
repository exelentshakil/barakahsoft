const fs = require('fs');
let code = fs.readFileSync('src/components/admin/SocialMockupPanel.tsx', 'utf8');

code = code.replace(/  useEffect\(\(\) => \{\n    if \(\!socialMotion \|\| \!\["starting", "generating"\]\.includes\(socialMotion\.status \|\| ""\)\) return;\n    const timer = setInterval\(async \(\) => \{\n      const res = await fetch\(`\/api\/leads\/\$\{lead\.id\}\/social-motion`\);\n      const result = await res\.json\(\)\.catch\(\(\) => \(\{\}\)\);\n      if \(res\.ok\) setSocialMotion\(result\.motion\);\n    \}, 5000\);\n    return \(\) => clearInterval\(timer\);\n  \}, \[socialMotion, lead\.id\]\);\n/, '');

fs.writeFileSync('src/components/admin/SocialMockupPanel.tsx', code);
