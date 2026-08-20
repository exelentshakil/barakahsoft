# BarakahSoft Dashboard Design PRD

Status: Design source of truth for the admin dashboard and client report prototypes.

## 1. Product Goal

Design two connected experiences for the same lead:

- **Admin workspace**: extremely simple for the operator. It answers *“What should I do next, and will it move this lead toward payment?”* (like a clean Shopify orders fulfillment dashboard).
- **Client report**: persuasive, visual, and frictionless. It answers *“What did you find, what did you build, and why should I buy the full website?”*

The report is the main sales asset. It must make the value of the work obvious in under 60 seconds without requiring a technical explanation or phone pitch.

## 2. The 8 Target Trades & High-Ticket Monetization

BarakahSoft exclusively targets 8 high-ticket home-service trades where a single closed customer pays for the $797 website multiple times over:

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

## 3. End-to-End Story & Order Lifecycle

Every lead follows a Shopify-like visual lifecycle tracker:

```text
1. Website Received (Instant Brevo confirmation email with private magic link)
    ↓
2. AI Search & Local Audit (PageSpeed 29 → 98, 7×7 Queens map grid, LocalBusiness schema)
    ↓
3. Homepage & Sitemaps Built (28 service routes + 8 launch articles drafted)
    ↓
4. Customer Review & Approval (Interactive Before/After slider, radar benchmark, 1-click approve)
    ↓
5. Payment & Handoff ($797 Stripe checkout, custom DNS connection, standalone Next.js zip)
```

## 4. Visual Direction & Graphic Design Principles

### The 80/20 Visual-to-Text Rule
- **80% Visual**: Interactive Before/After split sliders, 7×7 local map grids, radar charts, circular progress gauges, sitemap node trees, and progress rails.
- **20% Text**: Concise labels, single-sentence takeaways, and high-contrast action buttons.
- **Visual Hierarchy (Eye-Tracking)**: Every viewport must guide the user's eye directly to **one primary goal** (e.g. *See New Homepage* or *Approve & Continue*).

### Colors
- **Primary Action**: `#533AFD` (Stripe Purple) — used exclusively for the single most important action per screen.
- **Ink**: `#0D1738` — deep high-contrast text and authoritative headings.
- **Body text**: `#42506A` — legible, accessible neutral slate.
- **Page background**: `#F9F9FF` — clean, airy canvas.
- **Card background**: `#FFFFFF` — 1px border `#E5E7F2`, subtle soft elevation.
- **Success / Lift**: `#0B8F5B` (Green) — passed audits, positive rankings, complete milestones.
- **Warning**: `#B7791F` (Amber) — rank 4–10 edge checkpoints, items needing review.
- **Friction / Problem**: `#BA1A1A` (Red) — missing rank 11+ checkpoints, 8.4s mobile load time.
- **BarakahSoft Yellow `#FFD12D`**: Reserved strictly for subtle branding accents and logo highlights. **Never use yellow for body text or labels.**

### Geometry & Spacing
- **8px Grid**: All spacing, padding, and margins use strict 8px increments (8px, 16px, 24px, 32px, 48px).
- **Desktop Width**: 1120px to 1280px maximum content width.
- **Card Radius**: 8px (or 16px on hero containers) for clean structural appearance.
- **Button Radius**: 4px to 6px for a precise, tool-like feel.
- **Pills / Status Chips**: Full pill radius (`rounded-full`) to distinguish status from actions.

## 5. Admin Workspace Specification

### Navigation
- Clean white sidebar (280px width) with the official BarakahSoft wordmark.
- Active navigation item uses light purple background (`#E3DFFF`) and primary purple text (`#533AFD`).
- Inactive items remain high-contrast muted slate (`#42506A`).

### Command Center: Today View
Like a Shopify orders dashboard, it shows only what needs operator action today:
1. **Urgent Decision Hero**: The #1 prioritized lead (e.g., *York Electrical — Send Master Report*).
2. **Revenue Pulse**: Real-time collected funds, pending checks ($797 each), and pipeline trajectory.
3. **Pipeline Velocity Tracker**: 5-stage progress rail (`New` → `Research` → `Report Ready` → `Conversation` → `Paid`).
4. **Action Queue**: One-click actions with due dates and estimated values.

### Lead Production Workspace (The 9 Core Tabs)
1. **Generation Brief**: Verified Company Facts (Lic. #11288), Prohibited Claims (no fake claims), Brand Tokens (HEX swatches, typography), Persona targeting.
2. **SEO Audit**: Before vs. After gauges (Mobile speed 29/100 $\to$ 98/100, LCP 8.4s $\to$ 0.12s, Schema 0 $\to$ 4 types) and 10 critical fixes.
3. **Local Map Grid**: Interactive 7×7 geographic scan of 49 Queens checkpoints with live node inspector.
4. **Competitors**: Market Positioning Benchmark chart comparing reviews, rating, and service routes vs. local competitors.
5. **Issue vs. Fix Matrix**: 3-stage architecture (`Friction` $\to$ `Revenue Consequence` $\to$ `Implemented Solution`).
6. **Sitemap Parity**: 38 of 38 pre-rendered routes (28 services + 8 launch articles) with word counts and 100% route verification.
7. **QA Release Gate**: 6 automated human-reviewed gates before magic-link dispatch.
8. **How to Close**: 1-click Brevo transactional email dispatch, click-to-call phone button (`tel:+1...`), objection handling cheatsheet, and Stripe $797 payment link generator.
9. **Delivery & Handoff**: DNS CNAME validator for custom domains and Next.js 15 standalone zip package builder.

## 6. Client Portal & Master Report Specification

### Private Magic Link Access
- Distributed via automated Brevo confirmation email upon landing page intake submission (`?auth=magic_xxx`).
- No passwords, no login credentials, zero access friction.
- Completely isolated per lead — impossible to view another client's project.

### Master Report Visual Structure
1. **Executive Header**: Verified business name, 37-year proof, Google 5.0 badges, and primary CTA (*See New Homepage*).
2. **Project Trajectory Stepper**: Visual order tracker showing progress from *Website Received* to *Live*.
3. **Interactive Before vs. After Split View**: Direct side-by-side contrast proving why the old site leaked calls and how the rebuild converts them.
4. **7×7 Local Search Map Grid**: Interactive grid of 49 search checkpoints with click-to-inspect rank and competitor intelligence.
5. **Market Radar Benchmark**: Recharts radar comparing Search Coverage, Speed, UX, Depth, Proof, and Schema.
6. **SEO Infrastructure Scorecard**: 95/100 circular score ring with categorical breakdown.
7. **Route & Content Library Matrix**: 28 genuine service cards and 8 original launch articles.
8. **Direct Call to Action**: *Approve & Continue* (initiates Stripe checkout) or *Ask Question* (opens Crisp chat).

## 7. Acceptance Criteria

The system succeeds when:
- An operator can view the admin home and take the next commercial action in under 5 seconds.
- A non-technical business owner can open the private report link on mobile, understand the before/after difference in 30 seconds, and click *Approve* without confusion.
- All 9 workspace tabs render interactive, high-fidelity visual representations rather than plain text walls.
- Standalone Next.js exports build cleanly with zero agency lock-in.
