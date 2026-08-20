# BarakahSoft Lead Engine V1 — Production Master Specification

Status: Phase 1 complete; Phase 2 & 3 production build active.

## 1. Product & Commercial Model

BarakahSoft is a dedicated lead-generation and high-converting website engine for US home-service businesses. We acquire leads through targeted Facebook Ads offering a **Free 48-Hour Homepage Redesign & Queens Local Search X-Ray Audit**. 

Once trust is established through a live interactive proposal, qualified clients purchase the **Complete Website Package for $797 flat** (anchored against a standard $1,597 agency value) and optionally retain BarakahSoft for recurring Meta ads management ($497/mo minimum or 20% of ad spend).

### The 8 Target Home-Service Trades & Unit Economics:
| Trade | High-Margin Service | Typical Job Value | ROI on $797 Website |
| :--- | :--- | :--- | :--- |
| **Electricians** | 200-Amp Panel Upgrade / EV Charger | $2,500 – $4,500 | **1 job = 3x–5x ROI** |
| **Roofers** | Full Roof Replacement | $8,000 – $18,000 | **1 job = 10x–20x ROI** |
| **HVAC** | Heat Pump / AC Replacement | $6,000 – $14,000 | **1 job = 8x–15x ROI** |
| **Restoration** | Water Damage / Mold Remediation | $3,500 – $12,000 | **1 job = 4x–15x ROI** |
| **Plumbers** | Main Line Sewer Replacement / Water Heater | $2,000 – $6,000 | **1 job = 3x–7x ROI** |
| **Remodelers** | Kitchen / Bathroom Remodel | $15,000 – $45,000 | **1 job = 20x–50x ROI** |
| **Movers** | Long Distance / Full House Move | $1,800 – $5,000 | **1 job = 2x–6x ROI** |
| **Contractors** | Commercial Tenant Build-Outs | $10,000 – $50,000 | **1 job = 12x–60x ROI** |

---

## 2. Lead Lifecycle & Order Flow

```text
1. INBOUND FACEBOOK AD (Andromeda Meta Ads)
   Ad Hook: "Is your business showing up when customers ask Google & ChatGPT?"
   Pixel ID: 1777973306713413 + Server-Side CAPI
        ↓
2. LANDING PAGE INTAKE (home.barakahsoft.com)
   2-Step form: Website URL + 6 Selected Pain Points + First Name, Email, Phone
        ↓
3. INSTANT CONFIRMATION EMAIL #1 (Brevo API)
   "We received your website! Track your redesign live: https://portal.barakahsoft.com/s/[slug]?auth=magic_[token]"
        ↓
4. AUTOMATED RESEARCH & REBUILD ENGINE (Inngest + Firecrawl + Google Places + PageSpeed + AI)
   • Extracts real brand tokens (#F9DB15, #2B303B), logo, NYC Lic. #11288, 450+ 5-star reviews.
   • Computes Queens 7×7 Local Search Grid (49 scan nodes) & competitor benchmarks.
   • Generates 28 dedicated service routes + 8 human-reviewed launch articles.
   • Builds 0.12s mobile-first Next.js homepage preview.
        ↓
5. 2-MINUTE OPERATOR QA GATE (admin command center)
   Operator verifies facts, checks 7x7 grid, and clicks [Send Delivery Email].
        ↓
6. AUTOMATED PROPOSAL DELIVERY EMAIL #2 (Brevo API)
   "Your Rebuilt Homepage & Queens Market Audit are Ready!"
        ↓
7. CUSTOMER INTERACTIVE PROPOSAL (portal.barakahsoft.com)
   • 6 Problem-to-Solution Cards (customized to their selected intake pains)
   • Interactive 49-node Queens search matrix
   • Competitor Benchmark & 6-Axis Radar
   • Google AI Overview & PAA direct citation previews
   • $1,597 Value vs. $797 Launch Pricing (Save $800 Today)
        ↓
8. 1-CLICK CLOSE & STRIPE CHECKOUT
   Contractor clicks [Approve & Launch My Website ($797)] → Pays via Card/Apple Pay.
        ↓
9. WHITE-GLOVE GO-LIVE (48h SLA)
   Custom domain connection (CNAME to Vercel/AWS) + 100% standalone Next.js source zip export.
```

---

## 3. The 6 Core Pain Points & Architectural Resolutions

1. **Outdated Mobile Design & Slow Speed**:
   * *Old Site Friction*: 8.4s slow mobile load on 4G cellular.
   * *Rebuilt Resolution*: 0.12s mobile load time with a sticky 1-tap emergency call bar on every screen.
2. **Visitors Leaving Without Calling**:
   * *Old Site Friction*: 450+ 5-star Google reviews and 37 years of NYC licensing were hidden at footer.
   * *Rebuilt Resolution*: Google 5.0 Rating verified badge & Master Lic. #11288 headline proof placed front-and-center.
3. **Nobody Finds Us on Google Search**:
   * *Old Site Friction*: 49 Queens scan checkpoints showed rank #1 in Flushing, but missing from Astoria, LIC, and Forest Hills.
   * *Rebuilt Resolution*: 28 localized Queens service landing pages establishing direct geographic search relevance.
4. **Invisible in AI Search (ChatGPT & Gemini)**:
   * *Old Site Friction*: Zero structured schema. AI engines cannot verify license numbers or service offerings.
   * *Rebuilt Resolution*: Complete `LocalBusiness` JSON-LD schema & Entity FAQ markup so AI search models verify and cite York Electrical as #1.
5. **Big Jobs Bundled in 1 Generic Paragraph**:
   * *Old Site Friction*: $3,500 panel upgrades and $2,000 EV charger installs were lumped in one single bullet list.
   * *Rebuilt Resolution*: Dedicated high-ticket landing routes with NYC permit guidance, panel sizing details, and instant quote forms.
6. **Thin Content & Empty Pages**:
   * *Old Site Friction*: Zero helpful articles explaining NYC electrical codes, DOB violations, or LED retrofit ROI.
   * *Rebuilt Resolution*: 8 original, human-reviewed launch articles providing authoritative depth from day one.

---

## 4. Technical Architecture & Database Models

### Core Database Tables (Supabase):
- `leads`: Contact info, company name, phone, source URL, UTM parameters, lead status (`new`, `scraping`, `brief_built`, `preview_ready`, `contacted`, `paid`, `live`, `lost`), magic token.
- `scrape_results`: Firecrawl markdown, brand colors, typography, Google Places data, PageSpeed metrics.
- `artifacts`: Pre-rendered funnel sections, 28 service route definitions, 8 launch article contents, `LocalBusiness` JSON-LD schema, QA checklist status.
- `close_plan_steps`: Timed Brevo email sequences, call scripts, objection handling logs.
- `subscriptions` / `payments`: Stripe checkout session IDs, customer IDs, payment timestamps.

### API Routes:
- `/api/intake`: 2-Step intake endpoint. Inserts lead, fires Meta CAPI, triggers instant Brevo Confirmation Email #1.
- `/api/s/[leadSlug]/events`: Real-time tracking of customer proposal view, before/after slider toggle, and map clicks.
- `/api/stripe/checkout`: Generates $797 Stripe checkout session for full website package.
- `/api/stripe/webhook`: Handles `checkout.session.completed`, unlocks full sitemap, initiates domain go-live.
- `/api/leads/[id]/qa`: 6-gate operator sign-off and Brevo Email #2 dispatch.

---

## 5. Visual System & Typography Standards

- **Primary Action**: `#533AFD` (Stripe Purple)
- **Ink / Headings**: `#0D1738`
- **Body Text**: `#42506A`
- **Canvas Background**: `#F9F9FF`
- **Card Background**: `#FFFFFF` with 1px border `#E5E7F2`
- **Brand Accent**: BarakahSoft Yellow `#FFD12D` (Subtle logo/badge accent only; never used for body text)
- **Geometry**: 8px grid spacing, 8px card radius, 4px button radius.
- **Badges**: Single-line horizontal pills with `whitespace-nowrap inline-flex items-center gap-1.5` and paired icons.
