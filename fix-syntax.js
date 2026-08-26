const fs = require('fs');
const file = 'src/components/landing/LandingIndustries.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  /<section className="relative overflow-hidden border-t border-\[#d9e8f4\] bg-white py-24 lg:py-32">\n  return \(\n    <section className="relative overflow-hidden border-t border-\[#d9e8f4\] bg-white py-24 lg:py-32">/,
  '<section className="relative overflow-hidden border-t border-[#d9e8f4] bg-white py-24 lg:py-32">'
);

fs.writeFileSync(file, code);
