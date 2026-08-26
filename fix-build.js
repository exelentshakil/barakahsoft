const fs = require('fs');
const file = 'src/components/admin/AdminLeadWorkspace.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  /const city = typeof nap\.address === "string"/,
  'const nap = (facts.nap as { address?: string } | undefined) ?? {};\n    const city = typeof nap.address === "string"'
);

fs.writeFileSync(file, code);
