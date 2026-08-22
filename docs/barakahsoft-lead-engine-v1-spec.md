# BarakahSoft Lead Engine V1 — Production Master Specification

**Status**: Production Complete & Verified (`origin/main`).

---

## 1. Product & Commercial Model

BarakahSoft is a dedicated lead-generation and high-converting website engine for US businesses and home-service providers (electricians, roofers, HVAC, plumbers, remodelers, movers, restoration, contractors, doctors, professional services, and ecommerce).

### The Inbound Hook:
* **100% Pure Free Lead Magnet**: Targeted Facebook Ads offering a **Free 48-Hour Homepage Redesign & Local Speed Audit**.
* **Zero Public Pricing Barrier**: No credit card, no setup fee, no payment required on the landing page.

### The B2B Dynamic Pricing Engine (Admin-Controlled per Lead):
Once trust is established through a live interactive proposal, operators tailor the exact pricing model for the customer:
1. **Low-Budget Starter / Hosting**: `$0 Setup + $30 / month`
2. **Zero-Down SaaS**: `$0 Setup + $79 / month`
3. **Full One-Time Buyout**: `$797 Flat` (Anchored against $1,597 agency standard)
4. **Hybrid Setup + Retainer**: `$779 Setup + $99 / month`
5. **Optional Meta Ads Management**: `$500 / month` (or 20% of ad spend)

---

## 2. Lead Lifecycle & Order Flow

```text
1. INBOUND FACEBOOK AD (Meta Ads)
   Ad Hook: "A professional homepage redesign, for free. There's genuinely no catch."
   Pixel ID: 1777973306713413 + Server-Side Meta CAPI Deduplication
        ↓
2. UNIVERSAL LANDING PAGE INTAKE (home.barakahsoft.com)
   2-Step form: Website URL + Problem Checklist + First Name, Email, Phone
        ↓
3. INSTANT CONFIRMATION EMAIL #1 (Resend / Brevo API)
   "We received your request — track your redesign live: portal.barakahsoft.com/s/[slug]?auth=[signed_token]"
        ↓
4. AUTOMATED RESEARCH & ASSET EXTRACTION (Inngest + Firecrawl + Google Places + PageSpeed)
   • Extracts real brand tokens, vector logos, Google review velocity, licenses, and services.
   • Computes 7×7 Local Search Matrix (49 scan nodes) & 4-competitor benchmark.
   • Generates 28 dedicated service routes + 8 launch articles with JSON-LD schema.
        ↓
5. OPERATOR STUDIO & QA GATE (admin command center /admin/leads/[id])
   • Visual Asset Engine: Slot in transparent PNG owner cutout, logo, and 6 service card visuals.
   • 1-Click Remote Asset Migration (/api/leads/[id]/assets/archive): Downloads & optimizes hotlinks to WebP in Supabase.
   • Sets custom pricing ($0 + $30/mo, $79/mo, $797, $779 + $99/mo).
   • Operator customizes Delivery Email #2 and clicks [Approve QA & Send Delivery Email].
        ↓
6. CLIENT PRIVATE INTERACTIVE PROPOSAL (portal.barakahsoft.com/s/[slug])
   • Processing Gate: Shows blurred scanning state until QA approval.
   • Unlocked Proposal:
     - 6 Problem-to-Solution Cards (customized to their intake focus)
     - Google AI Overview & Generative Search Readiness (GEO)
     - Diagnostic Speed Health Scorecard (29 → 98 / 100)
     - Interactive 49-node Local Search Grid & Inspector
     - Competitor Benchmark & 6-Axis Radar Chart
     - Tailored Admin Pricing & 1-Click Stripe Checkout Modal
        ↓
7. 1-CLICK CLOSE & STRIPE CHECKOUT
   Client approves terms → Stripe Checkout session created → Inngest marks lead paid.
        ↓
8. 1-CLICK STANDALONE EXPORT & GO-LIVE (48h SLA)
   Custom domain connection (CNAME to Vercel/AWS) + 100% standalone clean Next.js project zip export.
```

---

## 3. The 6 Core Pain Points & Architectural Resolutions

1. **Outdated Mobile Design & Slow Speed**:
   * *Old Friction*: 8.4s slow mobile load on 4G cellular; hard to find phone numbers.
   * *Resolution*: 0.12s mobile first-paint with persistent 1-tap emergency call bar.
2. **Visitors Leaving Without Calling**:
   * *Old Friction*: Real 5-star reviews and licenses buried where 70% of visitors never scroll.
   * *Resolution*: Google 5.0 Rating verified badge & license proof placed front-and-center.
3. **Nobody Finds Us on Google Search**:
   * *Old Friction*: Missing from over 75% of surrounding customer search zones.
   * *Resolution*: 28 dedicated localized service landing pages establishing geographic search relevance.
4. **Invisible in AI Search (ChatGPT & Gemini)**:
   * *Old Friction*: Zero structured schema; AI search engines cannot verify business credentials.
   * *Resolution*: Complete `LocalBusiness` JSON-LD schema & Entity FAQ markup so AI search models cite the business.
5. **High-Ticket Jobs Bundled in 1 Generic Paragraph**:
   * *Old Friction*: High-margin services lumped in bulleted lists, losing long-tail search traffic.
   * *Resolution*: Dedicated high-ticket landing routes with permit guidance, technical details, and instant quote forms.
6. **Thin Content & Empty Pages**:
   * *Old Friction*: Zero helpful guides or code compliance articles.
   * *Resolution*: 8 original, human-reviewed launch articles providing authoritative depth from day one.

---

## 4. Technical Architecture & Database Models

### Core Database Tables (Supabase):
- `leads`: Contact info, company name, phone, slug, source URL, UTM parameters, lead status (`new`, `scraping`, `qa_approved`, `delivered`, `paid`, `live`), paid_at, delivered_at.
- `scrape_results`: Firecrawl markdown, brand colors, typography, Google Places data, PageSpeed metrics.
- `artifacts`: Pre-rendered funnel sections, 28 service route definitions, 8 launch article contents, extracted assets (pricing, custom logo, hero cutout), QA checklist status.
- `media_assets`: Uploaded owner cutouts, service visuals, and migrated permanent WebP storage paths.
- `lead_inquiries`: Real-time tracking of proposal views, phone clicks, checkout opens, and visitor quote/callback requests.

### Core API Endpoints:
- `/api/intake`: Ingests lead URL, fires Meta CAPI, triggers instant Confirmation Email #1, starts automated Inngest research chain.
- `/api/s/[leadSlug]/events`: Real-time tracking of customer proposal view, phone clicks, and modal opens.
- `/api/s/[leadSlug]/quote-request`: Delivers customer quote/callback inquiries directly to business owner's email and logs to database.
- `/api/leads/[id]/pricing`: Sets dynamic per-lead proposal pricing ($0 setup + $30/mo, $79/mo, $797 flat, $779 + $99/mo).
- `/api/leads/[id]/assets/archive`: 1-Click crawler that downloads, optimizes (Sharp WebP), and archives remote hotlinks to Supabase Storage.
- `/api/leads/[id]/deliver`: Customizable Email #2 dispatcher with signed magic link.
- `/api/stripe/checkout`: Creates one-time or subscription Stripe checkout session matching admin pricing.
- `/api/stripe/webhook`: Handles `checkout.session.completed`, unlocks full sitemap, and triggers Inngest go-live.

---

## 5. Visual System & Codebase Architecture

- **Visual Palette**: BarakahSoft Deep Navy (`#07284d`), Gold (`#ffd12d`), Electric Accent (`#0c68c8`), Canvas (`#ffffff` / `#f8fbfe`).
- **Atomic Modular Architecture**:
  - Components follow single-responsibility principles (SRP) and keep files clean, modular, and < 150 lines.
  - Zero monolithic files; easy feature-by-feature extension without regressions.
  - Standalone Next.js exports are 100% clean and decoupled from internal backend infrastructure.
