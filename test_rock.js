const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "src/components/mockup/SocialLaunchMockup.tsx");
let content = fs.readFileSync(filePath, "utf8");

const renderRockRegex = /const renderRockPedestalShowcase = \([\s\S]*?\)\s*=>\s*\([\s\S]*?<\/svg>\s*<\/div>\s*<\/div>\s*\);/;

content = content.replace(renderRockRegex, `const renderRockPedestalShowcase = (
    idPrefix = 'default',
    customScreenRef = screenRef,
    customScale = screenScale,
    containerClass = "w-[92%] max-w-[465px]",
    isExport = false,
    opts?: {
      cardTop?: string;
      cardRight?: string;
      widthClass?: string;
      macTranslateY?: string;
    }
  ) => (
    <div className={\`relative flex flex-col items-center justify-center \${containerClass} mx-auto perspective-[1600px]\`}>
      {/* 0. Layered Floating About Card Hovering BEHIND MacBook */}
      {renderFloatingAboutCard({
        topOffset: opts?.cardTop || "-top-16 sm:-top-20",
        rightOffset: opts?.cardRight || "-right-1 sm:-right-2",
        widthClass: opts?.widthClass,
        isExport,
      })}

      {/* 1. 3D MacBook Pro in Foreground */}
      {render3DMacBook(customScreenRef, customScale, isExport)}

      {/* 2. Sculpted Organic Mountain Slate Pedestal */}
      <div className="absolute z-10 top-[60%] sm:top-[65%] w-[125%] max-w-[620px] pointer-events-none" style={{ left: '50%', transform: 'translateX(-50%)' }}>
        <svg
          viewBox="0 0 680 180"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-auto drop-shadow-[0_30px_50px_rgba(0,0,0,0.65)]"
        >
          <defs>
            <linearGradient id={\`rockPlateau-\${idPrefix}\`} x1="0%" y1="0%" x2="100%" y2="80%">
              <stop offset="0%" stopColor="#4a5568" />
              <stop offset="35%" stopColor="#334155" />
              <stop offset="70%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>

            <linearGradient id={\`faceCenter-\${idPrefix}\`} x1="40%" y1="0%" x2="50%" y2="100%">
              <stop offset="0%" stopColor="#243044" />
              <stop offset="60%" stopColor="#141c2c" />
              <stop offset="100%" stopColor="#090d16" />
            </linearGradient>

            <linearGradient id={\`faceLeft-\${idPrefix}\`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#334155" />
              <stop offset="100%" stopColor="#0f172a" />
            </linearGradient>

            <linearGradient id={\`faceRight-\${idPrefix}\`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1e293b" />
              <stop offset="100%" stopColor="#050811" />
            </linearGradient>
          </defs>

          <ellipse cx="340" cy="155" rx="260" ry="22" fill="#000000" opacity="0.5" filter="blur(8px)" />

          <polygon points="60,65 140,140 540,140 620,65 570,38 110,38" fill={\`url(#faceCenter-\${idPrefix})\`} />
          <polygon points="60,65 140,140 250,148 220,68 110,38" fill={\`url(#faceLeft-\${idPrefix})\`} opacity="0.9" />
          <polygon points="220,68 250,148 440,148 460,68" fill={\`url(#faceCenter-\${idPrefix})\`} />
          <polygon points="460,68 440,148 540,140 620,65 570,38" fill={\`url(#faceRight-\${idPrefix})\`} opacity="0.95" />
          <polygon points="110,38 240,24 440,24 570,38 620,65 530,76 150,76 60,65" fill={\`url(#rockPlateau-\${idPrefix})\`} />
        </svg>
      </div>
    </div>
  );`);
  
fs.writeFileSync(filePath, content, "utf8");
