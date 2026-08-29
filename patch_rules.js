const fs = require('fs');
const pathStruct = './src/lib/generate/structure.ts';
const pathStyle = './src/lib/generate/stylesheet.ts';

// 1. Patch Structure (HTML) to guarantee Hero/About layouts and Buttons
let structContent = fs.readFileSync(pathStruct, 'utf8');

const heroAboutGuardrails = `
5. HERO EXCELLENCE: The Hero section is the highest-value part of the page. It MUST use a massive, premium layout (e.g. min-height: 90vh). The background image MUST cover the entire area with a dark overlay, and the main call-to-action button MUST use the exact classes 'site-cta site-cta--primary'.
6. ABOUT SECTION ELEGANCE: The About section must look like an editorial magazine. NEVER stack text directly under an image. Use a strict 2-column layout (grid-cols-1 lg:grid-cols-2) where the image spans the full height of the column on one side, and the text breathes with massive padding on the other.
7. CTA BUTTONS: Every single primary button on the page MUST use the exact classes 'site-cta site-cta--primary'. Do not invent custom button classes.
`;

structContent = structContent.replace(
  '4. SERVICE CARDS MUST USE IMAGES: Every service and service area card MUST use an image. Do not use generic icons if images are mapped to that section. Each card must have a top image (h-48 object-cover), a title, and a clear call-to-action button or link.',
  '4. SERVICE CARDS MUST USE IMAGES: Every service and service area card MUST use an image. Do not use generic icons if images are mapped to that section. Each card must have a top image (h-48 object-cover), a title, and a clear call-to-action button or link.\n' + heroAboutGuardrails
);
fs.writeFileSync(pathStruct, structContent);


// 2. Patch Stylesheet (CSS) to prevent the color variables crash and ensure Hero height
let styleContent = fs.readFileSync(pathStyle, 'utf8');

const cssGuardrails = `
5. VARIABLE RULES (CRITICAL): NEVER use 'color: var(--bs-primary)' for text or links. '--bs-primary' is a background fill color. For text that matches the brand color, you MUST use 'color: var(--bs-primary-on-surface)'.
6. HERO HEIGHT: The #hero section MUST have 'min-height: clamp(80vh, 800px, 100vh); display: flex; align-items: center;' to ensure it looks massive and breathtaking above the fold.
7. ABOUT SECTION: The .about section MUST use 'display: grid; align-items: stretch;' on desktop so the image perfectly matches the height of the text column.
`;

styleContent = styleContent.replace(
  '4. Grid/Flexbox Balance: When building asymmetric layouts (like 1 large image on the left, 4 smaller cards on the right), the columns MUST balance perfectly. Use CSS Grid (grid-template-columns: 1fr 1fr) or Flexbox (align-items: stretch). If an image is in a flex column, it must have height: 100%; object-fit: cover; so it perfectly matches the height of the adjacent column.',
  '4. Grid/Flexbox Balance: When building asymmetric layouts (like 1 large image on the left, 4 smaller cards on the right), the columns MUST balance perfectly. Use CSS Grid (grid-template-columns: 1fr 1fr) or Flexbox (align-items: stretch). If an image is in a flex column, it must have height: 100%; object-fit: cover; so it perfectly matches the height of the adjacent column.\n' + cssGuardrails
);
fs.writeFileSync(pathStyle, styleContent);

