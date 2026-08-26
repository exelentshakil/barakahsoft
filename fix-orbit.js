const fs = require('fs');
const file = 'src/components/landing/LandingIndustries.tsx';
let code = fs.readFileSync(file, 'utf8');

// Fix the orbit center
code = code.replace(
  /<div className="absolute left-1\/2 top-1\/2 flex h-24 w-24 -translate-x-1\/2 -translate-y-1\/2 items-center justify-center rounded-full bg-gradient-to-tr from-\[#0c68c8\] to-\[#043366\] shadow-\[0_0_60px_rgba\(12,104,200,0\.5\)\] z-20">[\s\S]*?<\/div>/,
  `<div className="absolute left-1/2 top-1/2 flex h-24 w-24 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white shadow-[0_0_60px_rgba(12,104,200,0.3)] z-20 overflow-hidden border border-[#e2e8f0]">
            <img src="https://redesign.barakahsoft.com/icon.png" alt="BarakahSoft" className="h-16 w-16 object-contain" />
          </div>`
);

// Fix the spinning math. To orbit without rotating the contents relative to the page:
// Outer container spins clockwise. Inner container spins counter-clockwise at the same speed.
// Using left-1/2 top-1/2 and applying transform: rotate(Xdeg) translateX(R) rotate(-Xdeg)
// is cleaner with CSS variables but we can do it with standard Tailwind if we structure the DOM right.

// The issue in the current code is that `-ml-[40px] -mt-[40px]` combined with `left-[50%]` and `top-[calc(...)]`
// means the orbit center is wrong, so they look like they're falling rather than orbiting the center.
// For a proper orbit:
// 1. Container at exactly 50% 50% (the sun's center)
// 2. Container rotates 0->360
// 3. Child translates X by the radius
// 4. Child rotates 360->0 to stay upright

code = code.replace(
  /<div className="absolute inset-0">[\s\S]*?<\/div>\n        <\/div>/,
  `<div className="absolute inset-0">
            {INDUSTRIES.map((ind) => {
              // Radiuses match the rings: 100px, 160px, 230px, 300px
              const radius = ind.orbit === 'orbit-1' ? 100 : ind.orbit === 'orbit-2' ? 160 : ind.orbit === 'orbit-3' ? 230 : 300;
              const duration = ind.orbit === 'orbit-1' ? '15s' : ind.orbit === 'orbit-2' ? '25s' : ind.orbit === 'orbit-3' ? '35s' : '45s';
              
              return (
                <div 
                  key={ind.label} 
                  className="absolute left-1/2 top-1/2 flex h-0 w-0 items-center justify-center animate-[spin_20s_linear_infinite]"
                  style={{ animationDelay: ind.delay, animationDuration: duration }}
                >
                  <div 
                    className="flex h-[80px] w-[80px] flex-col items-center justify-center gap-1.5 rounded-full border border-white bg-white/90 shadow-md backdrop-blur-sm animate-[spin_20s_linear_infinite_reverse]"
                    style={{ 
                      animationDuration: duration,
                      transform: \`translateX(\${radius}px)\`
                    }}
                  >
                    <div className={\`flex h-8 w-8 items-center justify-center rounded-full \${ind.bg} \${ind.color}\`}>
                      <ind.icon className="h-4 w-4" />
                    </div>
                    <span className="text-center text-[9px] font-bold leading-tight text-[#07284d] px-2">{ind.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>`
);

fs.writeFileSync(file, code);
