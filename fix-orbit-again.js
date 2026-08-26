const fs = require('fs');
const file = 'src/components/landing/LandingIndustries.tsx';
let code = fs.readFileSync(file, 'utf8');

// Fix the center logo shadow
code = code.replace(
  /shadow-\[0_0_60px_rgba\(12,104,200,0\.3\)\]/,
  'shadow-none'
);

// To fix the counter-rotation so it stays perfectly upright, we need to pass a negative animation-delay
// to BOTH animations, but we can't use standard Tailwind for this without a custom style.
// Standard `animate-spin` rotates from 0deg to 360deg.
// Standard `animate-spin-reverse` (if it exists, we're using arbitrary `[spin_20s_linear_infinite_reverse]`)
// actually rotates from 0deg to -360deg.
// If the delays match exactly, they cancel out and it stays perfectly upright.
// Let's rewrite the orbit logic to use standard CSS keyframes in inline styles or properly scoped classes to guarantee it.

code = code.replace(
  /<div \n                  key=\{ind\.label\}[\s\S]*?<\/div>\n                <\/div>\n              \);\n            \}\)\}/,
  `<div 
                  key={ind.label} 
                  className="absolute left-1/2 top-1/2 flex h-0 w-0 items-center justify-center"
                  style={{ 
                    animation: \`spin \${duration} linear infinite\`,
                    animationDelay: ind.delay 
                  }}
                >
                  <div style={{ transform: \`translateX(\${radius}px)\` }}>
                    <div 
                      className="flex h-[80px] w-[80px] flex-col items-center justify-center gap-1.5 rounded-full border border-white bg-white/90 shadow-md backdrop-blur-sm"
                      style={{ 
                        animation: \`spin-reverse \${duration} linear infinite\`,
                        animationDelay: ind.delay 
                      }}
                    >
                      <div className={\`flex h-8 w-8 items-center justify-center rounded-full \${ind.bg} \${ind.color}\`}>
                        <ind.icon className="h-4 w-4" />
                      </div>
                      <span className="text-center text-[9px] font-bold leading-tight text-[#07284d] px-2">{ind.label}</span>
                    </div>
                  </div>
                </div>
              );
            })}`
);

// Also need to inject the spin-reverse keyframes if they aren't globally defined
code = code.replace(
  /export function LandingIndustries\(\) \{/,
  `export function LandingIndustries() {
  return (
    <>
      <style suppressHydrationWarning>{
        \`
        @keyframes spin-reverse {
          from { transform: rotate(0deg); }
          to { transform: rotate(-360deg); }
        }
        \`
      }</style>
      <section className="relative overflow-hidden border-t border-[#d9e8f4] bg-white py-24 lg:py-32">`
);

// Let's fix the extra closing tags we just messed up
code = code.replace(
  /<\/section>\n  \);\n\}/,
  `</section>
    </>
  );
}`
);


fs.writeFileSync(file, code);
