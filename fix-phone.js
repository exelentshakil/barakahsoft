const fs = require('fs');
const file = 'src/lib/business-contact.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  /return digits\.length >= 7 && digits\.length <= 15;/,
  `// A 13-15 digit unbroken number is almost always a pixel ID or tracking token.
  // Standard US numbers are 10-11 digits. International are usually 11-12.
  if (digits.length > 12 && !candidate.includes('+')) return false;
  return digits.length >= 7 && digits.length <= 15;`
);

fs.writeFileSync(file, code);
