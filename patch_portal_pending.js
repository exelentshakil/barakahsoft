const fs = require('fs');
let code = fs.readFileSync('src/components/portal/PortalPending.tsx', 'utf8');

code = code.replace(/import \{ PendingAutoRefresh \} from "@\/components\/portal\/PendingAutoRefresh";\n/, '');
code = code.replace(/<PendingAutoRefresh \/>/g, '');
code = code.replace(/<p className="mt-4 text-center text-xs text-\[#989db0\]">[\s\S]*?<\/p>/, '');

fs.writeFileSync('src/components/portal/PortalPending.tsx', code);
