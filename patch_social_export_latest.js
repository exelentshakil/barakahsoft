const fs = require("fs");
const path = require("path");

const filePath = path.join(__dirname, "src/components/mockup/SocialLaunchMockup.tsx");
let content = fs.readFileSync(filePath, "utf8");

// 1. Add isExporting state
content = content.replace(
  /const \[downloading, setDownloading\] = useState<string \| null>\(null\);/,
  `const [downloading, setDownloading] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);`
);

// 2. Rewrite downloadImage
content = content.replace(
  /async function downloadImage[\s\S]*?\} finally \{[\s\S]*?\}[\s\S]*?\}/,
  `async function downloadImage() {
    setDownloading("mockup");
    setIsExporting(true);
    try {
      // wait for React to re-render with isExporting=true to strip problematic 3D transforms for html-to-image
      await new Promise(resolve => setTimeout(resolve, 100));

      const targetEl = mockupRef.current;
      if (!targetEl) {
        throw new Error("Target export element not mounted.");
      }

      await prepareElementForExport(targetEl);

      const dataUrl = await toPng(targetEl, {
        cacheBust: true,
        pixelRatio: 3,
        filter: (node) => {
          if (node.tagName && node.tagName.toUpperCase() === "IFRAME") return false;
          return true;
        },
      });

      const cleanName = businessShortName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
      const filename = \`\${cleanName}-mockup-hq.png\`;

      const link = document.createElement("a");
      link.download = filename;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Failed to download mockup:", err);
    } finally {
      setIsExporting(false);
      setDownloading(null);
    }
  }`
);

// 3. Update the render functions to use isExporting instead of false
// Wait, currently they are called like:
// renderRockPedestalShowcase('preview', screenRef, screenScale, "w-[92%] max-w-[465px]", false, ...)
// We should change that to isExporting
content = content.replace(
  /renderRockPedestalShowcase\('preview', screenRef, screenScale, "w-\[92%\] max-w-\[465px\]", false,/g,
  `renderRockPedestalShowcase('preview', screenRef, screenScale, "w-[92%] max-w-[465px]", isExporting,`
);

content = content.replace(
  /renderFloatingAboutCard\(\{ topOffset: "-top-12 sm:-top-16", rightOffset: "-right-1 sm:-right-2" \}\)/g,
  `renderFloatingAboutCard({ topOffset: "-top-12 sm:-top-16", rightOffset: "-right-1 sm:-right-2", isExport: isExporting })`
);

content = content.replace(
  /render3DMacBook\(\)/g,
  `render3DMacBook(screenRef, screenScale, isExporting)`
);

// 4. Restore the rock rim highlight in svg defs
content = content.replace(
  /<linearGradient id={`faceCenter-\${idPrefix}`} x1="40%" y1="0%" x2="50%" y2="100%">/,
  `{/* Rim Highlight */}
            <linearGradient id={\`rockRim-\${idPrefix}\`} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.7)" />
              <stop offset="30%" stopColor="rgba(255,255,255,0.3)" />
              <stop offset="70%" stopColor="rgba(255,255,255,0.6)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0.15)" />
            </linearGradient>

            {/* Main Chiseled Front Face */}
            <linearGradient id={\`faceCenter-\${idPrefix}\`} x1="40%" y1="0%" x2="50%" y2="100%">`
);

// 5. Restore the stroke and ridge lines on the rock
content = content.replace(
  /fill=\{\`url\(#rockPlateau-\$\{idPrefix\}\)\`\}\s*\/>\s*<\/svg>/,
  `fill={\`url(#rockPlateau-\${idPrefix})\`}
            stroke={\`url(#rockRim-\${idPrefix})\`}
            strokeWidth="1.75"
          />

          {/* Subtle Chiseled Ridge Lines */}
          <path d="M 220,68 L 250,148" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M 460,68 L 440,148" stroke="rgba(0,0,0,0.5)" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M 330,75 L 345,145" stroke="rgba(0,0,0,0.4)" strokeWidth="1.2" strokeLinecap="round" />
        </svg>`
);

// 6. Delete the hidden feed, landscape, story containers
content = content.replace(
  /\{\/\* Hidden 4:5 Feed HQ Container[\s\S]*?\{\/\* Control Panel \*\/\}/,
  `{/* Control Panel */}`
);

// 7. Update export buttons
content = content.replace(
  /<div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">[\s\S]*?<\/div>\s*<\/div>\s*\)\}\s*<\/div>\s*\);\s*\}/,
  `<div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-end gap-2">
            <Button
              type="button"
              size="sm"
              disabled={Boolean(downloading)}
              onClick={() => downloadImage()}
              className="gap-1.5 text-xs font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm px-6"
            >
              <Download className="h-3.5 w-3.5" />
              {downloading ? "Exporting HQ..." : "Export HQ for Socials"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}`
);


fs.writeFileSync(filePath, content, "utf8");
console.log("Patched successfully");
