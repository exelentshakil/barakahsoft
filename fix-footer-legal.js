const fs = require('fs');
const file = 'src/components/site-shell/BespokeFooter.tsx';
let code = fs.readFileSync(file, 'utf8');

// The overlapping is because the email string might be long, breaking flex, or missing margin
code = code.replace(
  /<span>\{payload\.nap\.email\}<\/span>/g,
  '<span className="break-all line-clamp-2">{payload.nap.email}</span>'
);

fs.writeFileSync(file, code);
