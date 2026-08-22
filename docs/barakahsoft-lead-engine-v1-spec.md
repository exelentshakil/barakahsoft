# BarakahSoft Lead Engine V1 — Production Master Specification

**Document Version**: 2.0 (Bespoke Generation & Asset Engine Architecture)  
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

```text
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│ 1. INBOUND ACQUISITION (Facebook Ads → home.barakahsoft.com)                            │
│    • Ad copy matches landing hero word-for-word.                                        │
│    • 2-Step intake collects URL, Contact Name, Email, Phone, and Pain Points.           │
│    • Server-Side Meta CAPI deduplication + Instant Email #1 (Confirmation).             │
└─────────────────────────────────────────┬───────────────────────────────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│ 2. INGESTION & FACT EXTRACTION (Inngest: `scrape-run.ts`)                               │
│    • Firecrawl extracts: Real brand colors (#hex), logo URLs, pages inventory, markdown.│
│    • Google Places API extracts: Real star rating (5.0 ★), review count, local address. │
│    • Lead status set to `ready` (Does NOT auto-generate generic broken templates).      │
└─────────────────────────────────────────┬───────────────────────────────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│ 3. OPERATOR STUDIO & BESPOKE GENERATOR (/admin/leads/[id])                              │
│    • Step 1: Review Firecrawl brand tokens, logo, verified rating, and city.            │
│    • Step 2: Bespoke Generation Studio:                                                 │
│      - Review/edit Brief: Business Name, Founder, Industry, City, 6 Core Services.      │
│      - Optional: Input competitor/inspiration `branding.json` to borrow modern layouts. │
│      - Click [🚀 Generate High-Value Bespoke Website] → Builds bespoke site.            │
│    • Step 3: Visual Asset Engine: Slot transparent PNG owner cutout + 6 service images. │
│    • Step 4: Click [Migrate Hotlinks to Supabase Storage] → Permanent WebP assets.      │
│    • Step 5: Configure custom price ($0+$30/mo, $79/mo, $797, $779+$99/mo).             │
│    • Step 6: Customize Delivery Email #2 and click [Send Delivery Email Now].           │
└─────────────────────────────────────────┬───────────────────────────────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│ 4. CLIENT PROPOSAL PORTAL (portal.barakahsoft.com/s/[slug])                             │
│    • Pre-QA Gating: Animated scanning skeleton ("We are building your 48h concept..."). │
│    • Post-QA Unlocked: Full Digital X-Ray, 49-node map grid, competitor radar,          │
│      interactive live preview, custom admin pricing, and 1-click Stripe checkout.       │
└─────────────────────────────────────────┬───────────────────────────────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│ 5. CLOSE & 1-CLICK STANDALONE EXPORT                                                    │
│    • Client pays on Stripe → Inngest marks lead `paid`.                                 │
│    • Operator clicks [Export Next.js Project (.zip)] in Admin.                          │
│    • 100% clean Next.js 15 source code with zero lock-in deployable to Vercel/AWS.      │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

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
* `artifacts`: Funnel sections, extracted assets (pricing, custom logo, hero cutout), `bespoke_homepage_html`, QA status.
* `media_assets`: Uploaded owner cutouts, service visuals, and migrated permanent WebP storage paths.
* `lead_inquiries`: Real-time tracking of proposal views, phone clicks, checkout opens, and quote requests.

### Core API Routes:
* `/api/intake`: 2-step public intake endpoint, fires Meta CAPI, starts Inngest fact scraper.
* `/api/leads/[id]/generate`: On-demand bespoke website generation from brief + `branding.json`.
* `/api/leads/[id]/bespoke`: Real-time bespoke HTML/JSX injection route for Claude Code / Open Code refinements.
* `/api/leads/[id]/rescrape`: 1-click re-crawl of client website with Firecrawl.
* `/api/leads/[id]/assets/archive`: 1-click migration of external image hotlinks into permanent Supabase WebP files.
* `/api/leads/[id]/pricing`: Admin pricing controller ($0+$30/mo, $79/mo, $797 flat, $779+$99/mo).
* `/api/leads/[id]/deliver`: Customizable Email #2 dispatcher via native Brevo REST API.
* `/api/leads/[id]/export`: Real `.zip` export generator creating an isolated Next.js 15 App Router codebase.
* `/api/stripe/checkout`: Stripe checkout session creator matching admin-configured pricing.
* `/api/stripe/webhook`: Handles `checkout.session.completed` and unlocks paid workflow.
