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
  --bs-max:1240px;
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
.bespoke-page p,.bespoke-page h1,.bespoke-page h2,.bespoke-page h3,.bespoke-page h4,.bespoke-page ul,.bespoke-page ol,.bespoke-page figure{margin:0}
.bespoke-page ul,.bespoke-page ol{padding:0;list-style:none}
.bespoke-page img,.bespoke-page svg{max-width:100%}
.bespoke-page a{color:inherit;text-decoration:none}

/* ---------- layout ----------------------------------------------------- */
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
  background:var(--bs-accent,#c1273c);color:#fff;padding:9px 16px;border-radius:4px;letter-spacing:.12em;
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
  background:var(--bs-primary,#e4761b);color:var(--bs-on-primary,#fff);
  font-family:var(--bs-font-display,inherit);font-weight:800;font-size:.95rem;letter-spacing:.02em;
  padding:17px 30px;border:0;border-radius:var(--bs-r);cursor:pointer;white-space:nowrap;
  box-shadow:0 10px 24px rgb(0 0 0 / .16);
  transition:transform .18s ease,box-shadow .18s ease,filter .18s ease;
}
.bespoke-page .bs-btn:hover{transform:translateY(-2px);box-shadow:0 16px 34px rgb(0 0 0 / .22);filter:brightness(1.05)}
.bespoke-page .bs-btn:focus-visible,.bespoke-page a:focus-visible,.bespoke-page button:focus-visible{outline:3px solid var(--bs-accent,#c1273c);outline-offset:3px}
.bespoke-page .bs-btn--ghost{background:transparent;color:inherit;border:2px solid currentColor;box-shadow:none}
.bespoke-page .bs-btn--ghost:hover{background:currentColor;color:var(--bs-surface,#fff);filter:none}
.bespoke-page .bs-btn--light{background:#fff;color:var(--bs-ink,#16181d)}
.bespoke-page .bs-btn--wide{width:100%}
.bespoke-page .bs-actions{display:flex;flex-wrap:wrap;gap:14px;align-items:center}
.bespoke-page .bs-link-call{display:inline-flex;align-items:center;gap:9px;font-weight:800;font-size:1.02rem}
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
.bespoke-page .bs-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:clamp(16px,2vw,28px);text-align:center}
.bespoke-page .bs-stat__value{display:block;font-family:var(--bs-font-display,inherit);font-weight:900;font-size:clamp(2.2rem,3.6vw,3.4rem);line-height:1;color:var(--bs-primary,#e4761b)}
.bespoke-page .bs-stat__label{display:block;margin-top:8px;font-size:.76rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;opacity:.75}
.bespoke-page .bs-rating{display:inline-flex;align-items:center;gap:10px;font-weight:700;font-size:.92rem}
.bespoke-page .bs-rating svg{color:#f5b301;fill:#f5b301}
.bespoke-page .bs-icon{display:inline-flex;width:24px;height:24px;flex:none;align-items:center;justify-content:center}
.bespoke-page .bs-icon svg{width:100%;height:100%}
.bespoke-page .bs-rule{display:block;width:52px;height:4px;background:var(--bs-primary,#e4761b);border-radius:2px}
.bespoke-page .bs-marker{font-family:var(--bs-font-display,inherit);font-weight:900;font-size:2.4rem;line-height:1;color:var(--bs-primary,#e4761b);opacity:.28}
.bespoke-page .bs-accent{color:var(--bs-primary,#e4761b)}
.bespoke-page .bs-muted{color:var(--bs-muted)}

/* ---------- founder badge ---------------------------------------------- */
.bespoke-page .bs-founder-badge{
  position:absolute;left:18px;bottom:18px;z-index:5;
  display:flex;align-items:stretch;box-shadow:var(--bs-shadow-lg);border-radius:8px;overflow:hidden;max-width:calc(100% - 36px);
}
.bespoke-page .bs-founder-badge>*:first-child{background:#fff;display:flex;align-items:center;justify-content:center;padding:10px 14px}
.bespoke-page .bs-founder-badge>*:first-child img{max-height:40px;width:auto;object-fit:contain}
.bespoke-page .bs-founder-badge>*:last-child{background:var(--bs-primary,#e4761b);color:var(--bs-on-primary,#fff);padding:12px 20px;display:flex;flex-direction:column;justify-content:center;line-height:1.25}

/* ---------- lead form -------------------------------------------------- */
.bespoke-page .bs-form{background:#fff;color:var(--bs-ink,#16181d);border-radius:var(--bs-r);box-shadow:var(--bs-shadow-lg);overflow:visible;width:100%;max-width:460px}
.bespoke-page .bs-form__head{position:relative;background:var(--bs-primary,#e4761b);color:var(--bs-on-primary,#fff);padding:22px 24px;text-align:center;border-radius:var(--bs-r) var(--bs-r) 0 0}
.bespoke-page .bs-form__head::after{content:"";position:absolute;left:50%;bottom:-11px;transform:translateX(-50%);border-left:12px solid transparent;border-right:12px solid transparent;border-top:12px solid var(--bs-primary,#e4761b)}
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
.bespoke-page .bs-hero{position:relative;padding:0;min-height:clamp(640px,92vh,940px);display:flex;align-items:center;overflow:hidden;background:var(--bs-ink,#16181d);color:#fff}
.bespoke-page .bs-hero .bs-container{position:relative;z-index:3;padding-block:clamp(120px,14vh,180px) clamp(64px,8vh,110px);width:100%}
.bespoke-page .bs-hero__bg{position:absolute;inset:0;z-index:0;border-radius:0;aspect-ratio:auto}
.bespoke-page .bs-hero__bg>img{width:100%;height:100%;object-fit:cover}
.bespoke-page .bs-hero::after{
  content:"";position:absolute;inset:0;z-index:1;
  background:
    linear-gradient(100deg,rgb(0 0 0 / .84) 0%,rgb(0 0 0 / .62) 46%,rgb(0 0 0 / .30) 100%),
    linear-gradient(200deg,rgb(var(--bs-primary-rgb,228 118 27) / .30) 0%,transparent 62%);
}
.bespoke-page .bs-hero .bs-display{overflow:visible;max-width:15ch}
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
.bespoke-page .bs-utility{background:var(--bs-accent,#c1273c);color:#fff;font-size:.8rem;font-weight:600}
.bespoke-page .bs-utility .bs-container{display:flex;flex-wrap:wrap;justify-content:space-between;gap:12px;padding-block:9px}
.bespoke-page .bs-nav{position:sticky;top:0;z-index:100;background:var(--bs-ink,#16181d);color:#fff;box-shadow:0 2px 20px rgb(0 0 0 / .2)}
.bespoke-page .bs-nav__bar{display:flex;align-items:center;justify-content:space-between;gap:24px;width:100%;max-width:var(--bs-max);margin-inline:auto;padding:14px var(--bs-gutter)}
.bespoke-page .bs-nav__logo{display:flex;align-items:center;gap:10px;font-family:var(--bs-font-display,inherit);font-weight:900;font-size:1.15rem;letter-spacing:-.01em}
.bespoke-page .bs-nav__logo img{max-height:52px;width:auto;object-fit:contain}
.bespoke-page .bs-nav__links{display:flex;align-items:center;gap:6px}
.bespoke-page .bs-nav__links>li,.bespoke-page .bs-nav__item{position:relative}
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
.bespoke-page [data-nav-drawer] a{display:block;padding:13px 0;border-bottom:1px solid rgb(255 255 255 / .12);font-weight:600}
.bespoke-page [data-nav-close]{background:none;border:0;color:inherit;font-size:1.6rem;cursor:pointer;padding:4px 10px}

/* ---------- footer ----------------------------------------------------- */
.bespoke-page .bs-footer{background:var(--bs-ink,#16181d);color:rgb(255 255 255 / .74);padding-top:clamp(48px,6vw,88px)}
.bespoke-page .bs-footer a{color:inherit}
.bespoke-page .bs-footer a:hover{color:#fff}
.bespoke-page .bs-footer__cols{display:grid;grid-template-columns:1.6fr 1fr 1fr 1fr;gap:clamp(24px,3vw,48px)}
.bespoke-page .bs-footer__col li{padding:6px 0;font-size:.93rem}
.bespoke-page .bs-footer h3,.bespoke-page .bs-footer .bs-h4{color:#fff;font-size:.78rem;letter-spacing:.14em;text-transform:uppercase;margin-bottom:12px}
.bespoke-page .bs-footer__col img{max-height:56px;width:auto;object-fit:contain}
.bespoke-page .bs-footer__bottom{margin-top:clamp(32px,4vw,56px);border-top:1px solid rgb(255 255 255 / .12);padding-block:22px;display:flex;flex-wrap:wrap;justify-content:space-between;gap:14px;font-size:.85rem}
.bespoke-page .bs-footer-cta{background:var(--bs-primary,#e4761b);color:var(--bs-on-primary,#fff);border-radius:var(--bs-r-lg);padding:clamp(28px,3.4vw,52px);display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:24px;box-shadow:var(--bs-shadow-lg);margin-bottom:clamp(32px,4vw,56px)}
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
  .bespoke-page .bs-stats{grid-template-columns:repeat(2,1fr)}
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
.bespoke-page .bs-section--brand{background:var(--bs-primary,#e4761b);color:var(--bs-on-primary,#fff)}
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

`;
