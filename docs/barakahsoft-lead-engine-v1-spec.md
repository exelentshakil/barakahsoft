# BarakahSoft Lead Engine V1

Status: Phase 1 complete; later phases specified but not yet complete.

## 1. Product

BarakahSoft acquires service-business leads with a free, human-reviewed homepage redesign. A qualified lead may then buy a complete lead-ready website for $797 flat and optionally retain BarakahSoft for Meta ads management.

The free deliverable is useful on its own and requires no card, deposit, or purchase commitment. It includes a homepage direction, mobile and desktop treatment, evidence-based audit, category benchmark, and explanation of what changed.

## 2A. Sales-First Experience

The product exists to convert paid attention into collected revenue. Every accepted lead must have one visible next action and one owner.

```text
Lead -> useful delivery -> conversation -> approval -> payment -> production -> launch
```

The free redesign opens the conversation. It is not the end product and it must not become an unbounded free website project.

The system must make it easy to:

- See where every lead came from and what has happened to it.
- Deliver the audit, issue-versus-fix report, and homepage concept quickly.
- Contact the lead by email or secure project link without making the client create a technical account.
- See whether the client opened the work, replied, approved, requested a change, paid, or was lost.
- Move a qualified client to checkout without exposing internal implementation details.
- Stop unpaid production work until the agreed payment is recorded.

The client-facing interface must use plain English. Do not show terms such as Next.js, repository, deployment target, build artifact, tenant, schema migration, or regeneration unless an operator explicitly opens a technical detail view.

Preferred client language:

- “Website handoff” instead of “Next.js export.”
- “Your website files” instead of “build output.”
- “Request a change” instead of “regeneration.”
- “New version for review” instead of “generated artifact.”
- “Approve this version” instead of “publish approval.”

## 2B. Client Access And Conversation

After delivery, the client receives a private, expiring magic link. The client does not need a password or account setup, but the link must still authorize access to that client’s project only.

The secure project view must show an order-like timeline:

- Website received.
- Research and audit complete.
- Homepage concept ready.
- Full website in progress.
- Review needed.
- Change requested or approved.
- Payment received.
- Website files ready.
- Launch complete.

The client can send a message, approve the report, request a page change, and approve the website from the same link. Messages and decisions are attached to the active website version.

## 2C. Immediate Confirmation And Live Progress

Immediately after a valid landing-page submission, the system sends the lead a confirmation email containing a private project link. The email must clearly say that the website was received, what will happen next, and where the lead can follow progress.

The confirmation link opens the client report without requiring a password or account creation. It must never expose another lead's project. The link may expire and be reissued.

The live client report is the master proof-of-work surface. It displays plain-English progress for:

- What information and brand material were received.
- SEO and technical audit findings.
- Local map visibility and competitor evidence.
- Issue-versus-fix recommendations.
- Sitemap and approved page coverage.
- Homepage, service-page, and article generation progress.
- Human QA and remaining decisions.
- Client questions, requested changes, approval, payment, and website handoff.

The report should use visual progress indicators, charts, comparisons, and before/after evidence where they clarify the decision. Visual polish must support understanding, not hide missing work or imply a ranking, lead, or revenue guarantee.

## 2. Public Offers

### Complete website

- Price: $797 flat.
- Built from the approved homepage direction.
- Home, services overview, about, and contact pages.
- A complete page for every genuine service the business offers; there is no service-page cap.
- 8-10 original, human-reviewed launch articles, or migration of useful existing posts where appropriate.
- Structured-data and generative-search foundations.
- Mobile-first implementation.
- One trade-appropriate interactive quote or qualification tool.
- Location-combination pages are excluded.

### Optional Meta ads management

- Management fee: $497 per month minimum or 20% of monthly ad spend, whichever is greater.
- The client pays advertising spend separately and directly through their advertising account.
- Scope may include strategy, creative direction, campaign setup and management, tracking, testing, and review.
- The website purchase does not require an ads-management subscription.
- Public copy must not guarantee CPC, CPM, rankings, lead volume, revenue, or closed jobs.
- Budget guidance must be tailored to the trade and market rather than presented as a universal platform benchmark.

## 3. Content Standard

The 8-10 article launch library is a content-depth requirement, not a Google minimum and not a ranking guarantee.

Every article must:

- Answer a real customer question or address a verified service, buying decision, maintenance issue, or local concern.
- Be grounded in the client's services, service area, evidence, and approved claims.
- Have a distinct search intent and avoid duplicating another page.
- Be reviewed by a human for usefulness, accuracy, tone, unsupported claims, and duplication before publication.
- Contain no invented experience, testimonials, licenses, statistics, prices, guarantees, or business facts.
- Avoid doorway patterns and location-keyword permutations.

Google's scaled-content-abuse policy applies regardless of whether content is produced by a human, automation, or both. Generation volume must never replace usefulness and review.

## 4. Lead Inputs

The intake remains low-friction. It captures the website URL, business name when available, contact name, phone, email, help-needed selections, free-form context, consent, source, and UTM data.

After qualification, the client or operator may attach:

- A branding JSON export containing colors, typography, logos, imagery references, spacing, and component guidance.
- A Markdown content export containing grounded business facts and source-page content.
- Design-reference URLs, screenshots, or written direction.
- Additional verified source documents.

Branding files are optional. If they are absent or incomplete, the generator uses BarakahSoft's documented default design system and records that fallback in the generation brief. Missing inputs must not be invented.

## 5. Generation Brief

Before generation, normalize all approved inputs into a versioned brief containing:

- Client and project identifiers.
- Source URLs and retrieval timestamps.
- Verified company facts and prohibited or unknown claims.
- Services and service areas.
- Brand tokens and source provenance.
- Approved site map.
- Twenty-article plan with title, intent, target reader, factual sources, and related service page.
- Chosen design references and explicit visual constraints.
- Quote-tool requirements.
- Model and prompt metadata.

The brief is reviewable and editable before a full-site generation run.

## 6. Project Isolation And Export

Each accepted client site is an individual Next.js project, not a collection of tenant pages inside the BarakahSoft marketing application.

Projects may share authenticated platform services, Supabase infrastructure, generation APIs, templates, and deployment tooling. They must have separate source trees, environment configuration, build outputs, deployment targets, and export records.

Each export must include:

- A buildable Next.js project.
- Content and media required to run it.
- Environment-variable documentation without secret values.
- Generation-brief and version identifiers.
- Validation results and unresolved review notes.

No client secret or private source file may be copied into a public repository or browser bundle.

## 7. Changes And New Versions

The client-facing action is called **Request a change**. Internally, the system may call this regeneration, but that word must not be required for the client to understand the action.

Change requests are versioned and non-destructive. Operators can request changes at site, section, page, or article level.

Every run records:

- Original project version.
- Prompt and approved input versions.
- Selected model.
- Files and content changed.
- Validation results.
- Operator approval or rejection.

A new version must not silently overwrite the last approved version. Operators and clients can compare changes, reject a version, and restore a previously approved version.

## 8. Human Control

OpenCode orchestrates implementation using the best suitable available GPT or Gemini model, but model output is never self-approving.

Required human gates:

- Source and claim verification.
- Sitemap and article-plan approval.
- Desktop and mobile visual review.
- Content and structured-data review.
- Navigation, form, accessibility, performance, and production-build checks.
- Final publish or export approval.

## 9. Workflow And Statuses

Phase 1 intake and sales-state persistence are complete. Intake alerts operators but does not automatically start costly generation.

The sales pipeline supports qualification through won or lost. A qualified lead advances manually into research, brief creation, redesign, review, presentation, sale, full-site production, QA, export, and launch.

Generation jobs and website versions need explicit states for queued, running, review required, approved, rejected, failed, exported, and deployed. Failures must be retryable without duplicating accepted output.

## 10. Acceptance Criteria

A client website is not complete until:

- Every verified service has a substantive page.
- All 20 articles pass human review and have distinct intent.
- No location-combination pages exist.
- Navigation, footer links, forms, and primary calls to action work.
- No unsupported business claims or placeholder content remain.
- Responsive desktop and mobile review passes.
- Accessibility and metadata checks pass.
- The production build passes.
- The approved version can be exported as an individual Next.js project.

## 11. Delivery Phases

1. Intake and pipeline state: complete.
2. Qualification, source ingestion, and versioned generation brief.
3. Free homepage redesign generation and human review.
4. Paid full-site generation, including all service pages and 8-10 reviewed or migrated articles.
5. Client change requests, new versions, QA, comparison, and approval.
6. Website files handoff and deployment.
7. Optional Meta ads onboarding and management.
