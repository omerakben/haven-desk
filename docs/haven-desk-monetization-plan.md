Pricing, tier design, pack economics, licensing rules, and the first paid wedge for Haven Desk.

Date: 2026-06-26

---

This doc covers how Haven Desk makes money. The product context, persona definitions, and feature roadmap live in sibling docs (`haven-desk-strategy-report.md`, `haven-desk-a-to-z-roadmap.md`, `haven-desk-plugin-pack-spec.md`). Read those alongside this file when preparing for a launch or beta pricing decision.

All prices in the tables below are **assumptions to validate in beta**, not commitments.

---

## Free tier

Haven Desk is free to run, configure, and use locally. No login required. No cloud account. No API meter.

What free includes:

- One project
- Basic task list
- Prompt tools (Prompt Optimizer, Email Writer, Brainstorming, Prompt Library)
- Limited active memory facts (assumption: cap at 25 active facts before the user is prompted to archive)
- Manual export and import of your own data (JSON)
- Local model setup via Ollama
- Smart Inbox and Image workflows

What free does not include (see [Paid tiers](#paid-tiers)):

- Multiple projects
- Advanced memory (unlimited active facts, relevance ranking, learn-from-activity, memory loop)
- Voice and quick capture
- Automation routines (standup, wrapup, scheduled local backups)
- Paid workflow packs
- Personalization features (Settings.userName, per-tool model override)

The intent: a new user should be able to complete at least one useful daily workflow for free before hitting any limit. The cap on projects and memory is the natural forcing function toward Pro, not an arbitrary feature removal.

---

## Paid tiers

### Pro individual

Target persona: household operator, student, creative professional, personal-admin user. WTP from canon: $8-$15/mo individual, $6-$12/mo for students.

Price range (assumption): **$8-$15/mo** or **$79-$149/yr**.

What Pro adds over free:

- Unlimited projects
- Advanced memory: unlimited active facts, relevance ranking against the active project, learn-from-activity, merge proposals, category grouping, and the full memory loop
- Voice capture (requires whisper.cpp and ffmpeg, both installable locally; the cockpit surfaces the 503 and install command when missing)
- Quick capture via macOS Shortcut or Windows PowerShell script
- Automation routines: standup, wrapup, per-project scoped
- Scheduled local backups via the export/import system
- Per-tool model overrides (e.g., run QA sessions on the quality model)
- Personalization: name in greeting, theme persistence, filter persistence across sessions

The student case warrants an annual license discount (assumption: $59/yr) because the workflow is semester-bound and a monthly subscription creates churn friction at the wrong time.

### Solo business

Target persona: small business owner, freelancer, solo consultant.

Price range (assumption): **$19-$49/mo**, no annual discount in v1 (the support cost per user is higher for this persona).

What Solo business adds over Pro individual:

- Small Business Ops pack included at no additional charge (the first mass-market pack; see [Paid packs](#paid-packs))
- Priority email support response (assumption: 48-hour SLA vs best-effort)

The $19-$49 range is wide because the right price depends on whether the pack provides enough workflow value to justify the upper end. Beta interviews should test whether $29/mo with the pack included beats $19/mo pack-excluded for conversion.

### Small team / local license

Target persona: a small team at a company, a local franchise with 2-10 staff, a QA or product team.

Price options (assumptions):

- Per-seat SaaS-style: **$12-$29/user/mo**, billed to one admin
- Annual local team license: **$499-$2,500/yr** for the whole team (no per-seat meter, license file on the local machine or LAN server)

The local team license is the right option for privacy-sensitive buyers who will not accept any cloud account check. See [Licensing rules](#licensing-rules) for how the offline grace period and manual license file work.

A team license includes:

- Unlimited Pro individual features for all seats on the license
- Professional pack of the buyer's choice (QA and Product Ops or future professional packs)
- One onboarding call (assumption: 60 min, covered in setup service fees)

---

## Paid packs

Packs are the main upsell mechanism. They are priced as one-time purchases (or annual update subscriptions, assumption) on top of any tier. A user on the free tier can buy a consumer pack; a Pro user can buy professional packs.

### Consumer packs

Price range (assumption): **$49-$199** per pack.

| Pack | Audience | Maturity | What it includes |
|------|----------|----------|-----------------|
| Household secretary | Household operator | L0 | Daily family brief, school message drafter, appointment prep checklist, meal and grocery planner, home document tracker, renewal reminders |
| Student tutor | Student or learner | L0 | Syllabus importer, study plan generator, quiz builder, notes explainer, assignment tracker, exam review routine |
| Small business ops | Small business owner | L0-L1 | Meeting notes to tasks, proposal writer, follow-up drafter, SOP builder, weekly business review, receipt and invoice organizer |
| Creative studio | Creative professional | L0 | Campaign brief, repurpose draft, client tone memory, content calendar, creative feedback checklist, asset notes from screenshots |
| Legal and admin | Personal-admin user | L0 | Document checklist, deadline extractor, support-call prep, clause review checklist, evidence packet builder, draft letter generator |
| Fitness and nutrition | Household/personal | L0 | Meal planner, grocery list, workout schedule, habit tracker, preference memory, progress reflection |

Guardrails enforced in every pack manifest (and checked by the validator described in `haven-desk-plugin-pack-spec.md`):

- Legal and admin: marketed as admin support, not legal advice; read-only and human-approved
- Fitness and nutrition: no diagnosis, treatment, or medical claims
- Small business ops: no automatic sending, no transactions, no tax advice; user reviews every draft

Assumption: the first consumer pack to ship is Small Business Ops because it directly monetizes the non-developer proof-of-concept and has the widest WTP range in the persona list.

### Professional packs

Price range (assumption): **$199-$499** per pack.

| Pack | Audience | Maturity | What it includes |
|------|----------|----------|-----------------|
| QA and product ops | QA engineers, product managers, technical leads | L1 | QA Pipeline, Gherkin Lint, Bug Report, Rubric Designer, Eval Cases, plus a release readiness checklist |

QA and Product Ops is the highest-confidence first professional pack because all its primitives already exist in the repo (verified in the canon). The pack reorganizes them under a professional framing with project-scoped memory seeding, the LBMH-style glossary pattern, and the full session-and-iteration QA pipeline.

Future professional packs (post-v1 assumptions): a Content and Marketing Ops pack (creative studio at L1 with content calendar automation), a Research and Knowledge Management pack (document Q&A plus citation tracking), and a Client Services pack for agencies (client project memory plus proposal automation).

---

## Setup and support offers

These are the highest-margin offers and the first path to revenue before any paid tier scales.

| Offer | Price range (assumption) | What it is |
|-------|--------------------------|-----------|
| Install and configure | $1,000-$3,000 | One session: install Ollama app, pull models, run `./swiss up`, configure one project, load one pack, verify the first workflow end to end |
| Workflow pack onboarding | $2,000-$5,000 | One pack deployed to one team: install, seed a project pack with the client's own templates and memory facts, train the team on capture and daily routines, one follow-up call |
| Custom pack development | $5,000-$10,000 | A new L0 or L1 pack built to the client's industry and workflows, delivered as a local seed script under the `cockpit/projects/<name>/pack/` pattern |
| Monthly support retainer | $100-$500/mo | Email support, model update guidance, pack updates, one 30-min call per month |

Risk note: setup and consulting work is the easiest first dollar but the worst long-term margin. A single enterprise engagement can consume weeks of solo-founder time. Cap consulting intake at 2-3 clients during beta, use them to validate the pack install pattern, and then productize the install flow so it runs with less human time per seat.

---

## Pricing table

All prices are assumptions to validate in beta.

| Tier | Monthly | Annual | Notes |
|------|---------|--------|-------|
| Free | $0 | $0 | One project, 25 active memory facts, core tools, no voice, no routines |
| Pro individual | $8-$15 | $79-$149 | Unlimited projects, full memory, voice, routines, premium packs |
| Student (Pro) | $8 | $59 | Annual only; same features as Pro individual |
| Solo business | $19-$49 | N/A in v1 | Pro plus Small Business Ops pack included |
| Small team (per seat) | $12-$29/seat | N/A | Billed to admin; includes one professional pack |
| Small team (local license) | N/A | $499-$2,500 | Full team, one license file, offline-first, no per-seat meter |
| Consumer pack (one-time) | N/A | $49-$199 | Available on any tier |
| Professional pack (one-time) | N/A | $199-$499 | Available on Pro or above |
| Install and configure | N/A | $1,000-$3,000 | One-time service |
| Workflow pack onboarding | N/A | $2,000-$5,000 | One-time service |
| Custom pack development | N/A | $5,000-$10,000 | One-time service |
| Support retainer | $100-$500 | N/A | Monthly, add-on to any tier |

---

## What is free vs paid, mapped to outcomes

The split below is organized by user outcome, not by feature checkbox. The goal is to make the gating feel proportional to the value the user gets, not arbitrary.

| Outcome | Free | Pro | Solo business | Team license |
|---------|------|-----|---------------|--------------|
| Draft an email or prompt | Yes | Yes | Yes | Yes |
| Run a daily task list | Yes (1 project) | Yes (unlimited) | Yes | Yes |
| Capture a note and turn it into a task | Yes | Yes | Yes | Yes |
| Keep memory across sessions | Yes (25 facts) | Yes (unlimited, ranked) | Yes | Yes |
| Voice-capture a note hands-free | No | Yes | Yes | Yes |
| Run a morning standup or evening wrapup | No | Yes | Yes | Yes |
| Organize multiple client or family projects | No | Yes | Yes | Yes |
| Back up automatically on a schedule | No | Yes | Yes | Yes |
| Install a workflow pack | Pack purchase required | Pack purchase required | Small Business Ops included | One professional pack included |
| Run a QA pipeline with Gherkin lint | Dev-accessible (no pack) | Dev-accessible | Dev-accessible | QA pack included |
| Get onboarding or support | Community docs only | Email (best-effort) | Priority email (48h) | Retainer or onboarding call |

The QA pipeline, Gherkin Lint, and the other developer tools in the current nav are accessible to anyone who installs the app because they already exist in the repo. The QA and Product Ops pack does not gatekeep those routes. It adds the curated memory seed, project templates, and a cohesive onboarding path for non-developer buyers.

---

## Licensing rules

These rules are non-negotiable. They protect the local-first promise and are the differentiator against cloud-dependent AI tools.

1. Free local use requires no cloud login. A user running Haven Desk from a local install does not need to create an account to use the core app.
2. Local user data is never gated behind a remote account. If a license check fails or a subscription lapses, the user retains full read access to their tasks, memory, drafts, and documents. No lock-in.
3. Paid pack updates may check a license. When a pack update is released, the update installer may verify a local license file or an account token. The installed version the user already has continues to work offline.
4. Offline grace period: assumption, 30 days. After 30 days without a successful license check, the app degrades gracefully (assumption: shows a banner, does not disable existing workflows; only blocks downloading new pack updates).
5. Manual license file option. Privacy-sensitive buyers, air-gapped environments, and the local team license can receive a static license file instead of an online check. The file is verified locally at app start.

These rules align with how the current app handles the capture token (header-only, timing-safe compare, no query-param logging) and the SSRF guard on PUT /api/settings. Any license-check implementation must follow the same pattern: no external call from a cockpit API route, no URL that could be redirected to a cloud service.

---

## Risks and mitigations

### Risk 1: drafting is commoditized

AI drafting (emails, tasks, summaries) is the most crowded AI category. Apple Intelligence, Copilot in Word, and Gemini in Google Docs all draft locally or with tight privacy controls. A user who only needs drafting has no reason to install Ollama and run a Docker stack.

Mitigation: differentiate on context, not just drafting. Haven Desk wins when the draft uses the user's own memory facts, project-specific templates, and prior conversations. The Memory loop, project scoping, and pack-specific context injection are the differentiator. The product narrative must lead with "private context that improves over time" rather than "faster drafting."

### Risk 2: support burden across Mac/Windows/Ollama/Docker

Ollama, Docker Desktop, and the cockpit each have platform-specific failure modes: the brew formula trap on macOS, winnat port conflicts on Windows, GPU driver issues, and model pull failures on slow connections. A small team with paying customers cannot absorb open-ended support across all combinations.

Mitigation: four levers. First, `./swiss doctor` already encodes the most common failure states with copy-paste fixes; expand it to cover the top 5 support tickets from beta. Second, write a setup FAQ that routes users to community forums (Discord or GitHub Discussions) before support email. Third, charge for setup services at a rate that covers the actual time cost. Fourth, cap the Solo business tier's support SLA at email-only with a 48-hour response; anything faster requires a retainer.

### Risk 3: consulting can swallow product focus

High-touch onboarding and custom pack development are the fastest first revenue but compete directly with building the product. A solo founder who books three $5,000 custom packs in month 2 will not ship the general pack marketplace.

Mitigation: time-box consulting explicitly. No more than 20 hours per month total on client work during the beta period. Use every engagement to produce a reusable pack artifact; if it cannot be generalized into an L0 or L1 pack, decline the work. The goal of each consulting engagement is to create a case study and a packaged output, not a perpetual support relationship.

---

## First paid wedge

Two wedges are worth pursuing in parallel because they hit different markets and validate different assumptions.

### Wedge 1: Small Business Ops pack for non-developer proof

The clearest path to paying non-developer users is the Small Business Ops pack at $29/mo (Solo business tier, pack included). The target buyer: a solo consultant, freelancer, or local service business owner who currently uses a mix of Google Docs, a notes app, and email drafts.

What they need:

- Meeting notes converted to tasks with one click
- Follow-up email drafted from those tasks
- A weekly business review that shows what closed, what is overdue, and what is queued
- SOP drafts from a voice note or typed description

All four workflows map to existing cockpit primitives (Tasks + AI-assist, Email Writer, Daily Brief / standup routine, Brainstorming). The pack adds the memory seeds and templates that make the output sound like the user's business. The first beta target is 5-10 paying users at $29/mo to validate that the pack install path works and that the output quality earns a second month.

### Wedge 2: QA/Product Ops pack to monetize existing primitives

The QA Pipeline, Gherkin Lint, Rubric Designer, Eval Cases, Bug Report, and API Contract already exist in the repo. The second paid wedge sells these to QA engineers and product managers who work at companies that have source-code sensitivity around cloud AI tools.

The buyer's objection to existing tools (GitHub Copilot Chat, Claude.ai) is not quality; it is that pasting internal feature specs into a cloud tool is a policy violation in many companies. A local Haven Desk install with a QA pack sidesteps that objection entirely.

Price assumption: $299 one-time for the QA and Product Ops pack, or $199/yr for updates. The first beta target is 3-5 professional users or one team license at $999. The goal is to validate that the Gherkin lint + rubric + iteration loop is worth paying for independent of the LBMH context it was originally built for.

These two wedges are complementary: Small Business Ops proves the non-developer market; QA/Product Ops proves the professional market. Neither requires new infrastructure, only pack authoring and a license check mechanism.
