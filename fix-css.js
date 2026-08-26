const fs = require('fs');
let path = 'src/app/bespoke.css';
let content = fs.readFileSync(path, 'utf8');

// The issue is that bs-band-invert forces text to white, but if a nested card uses the default white background (var(--bs-surface)), the white text becomes invisible on the white card.
// Let's protect cards inside inverted bands.
const protectionCSS = `
/* Protect nested cards from receiving inverted text colors when they maintain their own light surface */
.bs-band-invert .bs-card:not(.bs-card-invert):not(.bs-card-primary),
.bs-band-invert .site-stat-card,
.bs-band-invert .site-dispatch-card,
.bs-band-invert .site-cta-card,
.bs-band-invert .site-reassurance-card {
  color: var(--bs-ink);
}
.bs-band-invert .bs-card:not(.bs-card-invert):not(.bs-card-primary) h1,
.bs-band-invert .bs-card:not(.bs-card-invert):not(.bs-card-primary) h2,
.bs-band-invert .bs-card:not(.bs-card-invert):not(.bs-card-primary) h3,
.bs-band-invert .site-stat-card h1,
.bs-band-invert .site-stat-card h2,
.bs-band-invert .site-stat-card h3,
.bs-band-invert .site-stat-card__number,
.bs-band-invert .site-stat-card__label,
.bs-band-invert .site-dispatch-card h1,
.bs-band-invert .site-dispatch-card h2,
.bs-band-invert .site-dispatch-card h3 {
  color: var(--bs-ink) !important;
}
.bs-band-invert .site-stat-card__number {
  color: var(--bs-primary) !important;
}
.bs-band-invert .site-stat-card__label {
  color: var(--bs-ink-muted) !important;
}
`;

content = content + protectionCSS;

fs.writeFileSync(path, content, 'utf8');
console.log("Protected card text colors in inverted bands.");
