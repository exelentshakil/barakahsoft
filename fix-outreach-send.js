const fs = require('fs');
const file = 'src/app/api/outreach/send/route.ts';
let code = fs.readFileSync(file, 'utf8');

const sanitizeFn = `function sanitizeEmail(candidate: string | null | undefined): string | null {
  if (!candidate) return null;
  const match = String(candidate).match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.(com|org|net|co|io|us|uk|ca|au|biz|info|tv|app|dev|me|site|tech|agency|studio|services|construction|plumbing|roofing)/i);
  return match ? match[0].toLowerCase() : null;
}
`;

if (!code.includes('sanitizeEmail')) {
  code = code.replace(
    /export async function POST/,
    sanitizeFn + '\nexport async function POST'
  );
  
  code = code.replace(
    /to: lead\.email,/,
    'to: sanitizeEmail(lead.email) || lead.email,'
  );
}

fs.writeFileSync(file, code);
