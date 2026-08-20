# BarakahSoft Dashboard Design PRD

Status: Design source of truth for the admin dashboard and client report prototypes.

## 1. Product Goal

Design two connected experiences for the same lead:

- Admin workspace: extremely simple for the operator. It answers “What should I do next, and will it move this lead toward payment?”
- Client report: persuasive and visual. It answers “What did you find, what did you build, and why should I continue?”

The report is the main sales asset. It must make the value of the work obvious without a sales call or technical explanation.

## 2. Story

Every lead follows one visible story:

```text
Website received
    -> Business and market researched
    -> Problems made visible
    -> Better homepage and website built
    -> Client reviews the evidence
    -> Client asks a question or approves
    -> Payment
    -> Website handoff and launch
```

The interface must make this story visible through progress, visuals, comparisons, and one next action. Do not make the user assemble the story from separate data tables.

## 3. Visual Direction

Use a Stripe-inspired product interface without copying Stripe branding.

### Colors

- Primary action: `#533AFD`.
- Ink: `#0D1738`.
- Body text: `#42506A`.
- Page background: `#FFFFFF` or `#F7F8FC`.
- Border: `#E5E7F2`.
- Positive: `#0B8F5B`.
- Warning: `#B7791F`.
- Problem: `#D14343`.
- BarakahSoft yellow `#FFD12D`: small accent only for the logo, selected emphasis, or a single important highlight. Never use yellow for text.

### Geometry

- Page and card spacing must follow an 8px grid.
- Header height: 64px.
- Desktop content width: 1120-1240px.
- Card radius: 8px.
- Button radius: 4px.
- Pills only use full radius.
- Avoid giant rounded containers and excessive shadows.
- Use one visual focal point per screen.

### Typography

- Use `Sohne`, `SF Pro Display`, or the closest available system fallback.
- H1: 40-48px desktop, 32px mobile.
- H2: 24-32px.
- Body: 14-16px.
- Supporting labels: 11-12px.
- Never use yellow text.
- Never use technical terms in client-facing copy.

### Visual Ratio

- 80% visual: charts, progress rails, maps, before/after previews, status indicators, diagrams, and comparison blocks.
- 20% text: short labels, one-sentence explanations, and action instructions.
- No wall of text.
- No page made primarily from repeated information cards.

## 4. Admin Workspace

### Admin navigation

Use a clean white sidebar with the BarakahSoft wordmark, not the square app icon.

Navigation:

- Home.
- Leads.
- Reports.
- Conversations.
- Delivery.
- Settings.

Only one item may be active. The active item uses the purple primary color and a light purple background. Inactive items are muted ink. No active-state color may disappear after hydration or navigation.

### Admin home: Today

The first screen is not a metrics wall. It is an action queue.

Top section:

- Heading: `Today`.
- Subtitle: `The next action that moves a lead closer to payment.`
- Primary button: `Open active lead`.

Main visual:

- Selected lead: `York Electrical`.
- Action: `Send the master report`.
- Status: report ready, preview ready, conversation not started.
- Primary action: `Open report`.
- Secondary action: `Open conversation`.

Pipeline visual:

```text
New -> Research -> Report ready -> Conversation -> Paid
```

Each stage shows count, not paragraphs. The selected lead is highlighted.

Revenue panel:

- Paid websites this period.
- Awaiting payment.
- Recurring clients.
- Money blocked by a missing next action.

Next-action list:

- Lead name.
- One action.
- Due time.
- One button.

Do not show SEO tables, raw generation logs, or every build detail on the admin home. Those belong inside the selected lead workspace.

## 5. Admin Lead Workspace

The lead workspace is the complete internal record. It must preserve every useful tool without making the home screen heavy.

Workspace sections:

1. Brief and source inputs.
2. ICP and business understanding.
3. Services and sitemap.
4. SEO audit.
5. Local map grid.
6. Competitor comparison.
7. Issue-versus-fix report.
8. Homepage and full website preview.
9. Content and article plan.
10. Generation progress.
11. QA checklist.
12. Client conversation.
13. How to close.
14. Payment and delivery.

Each section must show:

- Status.
- One sentence explaining the result.
- Visual evidence where applicable.
- One next action.

### SEO audit visual

Show a score ring or horizontal score bar, followed by grouped issue counts:

- Technical.
- Content.
- Mobile.
- Conversion.
- Structured data.

Every issue must connect to a proposed fix. Avoid showing a score without meaning.

### Map grid visual

Show the actual tracked service-area grid.

- Each cell represents one search location.
- Green: visible in the local pack.
- Amber: outside the target range.
- Red: not found.
- Include a clear summary such as `10 of 49 locations visible today`.
- Include a small explanation that the map is evidence of current visibility, not a permanent ranking promise.

### Competitor visual

Use a horizontal comparison chart for:

- Review count.
- Rating.
- Site speed.
- Service coverage.
- Trust proof.

Highlight the lead separately from competitors. The chart must answer: `What are they doing that this business can improve?`

### Issue versus fix visual

This is the core sales artifact.

Each issue should be a visual three-step block:

```text
Evidence found -> Why it matters -> What we changed
```

Include a screenshot, highlighted UI region, or simple before/after illustration whenever possible.

### Generation and QA

Use a visual progress rail, not a log:

```text
Research -> Brief -> Homepage -> Service pages -> Articles -> QA -> Client review
```

QA should show pass/fail counts and the two or three decisions blocking delivery. Do not show raw model names or internal prompts to clients.

### How to close

This is admin-only. It must never appear in the client portal.

Show:

- Current lead outcome.
- Next email or call.
- Script.
- Due time.
- Checkout status.
- Payment status.

The operator should be able to move a lead from `new` to `contacted`, `qualified`, `won`, or `lost` without hunting through the interface.

## 6. Client Portal

The client receives a private expiring link by email. No password setup is required. The link opens the master report directly.

The client should not see a technical dashboard. It should feel like a premium project/order tracker.

### Client header

- BarakahSoft wordmark with no background tile.
- Project name.
- Compact navigation: `Report`, `Website`, `Conversation`, `Handoff`.
- Secure-link indicator.
- `Message team` opens Crisp.

### Client master report

The first viewport must show:

- A strong one-sentence conclusion.
- One before/after homepage visual.
- One primary button: `See the new homepage`.
- One secondary button: `Ask the team`.
- A five-step progress rail.

Recommended story:

```text
Your business already has the proof.
The current website hides it.
We made the value easier to see.
Here is the evidence and the new direction.
```

### Client report visual sections

The report must visibly include all of these, in a guided order:

1. What we used: business, ICP, brand, services, source material.
2. Current website snapshot.
3. SEO health and issue groups.
4. Local map grid.
5. Competitor comparison.
6. Issue-versus-fix blocks.
7. Before/after homepage.
8. Service coverage and sitemap progress.
9. Article/content progress.
10. QA progress.
11. Conversation and change request.
12. Approval and payment.

The client does not need to understand the phrase “SEO audit,” but the visual can use that label with a one-sentence explanation: `How easy it is for search engines and customers to understand your site.`

The client does not need to understand “generation.” Use `Website progress`.

The client does not see “How to close.” Use `What happens next` for the client-facing equivalent.

### Client actions

- `See the new homepage` opens the preview.
- `Ask the team` opens Crisp.
- `Request a change` opens Crisp with the project context.
- `Approve the work` moves to payment.
- `Continue with BarakahSoft` opens the agreed checkout.

No dead buttons. No fake download actions in the production product.

## 7. Data And State Requirements

Every lead must have one visible state:

```text
New
Researching
Report ready
Preview delivered
Conversation
Qualified
Approved
Payment pending
Paid
In production
Ready for handoff
Live
Lost
```

The client sees a simplified version:

```text
Received
Research complete
New direction ready
Your review
Payment and handoff
Live
```

Every state stores:

- Timestamp.
- Owner.
- Next action.
- Evidence or attachment.
- Client-visible message.
- Internal note.

## 8. Email And Live Report

After landing-page submission:

1. Save the lead.
2. Send an immediate confirmation email.
3. Include a private report link.
4. Show `Website received` in the client timeline.
5. Update the same report as research, map, competitor, redesign, QA, approval, payment, and handoff stages change.

The report URL must be lead-specific, expiring, and inaccessible to other leads.

## 9. Acceptance Criteria

### Friction budget

Every visible element must do one of three jobs:

- Prove a problem.
- Show the work or its progress.
- Move the lead toward a question, approval, payment, or handoff.

Anything else belongs in an internal detail view or is removed. The system should use AI and connected APIs to do the research, comparison, checking, and fixing behind the scenes. The client should see the useful result, not the machinery.

The design is rejected if:

- The client must read multiple paragraphs to understand the value.
- Yellow is used for body text, labels, or headings.
- The dashboard opens with more than one competing primary action.
- The admin cannot identify the next action within five seconds.
- The client cannot see the map grid, before/after, and issue-versus-fix evidence.
- “How to close,” model details, or technical export terms appear in the client portal.
- Cards, buttons, and headers use inconsistent spacing or radius.
- A button does not clearly open a report, preview, Crisp conversation, approval, or checkout.

The design succeeds when a client can answer these questions without help:

- What was wrong?
- Why did it matter?
- What did BarakahSoft change?
- What does the new website look like?
- What do I do next?

The operator succeeds when they can answer these questions immediately:

- Which lead needs attention?
- What should I send or say?
- Has the lead responded?
- Has the client approved?
- Has payment arrived?
- What can be launched now?
