# BarakahSoft Lead Engine V1 — Production Master Specification

**Document Version**: 3.0 (AI First Draft → Human Refinement → Approval)  
**Status**: Active Production Specification (`origin/main`)

---

## 1. Executive Summary & Core Value Proposition

BarakahSoft is a high-converting web design and lead-generation engine designed to acquire business owners via targeted Meta (Facebook) ads and convert them through an interactive, evidence-based sales journey.

### The Inbound Acquisition Model:
* **100% Pure Free Lead Magnet**: *"Free 48-Hour Homepage Redesign & AI Speed Audit"*.
* **Zero Public Pricing Barrier**: No credit card, no setup fee, and no payment required on the landing page.
* **Universal Audience**: Trades, professional services, healthcare/doctors, legal, financial, ecommerce, and logistics.

### The Dynamic B2B Monetization Model (Admin-Controlled):
Pricing is 100% hidden from the public and customized per lead inside the Admin Workspace:
1. **Low-Budget Starter / Hosting**: `$0 Setup + $30 / month`
2. **Zero-Down SaaS**: `$0 Setup + $79 / month`
3. **Full One-Time Buyout**: `$797 Flat` (Anchored against standard $1,597 agency value)
4. **Hybrid Setup + Retainer**: `$779 Setup + $99 / month`
5. **Optional Meta Ads Management**: `$500 / month` (or 20% of ad spend)

---

## 2. Identified Architecture Gaps & System Solutions

| System Area | What Was Broken / Causing Issues | Architectural Resolution in V2 |
| :--- | :--- | :--- |
| **Website Generation** | Blind auto-generation created generic, repetitive template cards that failed the visual bar. | **On-Demand Bespoke Generator**: Combines real lead facts + inspiration `branding.json` to generate custom, high-converting websites. |
| **Chat Refinement** | Live previews were decoupled from custom code; editing via Claude Code / Open Code required complex manual steps. | **Direct Bespoke Injector (`/api/leads/[id]/bespoke`)**: Claude Code can update bespoke HTML, JSX, or sections live in Supabase. |
| **Competitor Research** | Competitor lookup was disconnected during intake scrape, resulting in empty competitor tables. | **Integrated Intake Scraper**: `scrapeBusiness` executes Firecrawl (`branding` + `markdown`) and fetches real Google Places data immediately. |
| **Iframe Preview** | Iframe rendered the proposal portal instead of the actual generated website homepage. | **Dynamic View Route**: Renders `/s/[leadSlug]?view=preview` with page switcher (`Home`, `Services`, `About`, `FAQ`, `Contact`). |
| **Asset Persistence** | Sites used fragile external hotlinks that would break if the client shut down their old site. | **1-Click Permanent Asset Migration (`/api/leads/[id]/assets/archive`)**: Sharp converts all images to WebP in Supabase Storage. |
| **Client Portal Gating** | Portals returned 404 or leaked unverified prices before the website was ready. | **Processing Skeleton Gate**: Shows animated progress tracker while in progress; unlocks full proposal + custom price upon QA approval. |

---

## 3. End-to-End Operational Lifecycle

The governing principle: **the AI produces the best possible first draft. It never produces what gets sent.** Human refinement in the middle is the product, not a workaround for the AI being imperfect.

```text
  SCRAPE            Firecrawl + Google Places extract the real facts.
                    No generation happens automatically.
     │
     ▼
  BRIEF             Operator confirms business, city, services, contact.
                    Readiness is scored BEFORE any spend: a thin brief
                    cannot produce a premium site, and generation is
                    refused rather than padded with invented services.
     │
     ▼
  DESIGN DNA        Operator pastes the best site in the client's
                    industry. Its palette, typography, geometry and
                    layout rhythm are extracted. Visual direction only —
                    never its copy, claims or reviews.
     │
     ▼
  AI FIRST DRAFT    Phase 1 builds the sellable core: homepage, every
   (phase 1)        service page, about, FAQ, contact.
                    Three decided steps, not one call:
                      1. Media   — real photos captioned by vision and
                                   matched to slots by subject; slots no
                                   real photo can fill are generated.
                      2. Copy    — written and edited by its own pass.
                      3. Markup  — lays out approved copy and placed
                                   images against the design DNA.
     │
     ▼
  HUMAN REFINES     THE STEP THAT MAKES IT SELLABLE.
                    • Every image slot is named and listed. Generated
                      imagery is labelled a PLACEHOLDER and counted at
                      the top of the panel — an unfinished site must not
                      look finished. Upload the client's real photos, or
                      regenerate a slot from a written prompt.
                    • Rewrite any page from Claude Code / Open Code.
                    • Every write keeps the version it replaced, page by
                      page. Restore is one click and never destroys the
                      current version.
     │
     ▼
  APPROVE           Operator sets this client's price and approves.
                    Nothing reaches a client before this gate.
     │
     ▼
  DELIVERY EMAIL    Brevo sends the private portal link.
     │
     ▼
  CLIENT PORTAL     The report opens: X-ray, local search grid,
                    competitor benchmark, speed audit — every figure
                    REAL, or the section does not render — plus the
                    live site preview and this client's price.
     │
     ▼
  PAID              Stripe confirms.
     │
     ▼
  FULL SITE         Phase 2 builds the depth: location × service pages,
   (phase 2)        service areas, advice articles. Reuses the copy and
                    photography the client already approved, so deep
                    spend only happens on leads that convert.
```

### Non-negotiables

1. **No invented facts, anywhere.** Not on a generated page, and not in the client report. Every claim traces to the lead's own scrape or to real measured data. A section with no real data behind it does not render.
2. **Generated imagery is a placeholder.** It fills a slot so the draft can be judged. It is not what ships if the client has real photography.
3. **A generated page cannot go off-brand or render broken.** Markup is written against a closed class vocabulary bound to compiled design tokens, so it has no way to express a literal colour or reference CSS that does not exist.
4. **Every internal link resolves.** Routes not yet built are not linked.
5. **Nothing reaches a client without human approval.**

---

## 4. The High-Value Website Standard (Bespoke Blueprint)

Every generated website must match the visual caliber of top industry leaders (Spennato, BlueBuilt, Roofworx):

1. **Top 24/7 Utility Bar**: Direct clickable phone link (`Need emergency help? Call...`) + Google 5.0 ★ rating badge + CTA button.
2. **Hero Section**:
   * Bold, high-contrast typography: `#1 RATED [INDUSTRY] IN [CITY]`.
   * Verified credentials badge (`Licensed & Insured Local Experts`).
   * Transparent PNG owner cutout on polo/truck background.
   * Trust pills (`⭐ 5.0 on Google` · `🛡️ 100% Guaranteed` · `⚡ Same-Day Estimates`).
   * Instant Free Quote form.
3. **Core Services**: 6 dedicated high-definition visual cards routing to `/services/[slug]`.
4. **Content Depth**: 8 launch articles injected with valid `Article` and `FAQPage` JSON-LD schema for Google AI Overview citation.
5. **Conversion Tech**: Sticky mobile 1-tap call bar + Crisp customer chat integration.

---

## 5. Technical Stack & API Endpoints

### Database Architecture (Supabase):
* `leads`: Customer contact info, slug, custom domain, lead status, paid timestamps.
* `scrape_results`: Firecrawl markdown, brand colors, typography, Google Places data, PageSpeed metrics.
* `artifacts`: Funnel sections, extracted assets, `bespoke_homepage_html`, `bespoke_pages`, QA status, plus the decided plans — `inspiration_branding` (design DNA), `design_tokens`, `copy_plan`, `media_plan`, `chrome_spec`, `generation_phase`.
* `media_assets`: Every image the site may use, mirrored into Storage as WebP with a vision `caption`, a `subject` classification, and a `usable` verdict. Hotlinking is never permitted — Google Places photo URLs carry an API key, and hotlinking them published it in page source.
* `page_versions`: Per-page history. Every write keeps the version it replaced; restore copies it back.
* `lead_inquiries`: Real-time tracking of proposal views, phone clicks, checkout opens, and quote requests.

### Core API Routes:
* `/api/intake`: 2-step public intake endpoint, fires Meta CAPI, starts Inngest fact scraper.
* `/api/leads/[id]/generate`: Starts a generation phase in the background. `POST {phase: 1}` builds the sellable core; `{phase: 2}` builds the full site after approval. `GET` returns live build progress, so a browser reload never loses a running build.
* `/api/leads/[id]/inspiration`: Extracts design DNA from a reference site URL, or saves a hand-edited spec.
* `/api/leads/[id]/slots`: `GET` lists every named image slot and how many are still placeholders. `POST` uploads a real photo into a slot, or regenerates it from a prompt.
* `/api/leads/[id]/versions`: `GET` page version history. `POST` restores a version.
* `/api/leads/[id]/bespoke`: Page injection for Claude Code / Open Code. Sanitized and version-recorded like every other write.
* `/api/diag/openai`: Admin-only. Reports which models the live key is entitled to, with release dates.
* `/api/leads/[id]/rescrape`: 1-click re-crawl of client website with Firecrawl.
* `/api/leads/[id]/assets/archive`: 1-click migration of external image hotlinks into permanent Supabase WebP files.
* `/api/leads/[id]/pricing`: Admin pricing controller ($0+$30/mo, $79/mo, $797 flat, $779+$99/mo).
* `/api/leads/[id]/deliver`: Customizable Email #2 dispatcher via native Brevo REST API.
* `/api/leads/[id]/export`: Real `.zip` export generator creating an isolated Next.js 15 App Router codebase.
* `/api/stripe/checkout`: Stripe checkout session creator matching admin-configured pricing.
* `/api/stripe/webhook`: Handles `checkout.session.completed` and unlocks paid workflow.
