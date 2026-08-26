const fs = require('fs');
const file = 'src/components/admin/OutreachSequencePanel.tsx';
let code = fs.readFileSync(file, 'utf8');

const sanitizeFn = `function sanitizeEmail(candidate: string | null | undefined): string | null {
  if (!candidate) return null;
  const match = String(candidate).match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.(com|org|net|co|io|us|uk|ca|au|biz|info|tv|app|dev|me|site|tech|agency|studio|services|construction|plumbing|roofing)/i);
  return match ? match[0].toLowerCase() : null;
}
`;

if (!code.includes('sanitizeEmail')) {
  code = code.replace(
    /export function OutreachSequencePanel/,
    sanitizeFn + '\nexport function OutreachSequencePanel'
  );
  
  code = code.replace(
    /const ready = Boolean\(lead\.email\)/g,
    'const cleanEmail = sanitizeEmail(lead.email);\n              const ready = Boolean(cleanEmail)'
  );
  
  code = code.replace(
    /const why = \!lead\.email/g,
    'const why = !cleanEmail'
  );
  
  code = code.replace(
    /\{lead\.email \|\| lead\.source_url\}/g,
    '{cleanEmail || lead.source_url}'
  );
}

fs.writeFileSync(file, code);
