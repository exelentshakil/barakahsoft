const fs = require('fs');
let code = fs.readFileSync('src/app/s/[leadSlug]/page.tsx', 'utf8');

code = code.replace(/<PendingAutoRefresh[^>]*\/>/g, '');
code = code.replace(/import \{ PendingAutoRefresh \} from "@\/components\/portal\/PendingAutoRefresh";\n/, '');

fs.writeFileSync('src/app/s/[leadSlug]/page.tsx', code);
