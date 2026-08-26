const fs = require('fs');
const file = 'src/lib/business-contact.ts';
let code = fs.readFileSync(file, 'utf8');

const newFn = `function sanitizeEmail(candidate: string | null | undefined): string | null {
  if (!candidate) return null;
  const strVal = typeof candidate === 'string' ? candidate : String(candidate);
  const match = strVal.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.(com|org|net|co|io|us|uk|ca|au|biz|info|tv|app|dev|me|site|tech|agency|studio|services|construction|plumbing|roofing)/i);
  return match ? match[0].toLowerCase() : null;
}`;

code = code.replace(
  /function sanitizeEmail[\s\S]*?return match \? match\[0\]\.toLowerCase\(\) : null;\n\}/,
  newFn
);

fs.writeFileSync(file, code);
