const fs = require('fs');
const file = 'src/components/site-shell/BespokeFooter.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  /<div className="bs-footer-badges">[\s\S]*?<\/div>/m,
  `<div className="bs-footer-badges">
                <span className="bs-footer-badge">
                  <Clock className="h-3.5 w-3.5 text-emerald-400" /> 
                  {payload.industry && !payload.industry.match(/plumb|hvac|electric|roof|water|fire|damage|restore|pest|locksmith|glass/i) 
                    ? "Fast & Reliable Service" 
                    : "24/7 Emergency Response"}
                </span>
                {payload.licensedInsured && (
                  <span className="bs-footer-badge">
                    <ShieldCheck className="h-3.5 w-3.5 text-blue-400" /> Licensed &amp; Insured
                  </span>
                )}
              </div>`
);

// Also remove `(payload as any).industry` and just use `payload.industry`
code = code.replace(/\(payload as any\)\.industry/g, 'payload.industry');

fs.writeFileSync(file, code);
