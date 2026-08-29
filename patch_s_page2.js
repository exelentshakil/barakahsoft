const fs = require('fs');
let code = fs.readFileSync('src/app/s/[leadSlug]/page.tsx', 'utf8');

code = code.replace(/\{isBuilding && \}\n\s*\{isBuilding && \([\s\S]*?Auto-refreshing view<\/span>\n\s*<\/div>\n\s*\)\}\n/, '');
code = code.replace(/const isBuilding = lead\.status === "rendering" \|\| artifact\?\.full_site_status === "building";\n\n/, '');

fs.writeFileSync('src/app/s/[leadSlug]/page.tsx', code);
