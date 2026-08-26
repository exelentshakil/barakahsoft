const fs = require('fs');
const file = 'src/components/landing/LandingIndustries.tsx';
let code = fs.readFileSync(file, 'utf8');

code = code.replace(
  /<div \n                  key=\{ind\.label\}[\s\S]*?<\/div>\n                <\/div>\n              \);\n            \}\)\}/,
  `<div 
                  key={ind.label} 
                  className="absolute left-1/2 top-1/2 flex h-0 w-0 items-center justify-center animate-[spin_20s_linear_infinite]"
                  style={{ animationDelay: ind.delay, animationDuration: duration }}
                >
                  <div style={{ transform: \`translateX(\${radius}px)\` }}>
                    <div 
                      className="flex h-[80px] w-[80px] flex-col items-center justify-center gap-1.5 rounded-full border border-white bg-white/90 shadow-md backdrop-blur-sm animate-[spin_20s_linear_infinite_reverse]"
                      style={{ animationDuration: duration }}
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

fs.writeFileSync(file, code);
