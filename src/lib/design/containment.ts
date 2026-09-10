// The only stylesheet every generated page shares, and it carries no
// aesthetics at all — no colour, no type, no spacing, no layout.
//
// Scoping generated CSS to .bespoke-page stops it reaching OUT into the admin,
// the portal and the real site chrome. Nothing stops the host reaching IN: the
// portal and the Studio both ship a global reset whose element selectors
// (h1, ul, a, button) apply to everything inside the generated page. That is
// what pulled headers out of shape and washed text out, and a page could pass
// every check and still render wrong inside a host that restyled its anchors.
//
// :where() contributes no specificity, so each rule weighs exactly one class —
// enough to beat any host element selector, low enough that every rule the
// design system emits still wins.

export const CONTAINMENT = `
.bespoke-page :where(*,*::before,*::after){box-sizing:border-box}
.bespoke-page :where(h1,h2,h3,h4,h5,h6,p,figure,blockquote,dl,dd,ul,ol,li,fieldset){margin:0;padding:0;font-size:inherit;font-weight:inherit;line-height:inherit;color:inherit}
.bespoke-page :where(ul,ol){list-style:none}
.bespoke-page :where(a){color:inherit;text-decoration:none;background-image:none}
.bespoke-page :where(img,svg,video,canvas,picture){display:block;max-width:100%;height:auto;border:0}
.bespoke-page :where(button,input,select,textarea){font:inherit;color:inherit;letter-spacing:inherit;background:none;border:0;margin:0;border-radius:0;appearance:none;-webkit-appearance:none}
.bespoke-page :where(button){cursor:pointer;text-align:inherit}
.bespoke-page :where(table){border-collapse:collapse;border-spacing:0}
.bespoke-page :where(hr){border:0;margin:0}
.bespoke-page :where(strong,b){font-weight:700}
.bespoke-page :where(small){font-size:inherit}
`.trim();
