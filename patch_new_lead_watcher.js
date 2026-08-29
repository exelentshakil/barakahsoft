const fs = require('fs');
let code = fs.readFileSync('src/components/admin/NewLeadWatcher.tsx', 'utf8');

code = code.replace(/\.on\("postgres_changes", \{ event: "UPDATE", schema: "public", table: "leads" \}, \(\) => \{\n\s*if \(arrivedRef\.current === 0\) router\.refresh\(\);\n\s*\}\)/g, '');

fs.writeFileSync('src/components/admin/NewLeadWatcher.tsx', code);
