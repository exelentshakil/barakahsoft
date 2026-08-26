const fs = require('fs');
const file = 'src/lib/business-contact.ts';
let code = fs.readFileSync(file, 'utf8');

const sanitizeFn = `
function sanitizeEmail(candidate: string | null | undefined): string | null {
  if (!candidate) return null;
  const strVal = typeof candidate === 'string' ? candidate : String(candidate);
  const match = strVal.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}/);
  return match ? match[0].toLowerCase() : null;
}
`;

if (!code.includes('sanitizeEmail')) {
  code = code.replace(
    /function localBusinessSchema/,
    sanitizeFn + '\nfunction localBusinessSchema'
  );
  
  code = code.replace(
    /const email =[\s\S]*?null;/m,
    `const email =
    sanitizeEmail(str(schema.email)) ??
    sanitizeEmail(nap.emails?.find((candidate) => candidate.includes("@"))) ??
    sanitizeEmail(str(fallback.email)) ??
    null;`
  );
  
  fs.writeFileSync(file, code);
}
