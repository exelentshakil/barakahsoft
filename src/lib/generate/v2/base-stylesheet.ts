// The design system, hand-written and owned by the application.
//
// It used to be generated: one Pro call was asked for the whole stylesheet on
// every build. That made quality a lottery — one build shipped mega-menu
// panels rendered open down the top of the page, a hero that never filled the
// screen and a type scale that stayed polite, and the only way to find out was
// to look at the result. A model asked to invent six hundred lines of CSS from
// a description will get some of them wrong every single time.
//
// So the model no longer writes CSS. It chooses the palette, the typefaces and
// the composition; this file turns those choices into a page. Variation comes
// from archetype modifier classes (.bs-hero--split-form, .bs-about--overlap-card
// and so on) that are implemented here, so two leads get genuinely different
// layouts out of the same guaranteed-correct system.
//
// Every value derives from the --bs-* custom properties emitted before it, and
// every one of them has a literal fallback, so a missing token degrades to
// something plausible instead of to nothing.

export const BASE_STYLESHEET = `
/* ---------- foundation ------------------------------------------------- */
.bespoke-page{
  --bs-max:1360px;
  --bs-gutter:clamp(20px,4vw,48px);
  --bs-r:12px;
  --bs-r-lg:20px;
  --bs-shadow:0 18px 48px rgb(0 0 0 / .13);
  --bs-shadow-lg:0 32px 80px rgb(0 0 0 / .22);
  --bs-line:rgb(0 0 0 / .10);
  --bs-muted:rgb(0 0 0 / .62);
  color:var(--bs-ink,#16181d);
  background:var(--bs-surface,#fff);
  font-family:var(--bs-font-body,ui-sans-serif,system-ui,sans-serif);
  font-size:17px;
  line-height:1.65;
  -webkit-font-smoothing:antialiased;
}
.bespoke-page *,.bespoke-page *::before,.bespoke-page *::after{box-sizing:border-box}
/* Explicit, and not negotiable: an overflow guard here clips the mega-menu
   panel, which is absolutely positioned and must escape the nav's box. The
   page is kept inside the viewport by sizing individual elements instead. */
.bespoke-page{overflow:visible}
/* The application's legacy stylesheet paints every strong element with the ink
   token, which turned the "4.9" inside the hero rating near-black on a dark
   photograph. Emphasis inherits its context's colour, everywhere. */
.bespoke-page [class*="bs-"] strong,.bespoke-page [class*="bs-"] b{color:inherit}
/* The closed mobile drawer is translated off-screen right, which on mobile
   browsers extends the scrollable area and gives the whole site a horizontal
   scrollbar. Taking it out of layout entirely while closed fixes that without
   an overflow guard that would clip the mega menu. */
.bespoke-page [data-nav-drawer]{visibility:hidden}
.bespoke-page [data-nav-drawer][data-open=true]{visibility:visible}
.bespoke-page p,.bespoke-page h1,.bespoke-page h2,.bespoke-page h3,.bespoke-page h4,.bespoke-page ul,.bespoke-page ol,.bespoke-page figure{margin:0}
.bespoke-page ul,.bespoke-page ol{padding:0;list-style:none}
.bespoke-page img,.bespoke-page svg{max-width:100%}
.bespoke-page a{color:inherit;text-decoration:none}

/* ---------- layout ----------------------------------------------------- */
.bespoke-page .bs-section,.bespoke-page .bs-trustbar{scroll-margin-top:120px}
.bespoke-page .bs-section{position:relative;padding:clamp(56px,7vw,112px) 0;background:var(--bs-surface,#fff)}
.bespoke-page .bs-section--tint{background:var(--bs-surface-alt,#f4f5f7)}
.bespoke-page .bs-section--ink{background:var(--bs-ink,#16181d);color:#fff}
.bespoke-page .bs-section--ink .bs-lede,.bespoke-page .bs-section--ink .bs-body,.bespoke-page .bs-section--ink .bs-small{color:rgb(255 255 255 / .78)}
.bespoke-page .bs-section--ink .bs-card{background:rgb(255 255 255 / .06);border-color:rgb(255 255 255 / .14);color:#fff}
.bespoke-page .bs-section--flush{padding:0}
.bespoke-page .bs-container{width:100%;max-width:var(--bs-max);margin-inline:auto;padding-inline:var(--bs-gutter)}
.bespoke-page .bs-container--narrow{max-width:760px}
.bespoke-page .bs-split{display:grid;grid-template-columns:1fr 1fr;gap:clamp(32px,5vw,72px);align-items:center}
.bespoke-page .bs-split--wide-left{grid-template-columns:1.25fr 1fr}
.bespoke-page .bs-split--wide-right{grid-template-columns:1fr 1.25fr}
.bespoke-page .bs-grid-2{display:grid;grid-template-columns:repeat(2,1fr);gap:clamp(18px,2vw,28px)}
.bespoke-page .bs-grid-3{display:grid;grid-template-columns:repeat(3,1fr);gap:clamp(18px,2vw,28px)}
.bespoke-page .bs-grid-4{display:grid;grid-template-columns:repeat(4,1fr);gap:clamp(16px,1.6vw,24px)}
.bespoke-page .bs-stack{display:flex;flex-direction:column;gap:clamp(18px,2vw,26px);align-items:flex-start}
.bespoke-page .bs-stack--tight{gap:12px}
.bespoke-page .bs-row{display:flex;flex-wrap:wrap;gap:16px;align-items:center}
.bespoke-page .bs-row--between{justify-content:space-between;width:100%}
.bespoke-page .bs-overlap-up{margin-top:clamp(-140px,-9vw,-64px);position:relative;z-index:4}
.bespoke-page .bs-bleed{width:100vw;margin-left:calc(50% - 50vw)}
.bespoke-page .bs-center{text-align:center}
.bespoke-page .bs-center .bs-stack{align-items:center}
.bespoke-page .bs-center .bs-actions{justify-content:center}
.bespoke-page .bs-hide-desktop{display:none}

/* ---------- type ------------------------------------------------------- */
.bespoke-page .bs-display,.bespoke-page .bs-h2,.bespoke-page .bs-h3,.bespoke-page .bs-h4{
  font-family:var(--bs-font-display,ui-sans-serif,system-ui,sans-serif);
  font-weight:var(--bs-display-weight,800);
  line-height:1.02;
  letter-spacing:-.03em;
  overflow-wrap:break-word;
  text-wrap:balance;
}
.bespoke-page .bs-display{font-size:clamp(2.9rem,6vw,5.4rem);line-height:.98;text-transform:var(--bs-heading-transform,none)}
.bespoke-page .bs-h2{font-size:clamp(2rem,3.6vw,3.2rem)}
.bespoke-page .bs-h3{font-size:clamp(1.3rem,1.8vw,1.65rem);line-height:1.15}
.bespoke-page .bs-h4{font-size:1.05rem;line-height:1.25;letter-spacing:-.01em}
.bespoke-page .bs-mark{color:var(--bs-primary,#e4761b)}
.bespoke-page .bs-section--ink .bs-mark{color:var(--bs-accent,#e4761b)}
.bespoke-page .bs-lede{font-size:clamp(1.05rem,1.3vw,1.22rem);line-height:1.6;color:var(--bs-muted);max-width:62ch}
.bespoke-page .bs-body{color:var(--bs-muted);max-width:66ch}
.bespoke-page .bs-small{font-size:.83rem;color:var(--bs-muted)}
.bespoke-page .bs-eyebrow{
  display:inline-flex;align-items:center;gap:10px;
  font-size:.76rem;font-weight:800;letter-spacing:.14em;text-transform:uppercase;
  color:var(--bs-primary,#e4761b);
}
.bespoke-page .bs-eyebrow::before{content:"";width:26px;height:3px;background:currentColor;flex:none}
.bespoke-page .bs-eyebrow--chip{
  background:var(--bs-accent-strong,var(--bs-accent,#c1273c));color:var(--bs-on-accent,#fff);padding:9px 16px;border-radius:4px;letter-spacing:.12em;
}
.bespoke-page .bs-eyebrow--chip::before{display:none}
.bespoke-page .bs-section--ink .bs-eyebrow{color:var(--bs-accent,#e4761b)}
.bespoke-page .bs-quote{
  font-family:var(--bs-font-display,serif);font-size:clamp(1.5rem,2.6vw,2.35rem);line-height:1.22;
  letter-spacing:-.02em;border-left:4px solid var(--bs-primary,#e4761b);padding-left:clamp(20px,2vw,32px);
}
.bespoke-page .bs-signature{font-style:italic;font-size:1.15rem;color:var(--bs-muted)}

/* ---------- actions ---------------------------------------------------- */
.bespoke-page .bs-btn{
  display:inline-flex;align-items:center;justify-content:center;gap:10px;
  background:var(--bs-primary-strong,var(--bs-primary,#e4761b));color:var(--bs-on-primary,#fff);
  font-family:var(--bs-font-display,inherit);font-weight:800;font-size:.95rem;letter-spacing:.02em;
  padding:17px 30px;border:0;border-radius:var(--bs-r);cursor:pointer;white-space:nowrap;
  box-shadow:0 10px 24px rgb(0 0 0 / .16);
  transition:transform .18s ease,box-shadow .18s ease,filter .18s ease;
}
.bespoke-page .bs-btn:hover{transform:translateY(-2px);box-shadow:0 16px 34px rgb(0 0 0 / .22);filter:brightness(1.05)}
.bespoke-page .bs-btn:focus-visible,.bespoke-page a:focus-visible,.bespoke-page button:focus-visible{outline:3px solid var(--bs-accent,#c1273c);outline-offset:3px}
.bespoke-page .bs-btn--ghost{background:transparent;color:inherit;border:2px solid currentColor;box-shadow:none}
.bespoke-page .bs-btn--ghost:hover{background:currentColor;color:var(--bs-surface,#fff);filter:none}
/* On a brand or ink band this button sits on white, so its text must be ink
   explicitly — inheriting the band's white was why "Need a roof inspection?"
   rendered as an empty white pill. */
.bespoke-page .bs-btn--light{background:#fff!important;color:var(--bs-ink,#16181d)!important;box-shadow:0 10px 24px rgb(0 0 0 / .18)}
.bespoke-page .bs-btn--light:hover{background:#fff!important;color:var(--bs-primary-strong,#e4761b)!important;filter:none}
.bespoke-page .bs-section--brand .bs-btn,.bespoke-page .bs-footer-cta .bs-btn{background:#fff;color:var(--bs-ink,#16181d)}
.bespoke-page .bs-section--brand .bs-btn:hover,.bespoke-page .bs-footer-cta .bs-btn:hover{color:var(--bs-primary-strong,#e4761b)}
.bespoke-page .bs-btn--wide{width:100%}
.bespoke-page .bs-actions{display:flex;flex-wrap:wrap;gap:14px;align-items:center}
.bespoke-page .bs-link-call{display:inline-flex;align-items:center;gap:9px;font-weight:800;font-size:1.02rem;white-space:nowrap}
.bespoke-page .bs-link-call:hover{color:var(--bs-primary,#e4761b)}

/* ---------- surfaces --------------------------------------------------- */
.bespoke-page .bs-card{
  background:var(--bs-surface,#fff);border:1px solid var(--bs-line);border-radius:var(--bs-r);
  padding:clamp(22px,2.4vw,32px);box-shadow:var(--bs-shadow);
  transition:transform .22s ease,box-shadow .22s ease;
}
.bespoke-page .bs-card:hover{transform:translateY(-4px);box-shadow:var(--bs-shadow-lg)}
.bespoke-page .bs-card--flat{box-shadow:none}
.bespoke-page .bs-card--flat:hover{transform:none;box-shadow:none;border-color:var(--bs-primary,#e4761b)}
.bespoke-page .bs-card--ink{background:var(--bs-ink,#16181d);color:#fff;border-color:rgb(255 255 255 / .12)}
.bespoke-page .bs-panel{background:var(--bs-surface,#fff);border-radius:var(--bs-r-lg);box-shadow:var(--bs-shadow-lg);padding:clamp(26px,3vw,48px)}
.bespoke-page .bs-media{position:relative;overflow:hidden;border-radius:var(--bs-r);background:var(--bs-surface-alt,#eee);aspect-ratio:4/3}
.bespoke-page .bs-media>img{width:100%;height:100%;object-fit:cover;display:block}
.bespoke-page .bs-media--tall{aspect-ratio:3/4}
.bespoke-page .bs-media--wide{aspect-ratio:16/9}
.bespoke-page .bs-media--square{aspect-ratio:1/1}
.bespoke-page .bs-collage{display:grid;grid-template-columns:1.3fr 1fr;grid-template-rows:1fr 1fr;gap:10px}
.bespoke-page .bs-collage>*:first-child{grid-row:span 2}
.bespoke-page .bs-badge{
  display:inline-flex;align-items:center;gap:8px;font-size:.78rem;font-weight:700;letter-spacing:.04em;
  text-transform:uppercase;padding:8px 14px;border-radius:999px;border:1px solid var(--bs-line);white-space:nowrap;
}
.bespoke-page .bs-section--ink .bs-badge{border-color:rgb(255 255 255 / .22)}
.bespoke-page .bs-chip{display:inline-flex;align-items:center;gap:7px;font-size:.85rem;font-weight:600;padding:7px 12px;border-radius:6px;background:var(--bs-surface-alt,#f4f5f7)}
/* Four fixed columns left two stats floating in half a section of white. */
/* An explicit column count, not auto-fit.
   auto-fit with a max-width cap looked right and was not: the cap counted the
   columns but not the gaps between them, so four 180px stats needed 804px and
   were allowed 784 — one dropped to a second row on its own, every time. */
.bespoke-page .bs-stats{display:grid;grid-template-columns:repeat(var(--stat-cols,4),minmax(0,1fr));gap:clamp(14px,1.6vw,22px)}
.bespoke-page .bs-stats[data-count="2"]{--stat-cols:2;max-width:640px;margin-inline:auto}
.bespoke-page .bs-stats[data-count="3"]{--stat-cols:3}
.bespoke-page .bs-stats[data-count="4"]{--stat-cols:4}
.bespoke-page .bs-stat{
  position:relative;display:flex;flex-direction:column;align-items:center;gap:6px;text-align:center;
  padding:clamp(20px,2.2vw,30px) 16px;border-radius:var(--bs-r);
  background:var(--bs-surface,#fff);border:1px solid var(--bs-line);
  transition:transform .2s ease,box-shadow .2s ease,border-color .2s ease;
}
.bespoke-page .bs-stat:hover{transform:translateY(-3px);box-shadow:var(--bs-shadow);border-color:color-mix(in srgb,var(--bs-primary-strong,#e4761b) 45%,transparent)}
.bespoke-page .bs-stat__icon{
  display:grid;place-items:center;width:44px;height:44px;border-radius:999px;margin-bottom:2px;
  background:color-mix(in srgb,var(--bs-primary-strong,#e4761b) 12%,#fff);
  color:var(--bs-primary-strong,#e4761b);
}
.bespoke-page .bs-stat__icon .bs-icon{width:21px;height:21px}
.bespoke-page .bs-stat__value{
  display:block;font-family:var(--bs-font-display,inherit);font-weight:900;
  font-size:clamp(2rem,3.2vw,3rem);line-height:1;letter-spacing:-.02em;
  color:var(--bs-primary-strong,#e4761b);
}
.bespoke-page .bs-stat__label{
  display:block;font-size:.72rem;font-weight:800;letter-spacing:.1em;
  text-transform:uppercase;line-height:1.35;color:var(--bs-muted);max-width:20ch;
}
.bespoke-page .bs-section--ink .bs-stat__value,.bespoke-page .bs-section--brand .bs-stat__value{color:#fff}
.bespoke-page .bs-section--ink .bs-stat__label,.bespoke-page .bs-section--brand .bs-stat__label{color:rgb(255 255 255 / .72)}
.bespoke-page .bs-section--ink .bs-stat,.bespoke-page .bs-section--brand .bs-stat{background:rgb(255 255 255 / .06);border-color:rgb(255 255 255 / .16)}
.bespoke-page .bs-section--ink .bs-stat__icon,.bespoke-page .bs-section--brand .bs-stat__icon{background:rgb(255 255 255 / .12);color:#fff}
.bespoke-page .bs-rating{display:inline-flex;align-items:center;gap:10px;font-weight:700;font-size:.92rem}
/* Review proof pills.
   Two platforms, one shape. They carry different information — Google has a
   rating we can verify, Facebook does not — so the balance has to come from
   the frame rather than from inventing a number to fill the gap: identical
   height, identical minimum width, identical internal rhythm, and a top line
   that reserves its space whether or not it has stars in it. */
.bespoke-page .bs-pills{display:flex;flex-wrap:wrap;gap:12px;align-items:stretch}
.bespoke-page .bs-pill{
  display:inline-flex;align-items:center;gap:11px;
  min-width:186px;min-height:58px;padding:10px 16px;
  border-radius:var(--bs-r);background:#fff;color:var(--bs-ink,#16181d);
  border:1px solid var(--bs-line);box-shadow:0 6px 18px rgb(0 0 0 / .14);
  text-decoration:none;transition:transform .16s ease,box-shadow .16s ease;
}
.bespoke-page a.bs-pill:hover{transform:translateY(-2px);box-shadow:0 12px 28px rgb(0 0 0 / .2)}

/* Frosted on the hero only. A solid white block sitting on a photograph reads
   as a sticker; the same badge in glass reads as part of the composition. It
   is scoped to the hero because glass over white is invisible. */
.bespoke-page .bs-hero .bs-pill{
  background:rgb(255 255 255 / .13);
  -webkit-backdrop-filter:blur(16px) saturate(140%);
  backdrop-filter:blur(16px) saturate(140%);
  border-color:rgb(255 255 255 / .28);
  color:#fff;
  box-shadow:0 10px 30px rgb(0 0 0 / .3),inset 0 1px 0 rgb(255 255 255 / .22);
}
.bespoke-page .bs-hero a.bs-pill:hover{background:rgb(255 255 255 / .2);border-color:rgb(255 255 255 / .42)}
.bespoke-page .bs-hero .bs-pill__sub{color:rgb(255 255 255 / .82)}
/* The marks keep a light disc so Google's colours and Facebook's blue stay
   legible against the frosting rather than sinking into it. */
.bespoke-page .bs-hero .bs-google,.bespoke-page .bs-hero .bs-fbmark{
  background:#fff;border-radius:999px;padding:3px;box-shadow:0 2px 6px rgb(0 0 0 / .18);
}
.bespoke-page .bs-pill__marks{display:inline-flex;align-items:center;flex:none}
/* Overlapped, so two marks read as one badge rather than two icons. */
.bespoke-page .bs-pill__marks>*+*{margin-left:-9px}
.bespoke-page .bs-pill--combined{min-width:212px}
.bespoke-page .bs-pill__body{display:flex;flex-direction:column;justify-content:center;gap:2px;line-height:1.2}
/* min-height, so the Facebook pill's single-line top sits at the same optical
   position as Google's number-plus-stars rather than drifting upward. */
.bespoke-page .bs-pill__top{display:flex;align-items:center;gap:6px;min-height:20px;font-size:1rem;font-weight:900;letter-spacing:-.01em}
.bespoke-page .bs-pill__top .bs-stars{display:inline-flex;gap:1px}
.bespoke-page .bs-pill__top .bs-stars svg{width:14px;height:14px}
.bespoke-page .bs-pill__sub{font-size:.72rem;font-weight:700;color:var(--bs-muted);text-decoration:underline;text-underline-offset:2px;white-space:nowrap}
.bespoke-page .bs-fbmark,.bespoke-page .bs-google{display:inline-flex;flex:none;align-items:center}
.bespoke-page .bs-fbmark svg,.bespoke-page .bs-google svg{width:26px;height:26px}
@media (max-width:620px){
/* A phone has no room to spend on margins. The gutter token drops here so
   the hero copy, every band and the form all pull in together rather than
   each being tightened one rule at a time. */
.bespoke-page{--bs-gutter:15px}
/* The card-stack hero insets its container to frame the copy as a card. That
   is a desktop device, and its clamp floors at 28px, so on a phone it never
   shrank — it just stacked on top of the grid's own gutter and pushed the
   headline 48px off the edge of a 390px screen. The frame is worth nothing
   at this width; the grid's gutter is the whole margin. */
.bespoke-page .bs-hero--card-stack .bs-container{padding-inline:0}
/* align-self beats align-items, so the eyebrow kept the flex-start it is
   given on desktop while the heading, lede and pills around it all centred. */
.bespoke-page .bs-contact__copy>.bs-eyebrow{align-self:center}
  .bespoke-page .bs-pills{width:100%}
  .bespoke-page .bs-pill{flex:1 1 100%;justify-content:center;min-width:0}
}
.bespoke-page .bs-rating svg{color:#f5b301;fill:#f5b301}
.bespoke-page .bs-icon{display:inline-flex;width:24px;height:24px;flex:none;align-items:center;justify-content:center}
.bespoke-page .bs-icon svg{width:100%;height:100%}
.bespoke-page .bs-rule{display:block;width:52px;height:4px;background:var(--bs-primary,#e4761b);border-radius:2px}
.bespoke-page .bs-marker{font-family:var(--bs-font-display,inherit);font-weight:900;font-size:2.4rem;line-height:1;color:var(--bs-primary,#e4761b);opacity:.28}
.bespoke-page .bs-accent{color:var(--bs-primary,#e4761b)}
.bespoke-page .bs-muted{color:var(--bs-muted)}

/* ---------- founder badge ---------------------------------------------- */
.bespoke-page .bs-founder-badge{
  position:absolute;left:0;bottom:0;z-index:5;
  display:flex;align-items:stretch;box-shadow:var(--bs-shadow-lg);border-radius:8px;overflow:hidden;max-width:calc(100% - 36px);
}
.bespoke-page .bs-founder-badge>*:first-child{background:var(--bs-ink,#16181d);color:#fff;display:flex;align-items:center;justify-content:center;padding:12px 16px;font-weight:800;font-size:.85rem}
/* Scraped logos are usually the white-on-dark variant, and a white PNG on a
   white tile is an empty box. Forcing the mark to white on an ink tile is
   legible for every logo, light or dark. */
.bespoke-page .bs-founder-badge>*:first-child img{max-height:38px;width:auto;object-fit:contain;filter:brightness(0) invert(1)}
.bespoke-page .bs-founder-badge>*:last-child{background:var(--bs-primary-strong,var(--bs-primary,#e4761b));color:var(--bs-on-primary,#fff);padding:12px 20px;display:flex;flex-direction:column;justify-content:center;line-height:1.25}

/* ---------- lead form -------------------------------------------------- */
.bespoke-page .bs-form{background:#fff;color:var(--bs-ink,#16181d);border-radius:var(--bs-r);box-shadow:var(--bs-shadow-lg);overflow:visible;width:100%;max-width:440px}
.bespoke-page .bs-form__head{position:relative;background:var(--bs-primary-strong,var(--bs-primary,#e4761b));color:var(--bs-on-primary,#fff);padding:22px 24px;text-align:center;border-radius:var(--bs-r) var(--bs-r) 0 0}
.bespoke-page .bs-form__head::after{content:"";position:absolute;left:50%;bottom:-11px;transform:translateX(-50%);border-left:12px solid transparent;border-right:12px solid transparent;border-top:12px solid var(--bs-primary-strong,var(--bs-primary,#e4761b))}
.bespoke-page .bs-form__head h2,.bespoke-page .bs-form__head h3,.bespoke-page .bs-form__head .bs-h3{font-family:var(--bs-font-display,inherit);font-weight:900;text-transform:uppercase;letter-spacing:.04em;font-size:1.2rem;line-height:1.15}
.bespoke-page .bs-form__head p{font-size:.87rem;opacity:.92;margin-top:6px}
.bespoke-page .bs-form>*:not(.bs-form__head){padding-inline:24px}
.bespoke-page .bs-form>*:not(.bs-form__head):first-of-type{padding-top:26px}
.bespoke-page .bs-form>*:last-child{padding-bottom:24px}
.bespoke-page .bs-field{display:block;margin-bottom:12px}
.bespoke-page .bs-input,.bespoke-page .bs-select,.bespoke-page .bs-textarea{
  width:100%;min-height:52px;padding:14px 16px;font:inherit;font-size:.97rem;color:inherit;
  background:#f6f7f9;border:1px solid var(--bs-line);border-radius:8px;
}
.bespoke-page .bs-textarea{min-height:96px;resize:vertical}
.bespoke-page .bs-input:focus,.bespoke-page .bs-select:focus,.bespoke-page .bs-textarea:focus{outline:none;border-color:var(--bs-primary,#e4761b);background:#fff}
.bespoke-page .bs-input::placeholder,.bespoke-page .bs-textarea::placeholder{color:rgb(0 0 0 / .45)}
.bespoke-page .bs-form [type=submit],.bespoke-page .bs-form button{width:100%}

/* ---------- hero ------------------------------------------------------- */
/* The hero used to ask for 88vh while a ~106px sticky nav sat above it, so
   hero + chrome came to 94vh + 106px and the bottom of the form fell below
   the fold on any screen under about 880px tall — a 13" laptop, and every
   social mockup, which is where this was first noticed. It now takes exactly
   the screen minus the chrome, so the first fold is the whole first fold. */
.bespoke-page .bs-hero{position:relative;padding:0;min-height:clamp(560px,calc(100svh - 112px),880px);display:flex;align-items:center;overflow:hidden;background:var(--bs-ink,#16181d);color:#fff}
/* The application's legacy stylesheet zeroes padding-inline on every direct
   child of a section, which strips this container's gutter and pushes the hero
   content against the viewport edge. The room is put on the grid, where no
   legacy selector reaches. */
.bespoke-page .bs-hero .bs-container{position:relative;z-index:3;padding-block:clamp(48px,6vh,76px) clamp(40px,5vh,64px);padding-inline:0;width:100%}
.bespoke-page [class*="bs-hero--"] .bs-hero__grid{padding-inline:var(--bs-gutter)}
.bespoke-page .bs-hero__bg{position:absolute;inset:0;z-index:0;border-radius:0;aspect-ratio:auto}
.bespoke-page .bs-hero__bg>img{width:100%;height:100%;object-fit:cover}
.bespoke-page .bs-hero::after{
  content:"";position:absolute;inset:0;z-index:1;
  background:
    linear-gradient(100deg,rgb(0 0 0 / .84) 0%,rgb(0 0 0 / .62) 46%,rgb(0 0 0 / .30) 100%),
    linear-gradient(200deg,rgb(var(--bs-primary-rgb,228 118 27) / .30) 0%,transparent 62%);
}
.bespoke-page .bs-hero .bs-display{overflow:visible;max-width:16ch;font-size:clamp(2.6rem,5vw,4.4rem)}
.bespoke-page .bs-hero .bs-eyebrow--chip{box-shadow:0 8px 22px rgb(0 0 0 / .3)}
.bespoke-page .bs-hero .bs-lede{color:rgb(255 255 255 / .84);max-width:52ch}
.bespoke-page .bs-hero .bs-rating{background:rgb(0 0 0 / .45);border:1px solid rgb(255 255 255 / .18);padding:10px 16px;border-radius:8px}
.bespoke-page .bs-hero .bs-badge{border-color:rgb(255 255 255 / .26)}
.bespoke-page .bs-hero .bs-split{align-items:center;gap:clamp(32px,4vw,64px)}
.bespoke-page .bs-hero--split-form .bs-split{grid-template-columns:1.15fr .85fr}
.bespoke-page .bs-hero--offset-slab .bs-split{grid-template-columns:1fr .8fr}
.bespoke-page .bs-hero--stat-anchored .bs-split{grid-template-columns:1fr .85fr}
.bespoke-page .bs-hero--centered-editorial .bs-container{text-align:center}
.bespoke-page .bs-hero--centered-editorial .bs-stack{align-items:center}
.bespoke-page .bs-hero--centered-editorial .bs-form{max-width:960px;margin-inline:auto}
.bespoke-page .bs-hero--centered-editorial .bs-form .bs-row{gap:12px}
.bespoke-page .bs-hero--centered-editorial .bs-field{flex:1 1 180px;margin-bottom:0}
.bespoke-page .bs-hero__proofbar{position:relative;z-index:3;background:rgb(0 0 0 / .55);border-top:1px solid rgb(255 255 255 / .14);backdrop-filter:blur(6px)}
.bespoke-page .bs-hero__proofbar .bs-container{display:grid;grid-template-columns:repeat(4,1fr);gap:20px;padding-block:20px;text-align:center;font-size:.83rem;font-weight:700;letter-spacing:.06em;text-transform:uppercase}

/* ---------- about ------------------------------------------------------ */
.bespoke-page .bs-about--overlap-card .bs-panel{margin-top:clamp(-120px,-8vw,-56px);position:relative;z-index:4}
.bespoke-page .bs-about .bs-media{box-shadow:var(--bs-shadow)}

/* ---------- navigation ------------------------------------------------- */
.bespoke-page .bs-utility{background:color-mix(in srgb,var(--bs-ink,#16181d) 88%,#000);color:rgb(255 255 255 / .82);font-size:.8rem;font-weight:600;border-bottom:1px solid rgb(255 255 255 / .08)}
.bespoke-page .bs-utility .bs-icon{color:var(--bs-accent,#c1273c)}
.bespoke-page .bs-utility .bs-container{display:flex;flex-wrap:wrap;justify-content:space-between;gap:12px;padding-block:9px}
/* backdrop-filter must stay OFF here. The application's legacy stylesheet
   (src/app/bespoke.css) styles .bs-nav for the old React navigation with
   backdrop-filter:blur(12px), and a filtered element becomes the containing
   block for its position:fixed descendants — which made the mobile drawer
   resolve against the 105px-tall nav instead of the viewport and vanish
   behind the hero. Measured: 330x105 at x=375 before this. */
.bespoke-page .bs-nav{position:sticky;top:0;z-index:100;background:var(--bs-ink,#16181d);color:#fff;box-shadow:0 2px 20px rgb(0 0 0 / .2);backdrop-filter:none;-webkit-backdrop-filter:none;filter:none;border-bottom:0}
.bespoke-page .bs-nav__bar{display:flex;align-items:center;justify-content:space-between;gap:24px;width:100%;max-width:var(--bs-max);margin-inline:auto;padding:14px var(--bs-gutter)}
.bespoke-page .bs-nav__logo{display:flex;align-items:center;gap:10px;font-family:var(--bs-font-display,inherit);font-weight:900;font-size:1.15rem;letter-spacing:-.01em}
.bespoke-page .bs-nav__logo img{max-height:52px;width:auto;object-fit:contain}
.bespoke-page .bs-nav__links{display:flex;align-items:center;gap:6px}
.bespoke-page .bs-nav__links>li{position:relative}
.bespoke-page .bs-nav__links>li.bs-nav__item{position:static}
.bespoke-page .bs-nav__links a,.bespoke-page .bs-nav__links button,.bespoke-page [data-nav-trigger]{
  display:inline-flex;align-items:center;gap:6px;padding:10px 14px;font:inherit;font-size:.95rem;font-weight:600;
  color:#fff;background:none;border:0;cursor:pointer;border-radius:8px;white-space:nowrap;
}
.bespoke-page .bs-nav__links a:hover,.bespoke-page [data-nav-trigger]:hover{background:rgb(255 255 255 / .10)}
.bespoke-page .bs-nav__actions{display:flex;align-items:center;gap:16px}
.bespoke-page .bs-nav[data-scrolled=true]{box-shadow:0 6px 28px rgb(0 0 0 / .32)}

/* The mega menu. Closed is the default state — without this every panel
   renders inline down the top of the page, which is exactly what shipped. */
.bespoke-page .bs-nav__panel,.bespoke-page [data-nav-panel]{
  position:absolute;top:calc(100% + 10px);left:50%;transform:translateX(-50%) translateY(-8px);
  min-width:min(760px,90vw);background:var(--bs-surface,#fff);color:var(--bs-ink,#16181d);
  border-radius:var(--bs-r);box-shadow:var(--bs-shadow-lg);padding:26px;z-index:110;
  opacity:0;visibility:hidden;pointer-events:none;transition:opacity .16s ease,transform .16s ease;
}
.bespoke-page [data-nav-panel][data-open=true]{opacity:1;visibility:visible;pointer-events:auto;transform:translateX(-50%) translateY(0)}
.bespoke-page [data-nav-panel] a{display:flex;gap:10px;padding:10px;border-radius:8px;font-weight:600;color:inherit}
.bespoke-page [data-nav-panel] a:hover{background:var(--bs-surface-alt,#f4f5f7);color:var(--bs-primary,#e4761b)}
.bespoke-page [data-nav-toggle]{display:none;background:none;border:0;color:inherit;padding:10px;cursor:pointer}
.bespoke-page [data-nav-drawer]{
  position:fixed;inset:0 0 0 auto;width:min(400px,88vw);z-index:200;background:var(--bs-ink,#16181d);color:#fff;
  padding:28px var(--bs-gutter);overflow-y:auto;transform:translateX(100%);transition:transform .24s ease;
}
.bespoke-page [data-nav-drawer][data-open=true]{transform:translateX(0)}
.bespoke-page [data-nav-drawer] a:not(.bs-btn){display:block;padding:13px 2px;border-bottom:1px solid rgb(255 255 255 / .12);font-weight:600}
.bespoke-page [data-nav-drawer] .bs-btn{margin-top:22px;padding:14px 20px;width:100%;justify-content:center}
/* The drawer's call action. A translucent chip around the handset and the
   number set over a quiet label reads as a considered primary action rather
   than a bare phone number in an orange box. */
.bespoke-page .bs-btn--call{gap:12px;text-align:left}
.bespoke-page .bs-btn__chip{display:inline-flex;align-items:center;justify-content:center;width:34px;height:34px;flex:0 0 34px;border-radius:999px;background:rgb(255 255 255 / .18);box-shadow:inset 0 0 0 1px rgb(255 255 255 / .26)}
.bespoke-page .bs-btn__calltext{display:inline-flex;flex-direction:column;line-height:1.15}
.bespoke-page .bs-btn__calllabel{font-size:.66rem;font-weight:700;letter-spacing:.14em;text-transform:uppercase;opacity:.72}
.bespoke-page .bs-btn__callnumber{font-size:1.06rem;font-weight:800;letter-spacing:.01em}
.bespoke-page .bs-nav__group{border-bottom:1px solid rgb(255 255 255 / .12)}
.bespoke-page .bs-nav__group>summary{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:15px 2px;font-weight:700;cursor:pointer;list-style:none}
.bespoke-page .bs-nav__group>summary::-webkit-details-marker{display:none}
.bespoke-page .bs-nav__group>summary .bs-icon{transition:transform .2s ease;transform:rotate(90deg);opacity:.6}
.bespoke-page .bs-nav__group[open]>summary .bs-icon{transform:rotate(-90deg)}
.bespoke-page .bs-nav__group[open]>summary{color:var(--bs-primary-strong,#e4761b)}
.bespoke-page .bs-nav__grouplinks{padding:2px 0 12px 14px;border-left:2px solid rgb(255 255 255 / .14);margin-bottom:10px}
.bespoke-page .bs-nav__grouplinks a{padding:11px 0;border-bottom:0;font-weight:500;opacity:.88}
.bespoke-page [data-nav-close]{background:none;border:0;color:inherit;font-size:1.6rem;cursor:pointer;padding:4px 10px}


/* ---------- contact ---------------------------------------------------- */
/* The band that asks for the call. It carries more weight than any other
   section, so it is the one place with layered light: a brand aura bled
   behind the copy, a hairline mesh for depth, and pressable channel rows. */
.bespoke-page .bs-contact{position:relative;overflow:hidden;isolation:isolate}
.bespoke-page .bs-contact__aura{
  position:absolute;inset:-30% -10% auto -25%;height:150%;z-index:0;pointer-events:none;
  background:
    radial-gradient(48% 42% at 18% 30%, color-mix(in srgb, var(--bs-primary,#e4761b) 42%, transparent) 0%, transparent 68%),
    radial-gradient(38% 38% at 78% 78%, color-mix(in srgb, var(--bs-accent,#c1273c) 30%, transparent) 0%, transparent 70%);
  filter:blur(28px);opacity:.5;
}
/* Hairline mesh, faded out at the edges so it never reads as a border. */
.bespoke-page .bs-contact__mesh{
  position:absolute;inset:0;z-index:0;pointer-events:none;opacity:.5;
  background-image:linear-gradient(rgb(255 255 255 / .045) 1px,transparent 1px),linear-gradient(90deg,rgb(255 255 255 / .045) 1px,transparent 1px);
  background-size:64px 64px;
  -webkit-mask-image:radial-gradient(70% 60% at 50% 45%,#000 0%,transparent 100%);
  mask-image:radial-gradient(70% 60% at 50% 45%,#000 0%,transparent 100%);
}
.bespoke-page .bs-contact>.bs-container{position:relative;z-index:2}
.bespoke-page .bs-contact__inner{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,.82fr);gap:clamp(32px,4vw,64px);align-items:center}
.bespoke-page .bs-contact__copy{display:flex;flex-direction:column;align-items:stretch;gap:clamp(16px,1.8vw,22px)}
.bespoke-page .bs-contact__copy>.bs-eyebrow{align-self:flex-start}
.bespoke-page .bs-contact__copy .bs-lede{margin-bottom:4px;max-width:46ch}
.bespoke-page .bs-contact__copy .bs-h2{max-width:16ch}
.bespoke-page .bs-contact__form{display:flex;justify-content:flex-end}

/* Channels ------------------------------------------------------------- */
.bespoke-page .bs-channels{display:flex;flex-direction:column;gap:12px;width:100%}
.bespoke-page .bs-channel{
  display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:16px;
  padding:15px 18px;border-radius:var(--bs-r);
  background:rgb(255 255 255 / .05);border:1px solid rgb(255 255 255 / .12);
  color:#fff;transition:transform .2s ease,background .2s ease,border-color .2s ease,box-shadow .2s ease;
}
.bespoke-page .bs-channel:hover{
  transform:translateY(-2px);background:rgb(255 255 255 / .09);
  border-color:color-mix(in srgb, var(--bs-primary,#e4761b) 55%, transparent);
  box-shadow:0 18px 40px rgb(0 0 0 / .34);
}
.bespoke-page .bs-channel__chip{
  display:inline-flex;align-items:center;justify-content:center;width:44px;height:44px;flex:none;border-radius:999px;
  background:rgb(255 255 255 / .1);box-shadow:inset 0 0 0 1px rgb(255 255 255 / .18);transition:background .2s ease,color .2s ease;
}
.bespoke-page .bs-channel--call .bs-channel__chip{background:var(--bs-primary-strong,var(--bs-primary,#e4761b));color:var(--bs-on-primary,#fff);box-shadow:0 8px 20px rgb(0 0 0 / .3)}
.bespoke-page .bs-channel:hover .bs-channel__chip{background:var(--bs-primary-strong,var(--bs-primary,#e4761b));color:var(--bs-on-primary,#fff)}
.bespoke-page .bs-channel__text{display:flex;flex-direction:column;gap:3px;min-width:0}
.bespoke-page .bs-channel__label{font-size:.68rem;font-weight:800;letter-spacing:.14em;text-transform:uppercase;opacity:.6}
.bespoke-page .bs-channel__value{font-family:var(--bs-font-display,inherit);font-weight:900;letter-spacing:-.01em;font-size:1.16rem;overflow-wrap:anywhere}
.bespoke-page .bs-channel--call .bs-channel__value{font-size:clamp(1.35rem,2vw,1.7rem)}
.bespoke-page .bs-channel__go{opacity:.35;transition:transform .2s ease,opacity .2s ease}
.bespoke-page .bs-channel:hover .bs-channel__go{opacity:1;transform:translateX(4px)}

/* Reassurance ---------------------------------------------------------- */
.bespoke-page .bs-contact__meta{display:flex;flex-wrap:wrap;align-items:center;gap:10px;width:100%}
.bespoke-page .bs-live{
  display:inline-flex;align-items:center;gap:9px;font-size:.83rem;font-weight:700;color:rgb(255 255 255 / .82);
  padding:7px 14px;border-radius:999px;background:rgb(255 255 255 / .06);border:1px solid rgb(255 255 255 / .14);
}
.bespoke-page .bs-live__dot{width:8px;height:8px;flex:none;border-radius:999px;background:#31d07f;box-shadow:0 0 0 0 rgb(49 208 127 / .55);animation:bs-live-pulse 2.4s ease-out infinite}
@keyframes bs-live-pulse{70%{box-shadow:0 0 0 9px rgb(49 208 127 / 0)}100%{box-shadow:0 0 0 0 rgb(49 208 127 / 0)}}

/* Areas ---------------------------------------------------------------- */
/* Namespaced under bs-contact__. These were .bs-areas, which the service
   areas section already owns — the white pill colour here repainted that
   section's cards white-on-white and its flex layout collapsed their grid. */
.bespoke-page .bs-contact__areas{display:flex;flex-wrap:wrap;align-items:center;gap:10px;width:100%;padding-top:2px}
.bespoke-page .bs-contact__arealabel{display:inline-flex;align-items:center;gap:7px;font-size:.7rem;font-weight:800;letter-spacing:.14em;text-transform:uppercase;opacity:.55}
.bespoke-page .bs-contact__arealist{display:flex;flex-wrap:wrap;gap:8px;list-style:none;margin:0;padding:0}
.bespoke-page .bs-contact__arealist li{font-size:.82rem;font-weight:600;padding:6px 13px;border-radius:999px;background:rgb(255 255 255 / .05);border:1px solid rgb(255 255 255 / .13);color:rgb(255 255 255 / .84)}

/* The card is the destination, so it sits highest. */
.bespoke-page .bs-contact .bs-form{box-shadow:0 44px 90px rgb(0 0 0 / .48);max-width:460px}

@media (max-width:900px){
  .bespoke-page .bs-contact__inner{grid-template-columns:1fr;gap:40px}
  .bespoke-page .bs-contact__form{justify-content:center}
  .bespoke-page .bs-channels{max-width:none}
}
@media (max-width:620px){
  .bespoke-page .bs-contact__copy{align-items:center;text-align:center}
  .bespoke-page .bs-contact .bs-eyebrow{flex-direction:column;gap:8px}
  .bespoke-page .bs-contact__meta,.bespoke-page .bs-contact__areas,.bespoke-page .bs-contact__arealist{justify-content:center}
  .bespoke-page .bs-channel{grid-template-columns:auto 1fr;text-align:left;padding:14px 16px;gap:13px}
  .bespoke-page .bs-channel__go{display:none}
  .bespoke-page .bs-contact .bs-form{max-width:none}
}

/* ---------- footer ----------------------------------------------------- */
.bespoke-page .bs-footer{background:var(--bs-ink,#16181d);color:rgb(255 255 255 / .82);padding-top:clamp(48px,6vw,88px)}
.bespoke-page .bs-footer a{color:inherit}
.bespoke-page .bs-footer a:hover{color:#fff}
.bespoke-page .bs-footer__cols{display:grid;grid-template-columns:1.6fr 1fr 1fr 1fr;gap:clamp(24px,3vw,48px)}
.bespoke-page .bs-footer__col li{padding:6px 0;font-size:.93rem}
.bespoke-page .bs-footer h3,.bespoke-page .bs-footer .bs-h4{color:#fff;font-size:.78rem;letter-spacing:.14em;text-transform:uppercase;margin-bottom:12px}
.bespoke-page .bs-footer__col img{max-height:56px;width:auto;object-fit:contain}
.bespoke-page .bs-footer__bottom{margin-top:clamp(32px,4vw,56px);border-top:1px solid rgb(255 255 255 / .12);padding-block:22px;display:flex;flex-wrap:wrap;justify-content:space-between;gap:14px;font-size:.85rem}
.bespoke-page .bs-footer-cta{background:var(--bs-primary-strong,var(--bs-primary,#e4761b));color:var(--bs-on-primary,#fff);border-radius:var(--bs-r-lg);padding:clamp(28px,3.4vw,52px);display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:24px;box-shadow:var(--bs-shadow-lg);margin-bottom:clamp(32px,4vw,56px)}
.bespoke-page .bs-footer-cta .bs-h2{color:inherit}

/* ---------- motion ----------------------------------------------------- */
.bespoke-page [data-reveal-armed]:not([data-revealed]){opacity:0;transform:translateY(20px)}
.bespoke-page [data-reveal]{transition:opacity .6s ease,transform .6s ease}
@media (prefers-reduced-motion:reduce){.bespoke-page *{transition:none!important;animation:none!important}}

/* ---------- responsive ------------------------------------------------- */
@media (max-width:1080px){
  .bespoke-page .bs-nav__links{display:none}
  .bespoke-page [data-nav-toggle]{display:inline-flex}
  .bespoke-page .bs-grid-4{grid-template-columns:repeat(2,1fr)}
  .bespoke-page .bs-footer__cols{grid-template-columns:1fr 1fr}
}
@media (max-width:900px){
  .bespoke-page .bs-split,.bespoke-page .bs-grid-3{grid-template-columns:1fr}
  .bespoke-page .bs-split--reverse>*:first-child{order:2}
  .bespoke-page .bs-hero{min-height:auto}
  .bespoke-page .bs-hero .bs-container{padding-block:110px 56px}
  .bespoke-page .bs-hero .bs-form{max-width:none}
  .bespoke-page .bs-hero__proofbar .bs-container{grid-template-columns:repeat(2,1fr)}
  .bespoke-page .bs-collage{grid-template-columns:1fr 1fr}
  .bespoke-page .bs-collage>*:first-child{grid-row:auto;grid-column:span 2}
  .bespoke-page .bs-stats,.bespoke-page .bs-stats[data-count="3"],.bespoke-page .bs-stats[data-count="4"]{--stat-cols:2}
  .bespoke-page .bs-overlap-up,.bespoke-page .bs-about--overlap-card .bs-panel{margin-top:0}
}
@media (max-width:620px){
  .bespoke-page{font-size:16px}
  .bespoke-page .bs-grid-2,.bespoke-page .bs-grid-4{grid-template-columns:1fr}
  .bespoke-page .bs-footer__cols{grid-template-columns:1fr}
  .bespoke-page .bs-actions>*{flex:1 1 100%}
  .bespoke-page .bs-hide-mobile{display:none}
  .bespoke-page .bs-hide-desktop{display:revert}
  .bespoke-page .bs-hero__proofbar .bs-container{grid-template-columns:1fr;text-align:left}
}
/* ---------- colour bands ----------------------------------------------- */
/* The references are LIGHT pages with brand colour used decisively — a solid
   band, a filled badge row, a coloured card header. Ours came out as text on
   dark grey because ink was the only strong background available. */
.bespoke-page .bs-section--brand{position:relative;overflow:hidden;background:var(--bs-primary-strong,var(--bs-primary,#e4761b));color:var(--bs-on-primary,#fff)}
.bespoke-page .bs-section--brand::before{content:"";position:absolute;inset:-40% -10% auto auto;width:520px;height:520px;border-radius:999px;border:80px solid rgb(255 255 255 / .07)}
.bespoke-page .bs-section--brand::after{content:"";position:absolute;left:-80px;bottom:-160px;width:360px;height:360px;border-radius:999px;background:rgb(0 0 0 / .07)}
.bespoke-page .bs-section--brand>.bs-container{position:relative;z-index:2;max-width:820px}
.bespoke-page .bs-section--brand .bs-h2{margin-bottom:14px}
.bespoke-page .bs-section--brand .bs-lede{margin-inline:auto;margin-bottom:26px;max-width:52ch;font-size:clamp(1.05rem,1.3vw,1.2rem)}
.bespoke-page .bs-section--brand .bs-lede,.bespoke-page .bs-section--brand .bs-body{color:rgb(255 255 255 / .88)}
.bespoke-page .bs-section--brand .bs-eyebrow,.bespoke-page .bs-section--brand .bs-mark{color:#fff}
.bespoke-page .bs-section--brand .bs-card{background:#fff;color:var(--bs-ink,#16181d)}
.bespoke-page .bs-section--brand .bs-btn{background:#fff;color:var(--bs-ink,#16181d)}
.bespoke-page .bs-section--photo{position:relative;background:var(--bs-ink,#16181d);color:#fff;overflow:hidden}
.bespoke-page .bs-section--photo>.bs-media{position:absolute;inset:0;border-radius:0;aspect-ratio:auto;z-index:0}
.bespoke-page .bs-section--photo>.bs-media>img{width:100%;height:100%;object-fit:cover}
.bespoke-page .bs-section--photo::after{content:"";position:absolute;inset:0;z-index:1;background:linear-gradient(90deg,rgb(0 0 0 / .82),rgb(0 0 0 / .45))}
.bespoke-page .bs-section--photo>.bs-container{position:relative;z-index:2}
.bespoke-page .bs-section--photo .bs-lede{color:rgb(255 255 255 / .84)}

/* ---------- trust bar --------------------------------------------------- */
.bespoke-page .bs-trustbar{background:var(--bs-surface-alt,#f4f5f7);border-bottom:1px solid var(--bs-line);padding:22px 0}
.bespoke-page .bs-trustbar .bs-container{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:clamp(16px,3vw,44px)}
.bespoke-page .bs-trustbar .bs-stat__value{font-size:clamp(1.7rem,2.4vw,2.4rem)}
.bespoke-page .bs-trustbar .bs-badge{background:#fff;border-color:transparent;box-shadow:0 2px 10px rgb(0 0 0 / .08)}

/* ---------- photo-led cards --------------------------------------------- */
/* A service card with a photograph is what makes the reference pages feel
   like a business rather than a brochure. */
.bespoke-page .bs-card--photo{padding:0;overflow:hidden;display:flex;flex-direction:column}
.bespoke-page .bs-card--photo .bs-media{border-radius:0;aspect-ratio:16/10}
.bespoke-page .bs-card--photo>*:not(.bs-media){padding:22px 24px}
.bespoke-page .bs-card--photo>*:last-child{padding-bottom:24px}
.bespoke-page .bs-card--photo .bs-h3{margin-bottom:8px}
.bespoke-page .bs-gallery{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
.bespoke-page .bs-gallery .bs-media{aspect-ratio:1/1;border-radius:8px}
.bespoke-page .bs-gallery .bs-media img{transition:transform .5s ease}
.bespoke-page .bs-gallery .bs-media:hover img{transform:scale(1.06)}

/* ---------- review cards ------------------------------------------------ */
.bespoke-page .bs-review{background:#fff;border:1px solid var(--bs-line);border-radius:var(--bs-r);padding:26px;box-shadow:var(--bs-shadow);display:flex;flex-direction:column;gap:14px}
.bespoke-page .bs-review__author{display:flex;align-items:center;gap:12px;font-weight:800;margin-top:auto}
.bespoke-page .bs-review__avatar{width:44px;height:44px;border-radius:999px;flex:none;display:grid;place-items:center;background:var(--bs-primary,#e4761b);color:var(--bs-on-primary,#fff);font-family:var(--bs-font-display,inherit);font-weight:900}

@media (max-width:900px){
  .bespoke-page .bs-gallery{grid-template-columns:repeat(2,1fr)}
  .bespoke-page .bs-trustbar .bs-container{justify-content:flex-start;gap:20px}
}

/* ---------- slot-filled components -------------------------------------- */
.bespoke-page .bs-sr{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap}
.bespoke-page .bs-icon--sm{width:16px;height:16px}
.bespoke-page .bs-wordmark{font-family:var(--bs-font-display,inherit);font-weight:900;font-size:1.25rem;letter-spacing:-.02em;line-height:1}
.bespoke-page .bs-textlink{display:inline-flex;align-items:center;gap:6px;font-weight:800;font-size:.9rem;color:var(--bs-primary,#e4761b)}
.bespoke-page .bs-textlink:hover{gap:10px}
.bespoke-page .bs-stars{display:inline-flex;gap:2px;color:#f5b301}
.bespoke-page .bs-stars svg{width:17px;height:17px}
.bespoke-page .bs-sectionhead{display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:space-between;gap:24px;margin-bottom:clamp(28px,3.4vw,48px)}
.bespoke-page .bs-sectionhead .bs-eyebrow{margin-bottom:12px}
.bespoke-page .bs-sectionhead .bs-h2{margin-bottom:12px}
.bespoke-page .bs-phone-xl{font-family:var(--bs-font-display,inherit);font-weight:900;font-size:clamp(1.6rem,2.4vw,2.2rem);letter-spacing:-.02em;display:inline-block}
.bespoke-page .bs-phone-xl:hover{color:var(--bs-primary,#e4761b)}

/* hero grid, owned rather than described */
.bespoke-page .bs-hero__grid{display:grid;grid-template-columns:1.05fr minmax(380px,.75fr);gap:clamp(32px,4vw,72px);align-items:center}
.bespoke-page .bs-hero__copy{display:flex;flex-direction:column;align-items:flex-start;gap:clamp(16px,1.8vw,24px)}
.bespoke-page .bs-hero__form{justify-self:end;width:100%}
.bespoke-page .bs-row--badges{gap:10px}
.bespoke-page .bs-link-call--hero{color:#fff}
.bespoke-page .bs-link-call--invert:hover{color:#fff;opacity:.85}
.bespoke-page .bs-hero--centered-editorial .bs-hero__grid{grid-template-columns:1fr;justify-items:center;text-align:center}
.bespoke-page .bs-hero--centered-editorial .bs-hero__copy{align-items:center}
.bespoke-page .bs-hero--offset-slab .bs-hero__copy{background:rgb(var(--bs-ink-rgb,16 18 26) / .72);padding:clamp(26px,3vw,46px);border-radius:var(--bs-r-lg);backdrop-filter:blur(3px)}
.bespoke-page .bs-hero--card-stack .bs-container{padding-inline:clamp(28px,5vw,72px)}

/* form */
.bespoke-page .bs-form__body{padding:24px;display:flex;flex-direction:column;gap:2px}
.bespoke-page .bs-form__title{font-family:var(--bs-font-display,inherit);font-weight:900;text-transform:uppercase;letter-spacing:.03em;font-size:1.18rem;line-height:1.15}
.bespoke-page .bs-form__sub{font-size:.86rem;opacity:.92;margin-top:6px}
.bespoke-page .bs-form__note{font-size:.78rem;text-align:center;color:var(--bs-muted);margin-top:10px}
.bespoke-page .bs-form [data-lead-form-message]{min-height:1em}
.bespoke-page .bs-form[data-state=success] [data-lead-form-message]{color:#0a7b3e;font-weight:700}
.bespoke-page .bs-form[data-state=error] [data-lead-form-message]{color:#b3261e;font-weight:700}

/* about */
.bespoke-page .bs-about__grid{display:grid;grid-template-columns:.95fr 1.05fr;gap:clamp(36px,5vw,80px);align-items:center}
.bespoke-page .bs-about__figure{position:relative}
.bespoke-page .bs-about__figure .bs-media{border-radius:var(--bs-r-lg);box-shadow:var(--bs-shadow-lg)}
.bespoke-page .bs-about__copy{display:flex;flex-direction:column;align-items:flex-start;gap:18px}
.bespoke-page .bs-about--editorial-column .bs-about__grid{grid-template-columns:1fr 1fr}
.bespoke-page .bs-about--portrait-quote .bs-about__figure .bs-media{border-radius:var(--bs-r-lg) 0 0 var(--bs-r-lg)}
.bespoke-page .bs-about .bs-stats{margin-top:clamp(36px,4vw,64px);padding-top:clamp(28px,3vw,44px);border-top:1px solid var(--bs-line)}
.bespoke-page .bs-founder-badge{left:0;bottom:0;right:0;max-width:none;border-radius:0 0 var(--bs-r-lg) var(--bs-r-lg)}
.bespoke-page .bs-founder-badge__logo{flex:none}
.bespoke-page .bs-founder-badge__name strong{display:block;font-family:var(--bs-font-display,inherit);font-size:1.05rem;line-height:1.2}
.bespoke-page .bs-founder-badge__name span{font-size:.74rem;letter-spacing:.1em;text-transform:uppercase;opacity:.9}

/* the seal */
.bespoke-page .bs-seal{position:absolute;top:-34px;right:-28px;width:132px;height:132px;z-index:8;display:grid;place-items:center;pointer-events:none}
.bespoke-page .bs-seal__ring{position:absolute;inset:0;width:100%;height:100%;animation:bs-seal-spin 26s linear infinite}
.bespoke-page .bs-seal__ring{position:absolute;inset:0;z-index:2}
.bespoke-page .bs-seal__ring text{font-family:var(--bs-font-body,inherit);font-size:14px;font-weight:800;letter-spacing:.14em;fill:var(--bs-ink,#16181d)}
.bespoke-page .bs-seal::before{content:"";position:absolute;inset:0;border-radius:999px;background:var(--bs-surface,#fff);box-shadow:0 12px 34px rgb(0 0 0 / .18)}
.bespoke-page .bs-seal__core{position:relative;z-index:3;width:62px;height:62px;border-radius:999px;background:var(--bs-ink,#16181d);color:#fff;display:grid;place-items:center;overflow:hidden}
.bespoke-page .bs-seal__core img{width:80%;height:80%;object-fit:contain}
.bespoke-page .bs-seal__glyph{width:26px;height:26px}
@keyframes bs-seal-spin{to{transform:rotate(360deg)}}
@media (prefers-reduced-motion:reduce){.bespoke-page .bs-seal__ring{animation:none}}

/* why us */
.bespoke-page .bs-whyus{position:relative;padding-block:0;background:var(--bs-surface-alt,#f6f5f3)}
.bespoke-page .bs-whyus__media{position:absolute;inset:0 42% 0 0;z-index:0}
.bespoke-page .bs-whyus__media .bs-media{height:100%;border-radius:0;aspect-ratio:auto}
.bespoke-page .bs-whyus__media .bs-seal{top:34px;left:34px;right:auto}
.bespoke-page .bs-whyus>.bs-container{position:relative;z-index:2;padding-block:clamp(48px,6vw,96px)}
.bespoke-page .bs-whyus__panel{margin-left:auto;width:min(640px,100%);background:var(--bs-surface,#fff);border-radius:var(--bs-r-lg);box-shadow:var(--bs-shadow-lg);padding:clamp(28px,3.2vw,52px);display:flex;flex-direction:column;gap:16px}
.bespoke-page .bs-whyus__points{margin-top:12px;gap:clamp(20px,2.2vw,32px)}
.bespoke-page .bs-point__icon{display:inline-grid;place-items:center;width:44px;height:44px;border-radius:999px;background:var(--bs-accent-strong,var(--bs-accent,#c1273c));color:var(--bs-on-accent,#fff);margin-bottom:12px}
.bespoke-page .bs-point .bs-h4{margin-bottom:6px;color:var(--bs-ink,#16181d)}

/* steps, areas, booking */
.bespoke-page .bs-steps{margin-block:clamp(28px,3.4vw,48px)}
.bespoke-page .bs-step{text-align:left}
.bespoke-page .bs-step .bs-marker{display:block;margin-bottom:10px}
.bespoke-page .bs-areas__list{gap:8px;margin-block:6px}
.bespoke-page .bs-areas__map{border-radius:var(--bs-r-lg);overflow:hidden;box-shadow:var(--bs-shadow);min-height:380px;background:var(--bs-surface-alt,#eee)}
.bespoke-page .bs-areas__map iframe{width:100%;height:100%;min-height:380px;border:0;display:block}
.bespoke-page .bs-booking{background:var(--bs-surface,#fff);border:1px solid var(--bs-line);border-radius:var(--bs-r-lg);box-shadow:var(--bs-shadow-lg);padding:clamp(24px,2.6vw,36px);display:flex;flex-direction:column;gap:10px;text-align:center}
.bespoke-page .bs-booking__glyph{display:inline-grid;place-items:center;width:56px;height:56px;border-radius:999px;background:var(--bs-accent-strong,var(--bs-accent,#c1273c));color:var(--bs-on-accent,#fff);margin:0 auto 6px}
.bespoke-page .bs-booking__days{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-block:12px}
.bespoke-page .bs-booking__day{position:relative;display:flex;flex-direction:column;align-items:center;gap:2px;padding:16px 6px 12px;border:1.5px solid var(--bs-line);border-radius:var(--bs-r);cursor:pointer;transition:border-color .16s ease,background .16s ease}
.bespoke-page .bs-booking__day input{position:absolute;opacity:0;pointer-events:none}
.bespoke-page .bs-booking__day:has(input:checked){border-color:var(--bs-primary,#e4761b);background:rgb(var(--bs-primary-rgb,228 118 27) / .07)}
.bespoke-page .bs-booking__flag{position:absolute;top:-9px;font-size:.6rem;font-weight:800;letter-spacing:.1em;text-transform:uppercase;background:var(--bs-accent-strong,var(--bs-accent,#c1273c));color:var(--bs-on-accent,#fff);padding:3px 8px;border-radius:999px}
.bespoke-page .bs-booking__weekday{font-size:.7rem;font-weight:800;letter-spacing:.1em;opacity:.6}
.bespoke-page .bs-booking__num{font-family:var(--bs-font-display,inherit);font-weight:900;font-size:1.8rem;line-height:1}
.bespoke-page .bs-booking__month{font-size:.74rem;opacity:.6}

/* accordion */
.bespoke-page .bs-accordion{margin-top:clamp(24px,3vw,40px);display:flex;flex-direction:column;gap:10px}
.bespoke-page .bs-accordion__item{background:var(--bs-surface,#fff);border:1px solid var(--bs-line);border-radius:var(--bs-r);overflow:hidden}
.bespoke-page .bs-accordion__trigger{width:100%;display:flex;align-items:center;justify-content:space-between;gap:16px;padding:20px 24px;font:inherit;font-weight:800;font-size:1.02rem;text-align:left;background:none;border:0;cursor:pointer;color:inherit}
.bespoke-page .bs-accordion__chevron{transition:transform .2s ease;transform:rotate(90deg)}
.bespoke-page .bs-accordion__item[data-open=true] .bs-accordion__chevron{transform:rotate(-90deg)}
.bespoke-page .bs-accordion__panel{display:none;padding:0 24px 22px}
.bespoke-page .bs-accordion__item[data-open=true] .bs-accordion__panel{display:block}

/* nav — always ink, never the brand colour, so contrast is not a lottery */
.bespoke-page .bs-nav__link{display:inline-flex;align-items:center;gap:6px;padding:11px 14px;font:inherit;font-size:.95rem;font-weight:600;color:#fff;background:none;border:0;cursor:pointer;border-radius:8px;white-space:nowrap}
.bespoke-page .bs-nav__link:hover{background:rgb(255 255 255 / .12)}
.bespoke-page .bs-nav__caret{transform:rotate(90deg);opacity:.7}
.bespoke-page [data-nav-dropdown][data-open=true] .bs-nav__caret{transform:rotate(-90deg)}
.bespoke-page [data-nav-dropdown][data-open=true] .bs-nav__link{background:rgb(255 255 255 / .12)}
.bespoke-page .bs-nav__panelgrid{display:grid;grid-template-columns:repeat(2,minmax(200px,1fr));gap:4px}
.bespoke-page .bs-nav__panelgrid--areas{grid-template-columns:repeat(3,minmax(140px,1fr))}
.bespoke-page .bs-nav__panel--narrow{min-width:min(560px,90vw)}
.bespoke-page .bs-nav__panelcta{margin-top:16px;padding-top:16px;border-top:1px solid var(--bs-line);display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:16px}
.bespoke-page .bs-nav__panelcta p{font-size:.9rem;color:var(--bs-muted);max-width:38ch}
.bespoke-page .bs-nav__burger{display:none;background:none;border:0;color:#fff;padding:8px;cursor:pointer}
.bespoke-page .bs-nav__close{background:none;border:0;color:#fff;cursor:pointer;padding:6px;margin-bottom:12px}
.bespoke-page .bs-utility a:hover{text-decoration:underline}
.bespoke-page .bs-utility span{display:inline-flex;align-items:center;gap:7px}

/* footer */
.bespoke-page .bs-footer__brand .bs-body{margin-block:14px;color:rgb(255 255 255 / .78);max-width:44ch;overflow:visible;display:block;-webkit-line-clamp:none}
.bespoke-page .bs-footer__brand img{filter:brightness(0) invert(1);opacity:.95}
.bespoke-page .bs-footer .bs-badge{color:#fff;border-color:rgb(255 255 255 / .28)}
.bespoke-page .bs-footer__col li a{color:rgb(255 255 255 / .78)}
.bespoke-page .bs-footer__brand .bs-badge{margin-block:4px}
.bespoke-page .bs-footer__brand .bs-phone-xl{display:block;margin-top:16px;color:#fff}
.bespoke-page .bs-footer__email{display:block;margin-top:6px;font-size:.95rem}
.bespoke-page .bs-footer__wordmark{margin-top:clamp(32px,4vw,64px);overflow:hidden;display:flex;gap:2rem;width:100%;mask-image:linear-gradient(90deg,transparent,#000 12%,#000 88%,transparent)}
.bespoke-page .bs-footer__wordmark span{font-family:var(--bs-font-display,inherit);font-weight:900;font-size:clamp(3.4rem,11vw,9rem);line-height:.9;letter-spacing:-.04em;color:rgb(255 255 255 / .07);white-space:nowrap;text-transform:uppercase;padding-right:2rem;animation:bs-marquee 26s linear infinite}
@keyframes bs-marquee{to{transform:translateX(-100%)}}
@media (prefers-reduced-motion:reduce){.bespoke-page .bs-footer__wordmark span{animation:none}}
.bespoke-page .bs-footer__socials{display:flex;gap:12px;margin-top:clamp(24px,3vw,40px)}
.bespoke-page .bs-footer__socials a{display:grid;place-items:center;width:44px;height:44px;border-radius:999px;border:1px solid rgb(255 255 255 / .22);color:#fff;transition:background .16s ease,border-color .16s ease}
.bespoke-page .bs-footer__socials a:hover{background:var(--bs-primary-strong,#e4761b);border-color:transparent}
.bespoke-page .bs-social svg{width:20px;height:20px}
.bespoke-page .bs-footer-cta>div:first-child p{margin-top:8px;opacity:.9}

@media (max-width:1080px){
  .bespoke-page .bs-nav__burger{display:inline-flex}
  .bespoke-page .bs-whyus__media{position:relative;inset:auto;height:320px}
  .bespoke-page .bs-whyus__panel{width:100%;margin-top:-60px}
}
@media (max-width:900px){
  /* Written at variant specificity on purpose: .bs-hero--v2 .bs-hero__grid is
     three classes and beat the two-class breakpoint rule, so the hero stayed
     two-column on a phone with the form pushed off-screen. */
  .bespoke-page .bs-hero__grid,
  .bespoke-page [class*="bs-hero--"] .bs-hero__grid,
  .bespoke-page .bs-about__grid,
  .bespoke-page [class*="bs-about--"] .bs-about__grid{grid-template-columns:1fr}
  .bespoke-page [class*="bs-hero--"] .bs-hero__form{order:2;justify-self:stretch;max-width:none}
  .bespoke-page [class*="bs-hero--"] .bs-hero__copy{align-items:flex-start;text-align:left;background:none;padding:0;backdrop-filter:none}
  .bespoke-page .bs-hero__grid{gap:28px}
  .bespoke-page .bs-about__figure{margin-bottom:24px}
  .bespoke-page .bs-seal{width:96px;height:96px;top:-22px;right:-8px}
  .bespoke-page .bs-sectionhead{flex-direction:column;align-items:flex-start}
  .bespoke-page .bs-areas__map{min-height:280px}
}

/* ---------- per-lead layout variants ------------------------------------ */
/* The anatomy of these pages is fixed on purpose — it is the order a buyer's
   questions arrive in, and every reference site in this market uses it. What
   varies is the composition, and it varies structurally rather than by
   reshuffling sections: each variant below changes column ratios, sides,
   shapes and emphasis, and a lead's DNA seed picks one per section. With four
   hero archetypes crossed with these, no two clients get the same page. */

/* hero */
.bespoke-page .bs-hero--v1 .bs-hero__grid{grid-template-columns:1.1fr .9fr}
.bespoke-page .bs-hero--v2 .bs-hero__grid{grid-template-columns:.9fr 1.05fr}
.bespoke-page .bs-hero--v2 .bs-hero__form{order:-1;justify-self:start}
.bespoke-page .bs-hero--v3 .bs-hero__grid{grid-template-columns:1fr;max-width:1040px}
.bespoke-page .bs-hero--v3 .bs-hero__copy{align-items:center;text-align:center}
.bespoke-page .bs-hero--v3 .bs-hero__form{max-width:none}
.bespoke-page .bs-hero--v3 .bs-form__body{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;align-items:end}
.bespoke-page .bs-hero--v3 .bs-form__body>button,.bespoke-page .bs-hero--v3 .bs-form__note{grid-column:1/-1}

/* about */
.bespoke-page .bs-about--v1 .bs-about__grid{grid-template-columns:.95fr 1.05fr}
.bespoke-page .bs-about--v2 .bs-about__grid{grid-template-columns:1.05fr .95fr}
.bespoke-page .bs-about--v2 .bs-about__figure{order:2}
/* The mirrored variant puts the photograph on the right, so a seal pinned to
   its left edge hangs over the copy column. It stays on the outer edge. */
.bespoke-page .bs-about--v2 .bs-seal{left:auto;right:-28px}
.bespoke-page .bs-about--v3 .bs-about__grid{grid-template-columns:1fr;gap:32px}
.bespoke-page .bs-about--v3 .bs-about__figure .bs-media{aspect-ratio:21/9}
.bespoke-page .bs-about--v3 .bs-about__copy{max-width:none}
.bespoke-page .bs-about--v3 .bs-about__copy .bs-body{columns:2;column-gap:48px}

/* services */
.bespoke-page .bs-services--v2 .bs-grid-3{grid-template-columns:repeat(2,1fr)}
.bespoke-page .bs-services--v2 .bs-card--photo{flex-direction:row;align-items:stretch}
.bespoke-page .bs-services--v2 .bs-card--photo .bs-media{width:42%;aspect-ratio:auto}
.bespoke-page .bs-services--v3 .bs-card--photo .bs-media{aspect-ratio:1/1}
.bespoke-page .bs-services--v3 .bs-grid-3{grid-template-columns:repeat(4,1fr)}

/* why us */
.bespoke-page .bs-whyus--v2 .bs-whyus__media{inset:0 0 0 42%}
.bespoke-page .bs-whyus--v2 .bs-whyus__panel{margin-left:0;margin-right:auto}
.bespoke-page .bs-whyus--v2 .bs-whyus__media .bs-seal{left:auto;right:34px}
.bespoke-page .bs-whyus--v3 .bs-whyus__media{position:relative;inset:auto;height:min(420px,44vh)}
.bespoke-page .bs-whyus--v3 .bs-whyus__panel{width:100%;margin:-72px auto 0}
.bespoke-page .bs-whyus--v3 .bs-whyus__points{grid-template-columns:repeat(4,1fr)}

/* process */
.bespoke-page .bs-process--v2 .bs-grid-3{grid-template-columns:1fr;max-width:760px;margin-inline:auto}
.bespoke-page .bs-process--v2 .bs-step{display:grid;grid-template-columns:auto 1fr;column-gap:24px;text-align:left}
.bespoke-page .bs-process--v2 .bs-marker{grid-row:span 2;font-size:3rem;opacity:.5}
.bespoke-page .bs-process--v3 .bs-steps{counter-reset:none}
.bespoke-page .bs-process--v3 .bs-step{border:0;background:transparent;box-shadow:none;border-top:3px solid var(--bs-primary,#e4761b);border-radius:0;padding-inline:0}

/* gallery */
.bespoke-page .bs-gallery--v2 .bs-gallery{grid-template-columns:repeat(3,1fr)}
.bespoke-page .bs-gallery--v2 .bs-gallery .bs-media{aspect-ratio:4/3}
.bespoke-page .bs-gallery--v3 .bs-gallery{grid-template-columns:repeat(6,1fr)}
.bespoke-page .bs-gallery--v3 .bs-gallery .bs-media:nth-child(1),.bespoke-page .bs-gallery--v3 .bs-gallery .bs-media:nth-child(6){grid-column:span 2;grid-row:span 2}

/* areas */
.bespoke-page .bs-areas--v2 .bs-areas{direction:rtl}
.bespoke-page .bs-areas--v2 .bs-areas>*{direction:ltr}
.bespoke-page .bs-areas--v3 .bs-areas{grid-template-columns:1fr}
.bespoke-page .bs-areas--v3 .bs-areas__map{min-height:440px}

@media (max-width:900px){
  .bespoke-page .bs-hero--v3 .bs-form__body,.bespoke-page .bs-whyus--v3 .bs-whyus__points,
  .bespoke-page .bs-services--v2 .bs-grid-3,.bespoke-page .bs-services--v3 .bs-grid-3,
  .bespoke-page .bs-gallery--v3 .bs-gallery{grid-template-columns:1fr}
  .bespoke-page .bs-services--v2 .bs-card--photo{flex-direction:column}
  .bespoke-page .bs-services--v2 .bs-card--photo .bs-media{width:100%;aspect-ratio:16/10}
  .bespoke-page .bs-about--v3 .bs-about__copy .bs-body{columns:1}
  .bespoke-page .bs-whyus--v3 .bs-whyus__panel{margin-top:-40px}
}

/* ---------- review slider ----------------------------------------------- */
.bespoke-page .bs-reviews__head{margin-bottom:clamp(28px,3.4vw,44px)}
.bespoke-page .bs-reviews{position:relative;display:flex;align-items:center}
.bespoke-page .bs-reviews>.bs-reviews__track{flex:1;min-width:0}
.bespoke-page .bs-reviews__track{
  display:grid;grid-auto-flow:column;grid-auto-columns:minmax(300px,1fr);gap:24px;
  overflow-x:auto;scroll-snap-type:x mandatory;scroll-behavior:smooth;
  padding:6px 28px 20px;scrollbar-width:none;
  /* Feathered rather than hard-cut: a card sliced flat at the edge reads as
     broken, the same card fading out reads as "there are more". */
  mask-image:linear-gradient(90deg,transparent 0,#000 34px,#000 calc(100% - 34px),transparent 100%);
  -webkit-mask-image:linear-gradient(90deg,transparent 0,#000 34px,#000 calc(100% - 34px),transparent 100%);
}
.bespoke-page .bs-reviews__track>.bs-review:last-child{margin-right:8px}
.bespoke-page .bs-reviews__track::-webkit-scrollbar{display:none}
.bespoke-page .bs-reviews__track>.bs-review{scroll-snap-align:start;height:100%}
.bespoke-page .bs-review__head{display:flex;align-items:center;gap:12px}
.bespoke-page .bs-review__who{display:flex;flex-direction:column;line-height:1.25;flex:1;min-width:0}
.bespoke-page .bs-review__who strong{font-size:.98rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.bespoke-page .bs-review__avatar{width:44px;height:44px;border-radius:999px;flex:none;object-fit:cover;background:var(--bs-primary-strong,#e4761b);color:var(--bs-on-primary,#fff);display:grid;place-items:center;font-family:var(--bs-font-display,inherit);font-weight:900}
.bespoke-page .bs-google{display:inline-flex;flex:none;align-items:center}
.bespoke-page .bs-rating--centred{justify-content:center;margin-top:14px}
.bespoke-page .bs-reviews__arrow{
  position:absolute;top:50%;transform:translateY(-50%);z-index:3;
  width:46px;height:46px;border-radius:999px;border:1px solid var(--bs-line);
  background:var(--bs-surface,#fff);color:var(--bs-ink,#16181d);
  display:grid;place-items:center;cursor:pointer;box-shadow:var(--bs-shadow);
  transition:transform .16s ease,background .16s ease;
}
.bespoke-page .bs-reviews__arrow:hover{background:var(--bs-primary,#e4761b);color:var(--bs-on-primary,#fff);border-color:transparent}
.bespoke-page .bs-reviews__arrow--prev{left:-22px}
.bespoke-page .bs-reviews__arrow--prev .bs-icon{transform:rotate(180deg)}
.bespoke-page .bs-reviews__arrow--next{right:-22px}
@media (max-width:1300px){
  .bespoke-page .bs-reviews__arrow--prev{left:4px}
  .bespoke-page .bs-reviews__arrow--next{right:4px}
}
@media (max-width:620px){
  .bespoke-page .bs-reviews__track{grid-auto-columns:minmax(84%,1fr)}
  .bespoke-page .bs-reviews__arrow{display:none}
}

/* ---------- trust strip -------------------------------------------------- */
.bespoke-page .bs-trustbar .bs-container{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:0;padding-block:26px}
.bespoke-page .bs-trustbar[data-cells="3"] .bs-container{--cells:3}
.bespoke-page .bs-trustbar[data-cells="4"] .bs-container{--cells:4}
.bespoke-page .bs-trustbar[data-cells="5"] .bs-container{--cells:5}
.bespoke-page .bs-trustbar__cell{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;text-align:center;padding:4px 18px;border-left:1px solid var(--bs-line)}
.bespoke-page .bs-trustbar__cell:first-child{border-left:0}
.bespoke-page .bs-trustbar__value{font-family:var(--bs-font-display,inherit);font-weight:900;font-size:clamp(1.5rem,2.2vw,2.1rem);line-height:1;color:var(--bs-primary-strong,#e4761b)}
.bespoke-page .bs-trustbar__label{font-size:.8rem;font-weight:700;letter-spacing:.02em;line-height:1.35;color:var(--bs-muted);max-width:22ch}
.bespoke-page .bs-trustbar__glyph{width:26px;height:26px;color:var(--bs-primary-strong,#e4761b)}

/* ---------- services with a pinned booking widget ------------------------ */
.bespoke-page .bs-services__grid{display:grid;grid-template-columns:380px 1fr;gap:clamp(28px,3.4vw,56px);align-items:start}
.bespoke-page .bs-services__aside{position:sticky;top:130px}
.bespoke-page .bs-services__rows{display:flex;flex-direction:column;gap:18px}
.bespoke-page .bs-servicerow{display:grid;grid-template-columns:210px 1fr;gap:24px;align-items:center;background:var(--bs-surface,#fff);border:1px solid var(--bs-line);border-radius:var(--bs-r);overflow:hidden;transition:transform .2s ease,box-shadow .2s ease}
.bespoke-page .bs-servicerow:hover{transform:translateX(4px);box-shadow:var(--bs-shadow)}
.bespoke-page .bs-servicerow .bs-media{aspect-ratio:4/3;height:100%;border-radius:0}
.bespoke-page .bs-servicerow__glyph{display:grid;place-items:center;height:100%;min-height:150px;background:var(--bs-surface-alt,#f4f5f7);color:var(--bs-primary-strong,#e4761b)}
.bespoke-page .bs-servicerow__body{padding:22px 26px 22px 0;display:flex;flex-direction:column;gap:8px;align-items:flex-start}
.bespoke-page .bs-services--v2 .bs-services__grid{grid-template-columns:1fr 380px}
.bespoke-page .bs-services--v2 .bs-services__aside{order:2}
.bespoke-page .bs-services--v3 .bs-servicerow{grid-template-columns:1fr 210px}
.bespoke-page .bs-services--v3 .bs-servicerow .bs-media{order:2}
.bespoke-page .bs-services--v3 .bs-servicerow__body{padding:22px 0 22px 26px}

/* ---------- process rail -------------------------------------------------- */
.bespoke-page .bs-steps{display:grid;grid-template-columns:repeat(3,1fr);gap:clamp(24px,3vw,44px);position:relative;margin-block:clamp(36px,4vw,60px);list-style:none;counter-reset:none}
.bespoke-page .bs-process .bs-steps::before{content:"";position:absolute;top:44px;left:12%;right:12%;height:2px;background:repeating-linear-gradient(90deg,var(--bs-line) 0 8px,transparent 8px 16px)}
.bespoke-page .bs-step{position:relative;display:flex;flex-direction:column;align-items:center;text-align:center;gap:12px;background:transparent;border:0;box-shadow:none;padding:0}
.bespoke-page .bs-step__ring{position:relative;display:grid;place-items:center;width:88px;height:88px;border-radius:999px;background:var(--bs-surface,#fff);border:2px solid var(--bs-line);color:var(--bs-primary-strong,#e4761b);box-shadow:var(--bs-shadow)}
.bespoke-page .bs-step:hover .bs-step__ring{border-color:var(--bs-primary-strong,#e4761b)}
.bespoke-page .bs-step__icon{width:34px;height:34px}
.bespoke-page .bs-step__num{position:absolute;right:-4px;bottom:-4px;width:30px;height:30px;border-radius:999px;background:var(--bs-primary-strong,#e4761b);color:var(--bs-on-primary,#fff);display:grid;place-items:center;font-family:var(--bs-font-display,inherit);font-weight:900;font-size:.95rem;border:3px solid var(--bs-surface,#fff)}
.bespoke-page .bs-step .bs-body{max-width:34ch}
.bespoke-page .bs-actions--centred{justify-content:center;display:flex}
.bespoke-page .bs-process--v2 .bs-steps{grid-template-columns:1fr;max-width:640px;margin-inline:auto}
.bespoke-page .bs-process--v2 .bs-steps::before{top:0;bottom:0;left:43px;right:auto;width:2px;height:auto;background:repeating-linear-gradient(180deg,var(--bs-line) 0 8px,transparent 8px 16px)}
/* A flex row put the heading beside the ring and dropped the body underneath
   it. The step is two rows of one column beside the ring, so it reads. */
.bespoke-page .bs-process--v2 .bs-step{display:grid;grid-template-columns:88px 1fr;column-gap:26px;row-gap:6px;text-align:left;align-items:start}
.bespoke-page .bs-process--v2 .bs-step__ring{grid-row:1 / span 2;flex:none}
.bespoke-page .bs-process--v2 .bs-step .bs-body{max-width:52ch;padding-bottom:26px}
.bespoke-page .bs-process--v3 .bs-steps::before{display:none}
.bespoke-page .bs-process--v3 .bs-step{padding:28px 22px;background:var(--bs-surface,#fff);border-radius:var(--bs-r);box-shadow:var(--bs-shadow)}

/* ---------- why us: lifted and tightened --------------------------------- */
.bespoke-page .bs-whyus__panel{margin-top:clamp(-72px,-5vw,-32px);padding:clamp(32px,3.4vw,56px)}
.bespoke-page .bs-whyus__media{inset:0 44% 0 0}
.bespoke-page .bs-whyus__media .bs-media{border-radius:0 var(--bs-r-lg) var(--bs-r-lg) 0}
.bespoke-page .bs-whyus .bs-point{padding-right:8px}

/* ---------- gallery ------------------------------------------------------- */
.bespoke-page .bs-gallery{display:grid;grid-template-columns:repeat(var(--gallery-cols,4),1fr);gap:14px;margin-top:clamp(28px,3.4vw,44px)}
.bespoke-page .bs-gallery[data-columns="3"]{--gallery-cols:3}
.bespoke-page .bs-gallery[data-columns="4"]{--gallery-cols:4}
.bespoke-page .bs-gallery[data-columns="2"]{--gallery-cols:2}
.bespoke-page .bs-gallery__tile{display:flex;flex-direction:column;gap:8px}
.bespoke-page .bs-gallery__tile .bs-media{display:block;position:relative;overflow:hidden;border-radius:var(--bs-r);aspect-ratio:1/1;background:var(--bs-surface-alt,#eee)}
.bespoke-page .bs-gallery__tile img{width:100%;height:100%;object-fit:cover;display:block;transition:transform .5s ease}
.bespoke-page .bs-gallery__tile:hover img{transform:scale(1.05)}
.bespoke-page .bs-gallery__tile figcaption{font-size:.82rem;font-weight:600;color:var(--bs-muted);text-align:center}
.bespoke-page .bs-gallery--v2 .bs-gallery{grid-template-columns:repeat(3,1fr)}
.bespoke-page .bs-gallery--v2 .bs-gallery__tile .bs-media{aspect-ratio:4/3}
/* The mosaic left ragged holes whenever the photo count was not exactly
   right. Every variant is now a uniform grid; only the column count varies. */
.bespoke-page .bs-gallery--v3 .bs-gallery{grid-template-columns:repeat(4,1fr)}
.bespoke-page .bs-gallery--v3 .bs-gallery__tile .bs-media{aspect-ratio:3/2}

/* ---------- service-area pins -------------------------------------------- */
.bespoke-page .bs-areas__list{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;list-style:none;margin-block:6px;width:100%}
.bespoke-page .bs-areapin{display:flex;align-items:center;gap:10px;padding:12px 14px;background:var(--bs-surface,#fff);border:1px solid var(--bs-line);border-radius:var(--bs-r);font-weight:700;font-size:.94rem;transition:border-color .16s ease,transform .16s ease}
.bespoke-page .bs-areapin:hover{border-color:var(--bs-primary-strong,#e4761b);transform:translateY(-2px)}
.bespoke-page .bs-areapin__pin{display:grid;place-items:center;width:30px;height:30px;border-radius:999px;background:var(--bs-primary-strong,#e4761b);color:var(--bs-on-primary,#fff);flex:none}
.bespoke-page .bs-areapin__name{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bespoke-page .bs-areapin__go{opacity:.35}
.bespoke-page .bs-areapin:hover .bs-areapin__go{opacity:1;color:var(--bs-primary-strong,#e4761b)}

/* ---------- guarantee ----------------------------------------------------- */
.bespoke-page .bs-guarantee__grid{display:grid;grid-template-columns:1.15fr .85fr;gap:clamp(32px,4vw,64px);align-items:start}
.bespoke-page .bs-guarantee__points{display:flex;flex-direction:column;gap:18px;width:100%}
.bespoke-page .bs-point--row{display:grid;grid-template-columns:auto 1fr;gap:16px;align-items:start}
.bespoke-page .bs-point--row .bs-point__icon{margin-bottom:0}
.bespoke-page .bs-point--row .bs-h4{margin-bottom:4px}
.bespoke-page .bs-guarantee__aside{position:sticky;top:130px}

@media (max-width:1080px){
  .bespoke-page .bs-services__grid,.bespoke-page .bs-guarantee__grid{grid-template-columns:1fr}
  .bespoke-page .bs-services__aside,.bespoke-page .bs-guarantee__aside{position:static;max-width:520px}
  .bespoke-page .bs-services--v2 .bs-services__aside{order:0}
  .bespoke-page .bs-gallery,.bespoke-page .bs-gallery--v3 .bs-gallery{grid-template-columns:repeat(3,1fr)}
  .bespoke-page .bs-trustbar .bs-container{grid-template-columns:repeat(2,1fr);row-gap:20px}
  .bespoke-page .bs-trustbar__cell:nth-child(odd){border-left:0}
}
@media (max-width:820px){
  .bespoke-page .bs-steps,.bespoke-page .bs-process--v3 .bs-steps{grid-template-columns:1fr}
  .bespoke-page .bs-steps::before{display:none!important}
  .bespoke-page .bs-servicerow,.bespoke-page .bs-services--v3 .bs-servicerow{grid-template-columns:1fr}
  .bespoke-page .bs-servicerow .bs-media,.bespoke-page .bs-services--v3 .bs-servicerow .bs-media{order:0;aspect-ratio:16/9}
  .bespoke-page .bs-servicerow__body,.bespoke-page .bs-services--v3 .bs-servicerow__body{padding:22px 24px}
  .bespoke-page .bs-gallery,.bespoke-page .bs-gallery--v2 .bs-gallery,.bespoke-page .bs-gallery--v3 .bs-gallery{grid-template-columns:repeat(2,1fr)}
  .bespoke-page .bs-gallery--v3 .bs-gallery__tile:nth-child(1),.bespoke-page .bs-gallery--v3 .bs-gallery__tile:nth-child(6){grid-column:auto;grid-row:auto}
  .bespoke-page .bs-areas__list{grid-template-columns:1fr}
}

/* ---------- mega menu ----------------------------------------------------- */
.bespoke-page .bs-nav__panel{padding:0;min-width:min(880px,94vw)}
.bespoke-page .bs-nav__panelhead{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:16px 26px;border-bottom:1px solid var(--bs-line);font-size:.74rem;font-weight:800;letter-spacing:.14em;text-transform:uppercase;color:var(--bs-muted)}
.bespoke-page .bs-nav__panelhead>span:first-child{color:var(--bs-ink,#16181d);display:inline-flex;align-items:center;gap:8px}
.bespoke-page .bs-nav__panelhead>span:first-child::after{content:"";width:7px;height:7px;border-radius:999px;background:var(--bs-primary-strong,#e4761b)}
.bespoke-page .bs-nav__count{color:var(--bs-primary-strong,#e4761b)}
.bespoke-page .bs-nav__panelmain{display:grid;grid-template-columns:1fr 300px;gap:0}
.bespoke-page .bs-nav__panelgrid{display:grid;grid-template-columns:repeat(2,1fr);gap:2px;padding:16px}
.bespoke-page .bs-nav__panelgrid--areas{grid-template-columns:repeat(2,1fr)}
.bespoke-page .bs-nav__panel a:not(.bs-btn):not(.bs-textlink){display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:var(--bs-r);color:inherit;font-weight:600}
.bespoke-page .bs-nav__panel a:not(.bs-btn):not(.bs-textlink):hover{background:var(--bs-surface-alt,#f4f5f7)}
.bespoke-page .bs-nav__ctabody .bs-btn{background:var(--bs-primary-strong,#e4761b);color:var(--bs-on-primary,#fff);justify-content:center;width:100%}
/* The generic accent hover made the call button flash a second brand colour;
   it stays its own colour and just lifts. The quote link is full width so the
   two actions line up instead of one being a stray centred word. */
.bespoke-page .bs-nav__ctabody .bs-btn:hover{background:var(--bs-primary-strong,#e4761b);color:var(--bs-on-primary,#fff);filter:brightness(1.08);transform:translateY(-1px)}
.bespoke-page .bs-nav__ctabody .bs-textlink{width:100%;justify-content:center;padding:10px 0;border-radius:var(--bs-r);border:1px solid var(--bs-line)}
.bespoke-page .bs-nav__ctabody .bs-textlink:hover{gap:8px;background:var(--bs-surface-alt,#f4f5f7);border-color:var(--bs-primary-strong,#e4761b)}
.bespoke-page .bs-nav__thumb{flex:none;width:46px;height:46px;border-radius:10px;overflow:hidden;background:var(--bs-surface-alt,#f4f5f7);display:grid;place-items:center}
.bespoke-page .bs-nav__thumb img{width:100%;height:100%;object-fit:cover}
.bespoke-page .bs-nav__thumb--glyph,.bespoke-page .bs-nav__thumb--pin{background:color-mix(in srgb,var(--bs-primary-strong,#e4761b) 12%,#fff);color:var(--bs-primary-strong,#e4761b)}
.bespoke-page .bs-nav__itemtext{display:flex;flex-direction:column;line-height:1.3;min-width:0}
.bespoke-page .bs-nav__itemtext strong{font-size:.95rem}
.bespoke-page .bs-nav__itemtext span{font-size:.78rem;color:var(--bs-muted);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.bespoke-page .bs-nav__cta{border-left:1px solid var(--bs-line);background:var(--bs-surface-alt,#f8f8f9);display:flex;flex-direction:column;border-radius:0 0 var(--bs-r) 0;overflow:hidden}
.bespoke-page .bs-nav__ctamedia{position:relative;margin:0;height:132px;overflow:hidden}
.bespoke-page .bs-nav__ctamedia img{width:100%;height:100%;object-fit:cover}
.bespoke-page .bs-nav__ctaflag{position:absolute;left:12px;bottom:12px;display:inline-flex;align-items:center;gap:6px;padding:6px 11px;border-radius:999px;background:rgb(0 0 0 / .72);color:#fff;font-size:.7rem;font-weight:800;letter-spacing:.04em}
.bespoke-page .bs-nav__ctabody{padding:18px;display:flex;flex-direction:column;gap:10px;align-items:flex-start}
.bespoke-page .bs-nav__ctabody strong{font-family:var(--bs-font-display,inherit);font-size:1.02rem;line-height:1.25}
.bespoke-page .bs-nav__ctabody p{font-size:.83rem;color:var(--bs-muted);line-height:1.5}
.bespoke-page .bs-nav__ctabody .bs-btn{padding:13px 18px;font-size:.86rem}
.bespoke-page .bs-nav__ctabody .bs-btn:hover{background:var(--bs-primary-strong,#e4761b)}

/* ---------- mobile ---------------------------------------------------------- */
@media (max-width:1080px){
  .bespoke-page .bs-nav__drawer{padding-top:20px}
  .bespoke-page .bs-nav__actions .bs-btn{padding:12px 16px;font-size:.85rem}
  .bespoke-page .bs-utility .bs-container{justify-content:center;font-size:.74rem;gap:10px}
  .bespoke-page .bs-utility span:nth-child(3){display:none}
}
@media (max-width:820px){
  .bespoke-page .bs-nav__bar{padding-block:12px}
  .bespoke-page .bs-nav__logo img{max-height:42px}
  .bespoke-page .bs-nav__actions .bs-link-call{display:none}
  .bespoke-page .bs-hero .bs-container{padding-block:100px 48px}
  .bespoke-page .bs-display{font-size:clamp(2.3rem,10vw,3.2rem)}
  .bespoke-page .bs-h2{font-size:clamp(1.75rem,6.4vw,2.3rem)}
  .bespoke-page .bs-seal{width:84px;height:84px;top:-16px;right:-6px}
  .bespoke-page .bs-seal__ring text{font-size:16px}
  .bespoke-page .bs-seal__core{width:44px;height:44px}
  .bespoke-page .bs-footer__wordmark span{font-size:3rem}
  .bespoke-page .bs-reviews__track{grid-auto-columns:minmax(80%,1fr)}
  .bespoke-page .bs-trustbar .bs-container{grid-template-columns:repeat(2,1fr);gap:18px 0}
  .bespoke-page .bs-trustbar__cell{border-left:0;padding:4px 10px}
  .bespoke-page .bs-stats,.bespoke-page .bs-stats[data-count="3"],.bespoke-page .bs-stats[data-count="4"]{--stat-cols:2}
}
@media (max-width:620px){
  .bespoke-page .bs-nav__actions .bs-btn{display:none}
  .bespoke-page .bs-utility{font-size:.7rem}
  .bespoke-page .bs-utility span:nth-child(2){display:none}
  .bespoke-page .bs-form__body{padding:18px}
  .bespoke-page .bs-booking__days{gap:6px}
  .bespoke-page .bs-booking__num{font-size:1.4rem}
  .bespoke-page .bs-sectionhead .bs-btn{width:100%}
  .bespoke-page .bs-footer-cta{flex-direction:column;align-items:flex-start;text-align:left}
  .bespoke-page .bs-guarantee__points{gap:14px}
}

/* ---------- mobile, last word ------------------------------------------- */
/* This block is deliberately the LAST thing in the stylesheet. The per-lead
   variants (.bs-hero--v2 .bs-hero__grid and friends) carry the same
   specificity as the breakpoint rules above and are declared after them, so
   they were winning inside the media query too and the hero stayed
   two-column on a phone with its form pushed off-screen. Same specificity,
   last position, no !important needed. */
@media (max-width:900px){
  .bespoke-page [class*="bs-hero--"] .bs-hero__grid,
  .bespoke-page [class*="bs-about--"] .bs-about__grid,
  .bespoke-page [class*="bs-services--"] .bs-services__grid,
  .bespoke-page [class*="bs-gallery--"] .bs-gallery{grid-template-columns:1fr}
  .bespoke-page [class*="bs-hero--"] .bs-hero__form{order:2;justify-self:stretch;max-width:none;width:100%}
  .bespoke-page [class*="bs-hero--"] .bs-hero__copy{order:1;align-items:flex-start;text-align:left;background:none;padding:0;backdrop-filter:none;gap:16px}
  .bespoke-page [class*="bs-hero--"] .bs-hero__grid{gap:26px}
  .bespoke-page [class*="bs-about--"] .bs-about__copy .bs-body{columns:1}
  .bespoke-page [class*="bs-services--"] .bs-services__aside{order:0;position:static;max-width:none}
  .bespoke-page [class*="bs-process--"] .bs-steps{grid-template-columns:1fr}
  .bespoke-page .bs-hero .bs-actions,.bespoke-page .bs-hero .bs-actions>*{width:100%;justify-content:center}
  .bespoke-page .bs-hero .bs-rating{width:100%;justify-content:center}

  /* The photograph leads on a phone. Two paragraphs of story before any image
     is a wall of text on a 390px screen, and the founders' faces are the
     reason the section works at all. */
  .bespoke-page [class*="bs-about--"] .bs-about__figure{order:1;margin-bottom:26px}
  .bespoke-page [class*="bs-about--"] .bs-about__copy{order:2}

  /* Actions stack full width on a phone, so a click-to-call sitting under one
     reads as left-aligned debris unless it is centred with it. */
  .bespoke-page .bs-actions{width:100%;justify-content:center;text-align:center}
  .bespoke-page .bs-actions>*{width:100%;justify-content:center}
  .bespoke-page .bs-link-call{width:100%;justify-content:center}
  .bespoke-page .bs-footer .bs-link-call,.bespoke-page .bs-footer-cta .bs-link-call{justify-content:center}
  .bespoke-page .bs-phone-xl{width:100%;text-align:center}
}
@media (max-width:620px){
  .bespoke-page [class*="bs-gallery--"] .bs-gallery{grid-template-columns:repeat(2,1fr)}
}

`;
