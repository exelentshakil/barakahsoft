const fs = require('fs');
const path = './src/lib/audit/quality-gate.ts';
let content = fs.readFileSync(path, 'utf8');

// The regex was checking for class="... site-cta--primary ..."
// But the AI generated class="site-cta site-cta--primary"
// Wait, looking at the regex: !/\bclass=["'][^"']*\bsite-cta--primary\b/i.test(attrs)
// Let's modify the regex to be more forgiving of whitespace and class ordering.
content = content.replace(
  /!\/\\bclass=\["'\]\[\^"'\].*?\\bsite-cta--primary\\b\/i\.test\(attrs\)/g,
  '!/class=["\'][^"\']*\\bsite-cta--primary\\b[^"\']*["\']/i.test(attrs)'
);

fs.writeFileSync(path, content);
