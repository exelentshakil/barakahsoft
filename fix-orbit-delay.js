const fs = require('fs');
const file = 'src/components/landing/LandingIndustries.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  /style=\{\{ animationDuration: duration \}\}/,
  'style={{ animationDelay: ind.delay, animationDuration: duration }}'
);

// Increase container height so orbits aren't clipped
code = code.replace(
  /h-\[400px\] max-w-\[800px\] overflow-hidden sm:h-\[500px\]/,
  'h-[500px] max-w-[800px] overflow-hidden sm:h-[650px]'
);

fs.writeFileSync(file, code);
