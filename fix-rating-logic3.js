const fs = require('fs');
const file = 'src/lib/audit/quality-gate.ts';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  /if \(\!brief\.rating && \/\\b\\d\(\\\.\\d\)\?\\s\*\(star\|★\)\/i\.test\(body\)\)/,
  'if (!brief.rating && /\\b([1-5](\\.[0-9])?\\s*(star|★)s?\\s*(rating|reviews?))/i.test(body))'
);

fs.writeFileSync(file, code);
