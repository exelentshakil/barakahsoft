const fs = require("fs");
const path = "./src/components/mockup/SocialLaunchMockup.tsx";
let code = fs.readFileSync(path, "utf8");

// 1. Update renderScreenContent to accept isExport
code = code.replace(
  /const renderScreenContent = \(customScale = screenScale\) => \{/g,
  "const renderScreenContent = (customScale = screenScale, isExport = false) => {"
);

code = code.replace(
  /if \(data\.previewUrl\) \{/g,
  "if (data.previewUrl && !isExport) {"
);

// 2. Update render3DMacBook to accept isExport
code = code.replace(
  /const render3DMacBook = \(customScreenRef = screenRef, customScale = screenScale\) => \(/g,
  "const render3DMacBook = (customScreenRef = screenRef, customScale = screenScale, isExport = false) => ("
);
code = code.replace(
  /\{renderScreenContent\(customScale\)\}/g,
  "{renderScreenContent(customScale, isExport)}"
);

// 3. Update renderRockPedestalShowcase to accept isExport
code = code.replace(
  /const renderRockPedestalShowcase = \(\n    idPrefix = 'default',\n    customScreenRef = screenRef,\n    customScale = screenScale,\n    containerClass = "w-\[92%\] max-w-\[465px\]",/g,
  `const renderRockPedestalShowcase = (
    idPrefix = 'default',
    customScreenRef = screenRef,
    customScale = screenScale,
    containerClass = "w-[92%] max-w-[465px]",
    isExport = false,`
);

code = code.replace(
  /<div\n\s*ref=\{customScreenRef\}\n\s*className="relative aspect-\[16\/10\] w-full rounded-lg bg-\[#0e1626\] overflow-hidden shadow-inner border border-black\/90 flex flex-col"\n\s*>\n\s*\{renderScreenContent\(customScale\)\}/g,
  `<div
            ref={customScreenRef}
            className="relative aspect-[16/10] w-full rounded-lg bg-[#0e1626] overflow-hidden shadow-inner border border-black/90 flex flex-col"
          >
            {renderScreenContent(customScale, isExport)}`
);

// replace any remaining in case
code = code.replace(
  /\{renderScreenContent\(customScale\)\}/g,
  "{renderScreenContent(customScale, isExport)}"
);

// 4. Update calls to renderRockPedestalShowcase
code = code.replace(
  /renderRockPedestalShowcase\('preview', screenRef, screenScale, "w-\[92%\] max-w-\[465px\]", \{/g,
  `renderRockPedestalShowcase('preview', screenRef, screenScale, "w-[92%] max-w-[465px]", false, {`
);
code = code.replace(
  /renderRockPedestalShowcase\('feed', feedScreenRef, 0\.65, "w-\[840px\]", \{/g,
  `renderRockPedestalShowcase('feed', feedScreenRef, 0.65, "w-[840px]", true, {`
);
code = code.replace(
  /renderRockPedestalShowcase\('landscape', landscapeScreenRef, 0\.38, "w-\[500px\]", \{/g,
  `renderRockPedestalShowcase('landscape', landscapeScreenRef, 0.38, "w-[500px]", true, {`
);
code = code.replace(
  /renderRockPedestalShowcase\('story', storyScreenRef, 0\.45, "w-\[92%\] max-w-\[460px\]", \{/g,
  `renderRockPedestalShowcase('story', storyScreenRef, 0.45, "w-[92%] max-w-[460px]", true, {`
);

// 5. Update calls to render3DMacBook
code = code.replace(
  /\{render3DMacBook\(feedScreenRef, 0\.65\)\}/g,
  "{render3DMacBook(feedScreenRef, 0.65, true)}"
);
code = code.replace(
  /\{render3DMacBook\(landscapeScreenRef, 0\.38\)\}/g,
  "{render3DMacBook(landscapeScreenRef, 0.38, true)}"
);
code = code.replace(
  /\{render3DMacBook\(storyScreenRef, 0\.45\)\}/g,
  "{render3DMacBook(storyScreenRef, 0.45, true)}"
);

fs.writeFileSync(path, code);
