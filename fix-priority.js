const fs = require('fs');
const file = 'src/lib/business-contact.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  /fallback: \{ phone\?: string \| null; email\?: string \| null \} = \{\}/,
  'fallback: { phone?: string | null; email?: string | null } = {},\n  options: { forceFallback?: boolean } = {}'
);

code = code.replace(
  /const phone =[\s\S]*?null;/,
  `const phone = options.forceFallback
    ? str(fallback.phone) ?? str(places.phone) ?? str(schema.telephone) ?? nap.phones?.find(plausiblePhone) ?? null
    : str(places.phone) ?? str(schema.telephone) ?? nap.phones?.find(plausiblePhone) ?? str(fallback.phone) ?? null;`
);

code = code.replace(
  /const email =[\s\S]*?null;/,
  `const email = options.forceFallback
    ? sanitizeEmail(str(fallback.email)) ?? sanitizeEmail(str(schema.email)) ?? sanitizeEmail(nap.emails?.find((candidate) => candidate.includes("@"))) ?? null
    : sanitizeEmail(str(schema.email)) ?? sanitizeEmail(nap.emails?.find((candidate) => candidate.includes("@"))) ?? sanitizeEmail(str(fallback.email)) ?? null;`
);

fs.writeFileSync(file, code);
