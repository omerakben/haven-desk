# Haven Desk A-to-Z monetization transition roadmap

Date: 2026-06-26

## Purpose

This roadmap turns Swiss Knife into Haven Desk: a local-first, private AI daily runner that non-technical users and small businesses can understand, adopt, and pay for.

The roadmap is written as implementation guidance for a future clean-context session. It is intentionally concrete enough for another agent or engineer to start turning it into issues, commits, and verification steps.

## North star

Haven Desk is a private AI operations desk for daily life and small business work.

It should help users:

- Capture messy input.
- Organize it into projects, tasks, memory, and documents.
- Draft useful output.
- Review before saving or acting.
- Run repeatable daily routines.
- Install trusted workflow packs.

It should not become:

- A generic chatbot clone.
- A cloud AI wrapper.
- An unsupervised agent.
- A developer-only toolbox.
- A bundle of random utilities.

## Success criteria

### Product success

- A non-technical user can understand the product in under 60 seconds.
- A first-time user can complete one useful workflow in under 10 minutes.
- The app has a clear public name, landing narrative, and persona-first onboarding.
- The strongest current tools are reorganized into daily workflows and packs.
- At least two paid workflow packs are defined end to end.

### Technical success

- The local-first rule remains intact.
- No cloud LLM calls are introduced into the cockpit.
- Plugins start as declarative packs before arbitrary runtime code.
- Every model step that feeds durable state remains reviewable.
- Mutating automations route through explicit user approval.
- MCP is introduced as a safe local capability boundary, not as a bypass around the cockpit.

### Monetization success

- There is a clear free tier.
- There is a clear Pro tier.
- There are paid vertical packs.
- There is a prosumer/small-business path.
- Pricing aligns with realistic willingness to pay.

## Strategic sequence

### Stage A: Freeze the product thesis

Goal:

- Lock the public story before building more features.

Deliverables:

- Product name: Haven Desk.
- Tagline: Private AI for the work of daily life.
- One-line pitch.
- Persona list.
- Positioning rules.
- "What this is not" list.

Implementation notes:

- Keep `Swiss Knife` as repo/internal codename unless a full rename is explicitly approved.
- Add public-facing docs before code changes.
- Do not rename packages, ports, scripts, or database models in this stage.

Acceptance checks:

- A reader can explain who Haven Desk is for.
- A reader can explain why it is not just another local chat app.
- A reader can explain why local-first matters.

### Stage B: Create durable product docs

Goal:

- Move the strategy out of chat and into repo artifacts.

Deliverables:

- `docs/haven-desk-strategy-report.md`
- `docs/haven-desk-a-to-z-roadmap.md`
- `docs/haven-desk-clean-context-prompt.md`

Implementation notes:

- Keep docs direct and implementation-oriented.
- Avoid claiming features are built unless they exist in the repo.
- Separate strategy from implementation roadmap.

Acceptance checks:

- Repo search for `Haven Desk` finds the docs.
- The next session can start from the clean-context prompt.

### Stage C: Reframe the information architecture

Goal:

- Move the app from tool drawer to daily runner.

Current shape:

- Work.
- Write.
- QA and evals.
- Dev.
- System.

Target public shape:

- Today.
- Capture.
- Write.
- Documents.
- Projects.
- Packs.
- Settings.

Behavioral changes:

- Today becomes the default home.
- Capture becomes the fast input path.
- Documents becomes the private local knowledge surface.
- Packs becomes the way users install workflows.
- QA and Dev move into professional packs instead of first-run navigation.

Implementation notes:

- Keep the existing central nav registry pattern.
- Do not remove existing routes.
- Add persona-facing labels and grouping first.
- Preserve command palette discoverability.

Acceptance checks:

- A non-technical user does not see developer-heavy tools as the dominant first impression.
- Existing power users can still reach QA/dev tools.
- No route is removed without replacement.

### Stage D: Build the Haven Desk first-run experience

Goal:

- Get a new user to a useful first workflow quickly.

First-run choices:

- Household admin.
- Student.
- Small business.
- Creative work.
- Personal documents.
- QA/product ops.

First-run flow:

1. Pick persona.
2. Pick local model tier or accept default.
3. Create first project.
4. Add one input: note, file, screenshot, or task.
5. Run one guided workflow.
6. Review and save the output.

Implementation notes:

- Keep advanced settings out of the first screen.
- Use plain-language health checks.
- Do not require Open WebUI setup before first value.
- If Ollama is down, show the next concrete local command or app action.

Acceptance checks:

- A user can get value without reading README.
- A user understands that data stays local.
- A user sees what to do next.

### Stage E: Formalize plugin packs

Goal:

- Create a safe, repeatable way to package workflows without arbitrary code execution.

Define `PluginManifest`:

- `slug`
- `name`
- `version`
- `audience`
- `industry`
- `maturity`
- `description`
- `capabilities`
- `requiredModels`
- `templates`
- `memoryFacts`
- `taskSeeds`
- `knowledgeSources`
- `gates`
- `routes`
- `mcpTools`
- `permissions`
- `setupChecks`

Maturity levels:

- L0 project pack: templates, prompts, facts, task seeds, docs, knowledge links.
- L1 cockpit tool: route, UI, storage, deterministic gate.
- L2 local MCP/OpenAPI server: read resources and propose actions.
- L3 automation: watched folders, scheduled routines, approval queues.

Implementation notes:

- Start with a TypeScript type and pure validator.
- Do not add a marketplace in v1.
- Use existing `sourceKey` patterns for idempotent seeds.
- Add install state to the database only when needed.

Acceptance checks:

- A pack can be validated without running a model.
- A pack can be installed idempotently.
- A broken pack reports a clear validation error.

### Stage F: Ship the first mass-market pack

Recommended first mass-market pack:

- Small business ops.

Why:

- It proves the app can move beyond developers.
- It has clear willingness to pay.
- It reuses current strengths: tasks, projects, email writing, prompt library, memory, capture, activity, and documents.

Pack workflows:

- Meeting notes to tasks.
- Proposal draft.
- Follow-up email.
- SOP builder.
- Weekly business review.
- Receipt/invoice organizer.

Required guardrails:

- No automatic email sending.
- No financial transactions.
- No tax advice claims.
- User reviews every draft.

Acceptance checks:

- A user can create a business project.
- A user can paste meeting notes and receive tasks plus a follow-up draft.
- A user can save reviewed output.
- The workflow produces a visible activity trail.

### Stage G: Package the existing QA strength as a paid professional pack

Recommended professional pack:

- QA and product ops.

Why:

- The current app already has QA Pipeline, Gherkin Lint, Bug Report, Rubric Designer, Eval Cases, Code Review, ADR Writer, and API Contract.
- This is the highest-confidence monetizable wedge for prosumers.

Pack workflows:

- Story to acceptance criteria.
- Story to Gherkin.
- Gherkin lint.
- Bug note to bug report.
- Rubric design.
- Eval case generation.
- Release readiness checklist.

Required guardrails:

- Keep deterministic gates central.
- Keep save-after-review behavior.
- Keep code scanning memory-free where privacy or prompt-injection risk exists.

Acceptance checks:

- A product/QA user can complete a story-to-Gherkin-to-rubric flow.
- The output is exportable.
- The gate result is visible.
- The workflow is explainable to a non-developer manager.

### Stage H: Build the Documents surface

Goal:

- Make local files a first-class reason to buy.

Capabilities:

- Project document library.
- Local file import.
- PDF/document Q&A through local RAG.
- Citation-first answers.
- Deadline extraction.
- Checklist generation.
- Evidence packet builder.

Implementation notes:

- Reuse Open WebUI where it is already strong.
- Deep-link from Haven Desk project pages.
- Add cockpit-level document workflows only where the cockpit needs durable state.
- Do not duplicate a full RAG system unless Open WebUI cannot support the required UX.

Acceptance checks:

- User can connect a project to a local knowledge base.
- User can ask a document question and see source references.
- User can extract tasks/deadlines for review before saving.

### Stage I: Add privacy and trust UX

Goal:

- Make local-first visible and understandable.

Features:

- Privacy status panel.
- "Where is my data?" screen.
- Local model status.
- External connector status.
- Activity log.
- Export/delete data controls.
- Per-plugin permission display.

Copy principles:

- Avoid fear-based language.
- State facts plainly.
- Show what is local, what is optional, and what is external.

Acceptance checks:

- User can see whether a workflow used local model only.
- User can export data.
- User can see plugin permissions before enabling.

### Stage J: Introduce safe local MCP

Goal:

- Let Haven Desk interoperate with local agents, Open WebUI, and future plugin tools without losing control.

Initial MCP resources:

- Projects.
- Active project.
- Accepted memory facts.
- Templates.
- Saved artifacts.
- Gate results.
- Activity summaries.

Initial MCP tools:

- Run Gherkin lint.
- Run ADR lint.
- Run OpenAPI lint.
- Run code smell scan.
- Create pending task proposal.
- Create pending memory proposal.
- Export project context.

Rules:

- Bind to localhost only.
- Require header token.
- Log tool calls.
- Start read-only.
- Add proposal-only writes before direct writes.
- Never bypass reviewed-save or human-accept flows.

Acceptance checks:

- MCP clients can read approved resources.
- MCP clients can run deterministic gates.
- MCP clients cannot silently mutate durable state.

### Stage K: Add automation with approval queues

Goal:

- Move from assistant to daily runner without unsafe autonomy.

Automations:

- Morning brief.
- End-of-day wrap-up.
- Watched folder ingest.
- Clipboard or shortcut capture.
- Weekly review.
- Pending memory review.
- Follow-up reminder generation.

Approval queue:

- Proposed tasks.
- Proposed facts.
- Proposed drafts.
- Proposed document deadlines.
- Proposed routine outputs.

Acceptance checks:

- Automation output waits for review when it changes durable state.
- User can accept, edit, dismiss, or delete proposals.
- Activity log shows what happened.

### Stage L: Create packaging and installer strategy

Goal:

- Remove developer setup friction.

Packaging targets:

- macOS desktop installer.
- Windows desktop installer.
- Existing Docker/Ollama path remains for power users.

Installer jobs:

- Check hardware.
- Install or verify Ollama.
- Pull default model.
- Start local services.
- Open Haven Desk.
- Run doctor-style checks.

Acceptance checks:

- Non-technical install instructions fit on one page.
- App can recover from missing Ollama or missing model.
- First-run path does not require terminal knowledge where possible.

### Stage M: Build pricing and licensing

Goal:

- Make monetization real before the feature set sprawls.

Tiers:

- Free local core.
- Pro individual.
- Pro household/student discounts.
- Solo business.
- Small team local license.
- Paid packs.
- Setup/support services.

Suggested pricing:

- Free: local core, one project, basic workflows.
- Pro: $8-$15/month or $79-$149/year.
- Solo business: $19-$49/month.
- Team local license: $499-$2,500/year.
- Consumer packs: $49-$199.
- Professional packs: $199-$499.
- Setup services: $1,000-$10,000.

Acceptance checks:

- Pricing page can explain what is free and what is paid.
- Paid features map to outcomes, not arbitrary limits.
- Free tier remains useful enough to build trust.

### Stage N: Build the website narrative

Goal:

- Make the product understandable to buyers.

Pages:

- Home.
- Privacy/local-first.
- Use cases.
- Packs.
- Pricing.
- Download.
- Docs.

Home page structure:

- Product name.
- One-sentence pitch.
- Three use cases.
- Privacy proof.
- Local model explanation.
- Download or waitlist CTA.

Acceptance checks:

- Visitor understands the product without knowing what Ollama, MCP, or RAG mean.
- Technical users can still find architecture details.

### Stage O: Validate with demo scripts

Goal:

- Prove the product creates value in visible workflows.

Demos:

- Parent: school email and appointment note to weekly plan.
- Student: syllabus PDF to study plan and quiz.
- Small business: meeting notes to tasks and follow-up email.
- Creative: rough brief to campaign outputs.
- QA/product: story to Gherkin, lint, rubric, and eval cases.

Acceptance checks:

- Each demo starts with messy realistic input.
- Each demo ends with saved artifacts.
- Each demo shows local-first status.
- Each demo avoids cloud LLM dependency.

### Stage P: Add measurement

Goal:

- Know whether the daily runner works.

Local-only metrics:

- First-run completion.
- Workflows completed.
- Captures created.
- Drafts saved.
- Tasks accepted.
- Memory facts accepted.
- Packs installed.
- Automations reviewed.

Privacy rule:

- Metrics should be local by default.
- Any telemetry must be opt-in and documented.

Acceptance checks:

- User can inspect or disable telemetry.
- Internal product decisions can still be informed by local aggregate summaries or explicit feedback exports.

### Stage Q: Add support and recovery

Goal:

- Make local software supportable.

Support surfaces:

- Doctor report.
- Copy-paste diagnostic summary.
- Backup/export.
- Restore/import.
- Reset local model state guidance.
- Clear port conflict guidance.
- Model performance hints.

Acceptance checks:

- User can produce a support bundle without secrets or local data.
- Common setup failures have plain-language fixes.

### Stage R: Harden plugin security

Goal:

- Prevent plugin and MCP risks from damaging trust.

Controls:

- Permission manifest.
- Localhost binding.
- Header token.
- Read-only default.
- Proposal-only writes.
- Activity logging.
- Prompt injection guidance.
- Source citation requirements for document workflows.

Acceptance checks:

- A plugin cannot silently send data externally.
- A plugin cannot silently mutate durable records.
- User sees permissions before enabling.

### Stage S: Build pack authoring workflow

Goal:

- Let trusted creators build packs without modifying core code.

Authoring assets:

- Manifest template.
- Pack validator.
- Seed dry run.
- Example pack.
- Pack testing checklist.
- Local install command.

Acceptance checks:

- A trusted author can create an L0 pack from templates and facts.
- The pack can be validated and installed idempotently.

### Stage T: Prepare launch bundle

Goal:

- Ship a coherent product, not a repo dump.

Launch assets:

- Product website.
- Demo videos.
- Download package.
- Pricing page.
- Privacy page.
- Pack catalog.
- Getting started docs.
- Known limitations.

Acceptance checks:

- A new user can install, run, and complete a demo workflow.
- The launch message is consistent across README, website, and app.

### Stage U: Beta with two audiences

Goal:

- Test both mass-market and prosumer willingness to pay.

Beta groups:

- Non-technical users: household, student, creative, personal documents.
- Prosumer users: small business, QA/product ops.

Beta questions:

- Did they understand the product?
- Did setup block them?
- What was the first useful workflow?
- Would they pay?
- Which pack would they buy?
- What felt unsafe or confusing?

Acceptance checks:

- Feedback produces ranked issues.
- Pricing assumptions are updated.
- First-run friction is measured.

### Stage V: Choose first paid wedge

Goal:

- Decide where monetization starts.

Recommended wedge:

- Small business ops plus QA/product ops.

Reason:

- Small business proves non-developer product value.
- QA/product ops monetizes existing strong primitives.

Acceptance checks:

- One consumer/prosumer pack has clear purchase intent.
- One professional pack has clear workflow ROI.

### Stage W: Build payment and license path

Goal:

- Enable paid distribution without breaking local-first trust.

Options:

- License key.
- Signed pack downloads.
- Offline grace period.
- Manual license file for privacy-sensitive buyers.

Rules:

- Do not require cloud login for free local use.
- Do not gate local user data behind a remote account.
- Paid pack updates can require account/license checks.

Acceptance checks:

- A paid user can unlock Pro or a pack.
- A user can keep using local data if license checks fail.

### Stage X: Prepare long-term platform path

Goal:

- Make Haven Desk extensible without becoming unsafe.

Platform pieces:

- Pack registry.
- Manifest validator.
- Local MCP server.
- Permission model.
- Local audit log.
- Pack signing.
- Import/export compatibility.

Acceptance checks:

- Platform can support more vertical packs.
- Security model remains understandable.

### Stage Y: Public positioning and category creation

Goal:

- Own a category before bigger companies make local AI generic.

Category phrase:

- Private AI daily runner.

Supporting phrases:

- Local AI operations desk.
- Private workflow cockpit.
- Reviewable AI for daily work.
- Your AI workspace, on your machine.

Content themes:

- Why local AI matters.
- Why chat is not enough.
- How to use AI without uploading your life.
- How small businesses can use AI privately.
- How students can study with local AI.

Acceptance checks:

- Marketing language is not developer-only.
- Privacy claims are accurate.
- Product demos show real outcomes.

### Stage Z: Iterate from retention, not feature count

Goal:

- Avoid tool sprawl and build around repeated use.

Retention signals:

- Daily brief opened.
- Capture used.
- Tasks accepted.
- Document questions answered.
- Drafts saved.
- Packs used more than once.
- Automations reviewed.

Decision rule:

- Build features that increase repeated weekly use.
- Deprioritize features that only look good in a one-time demo.

Acceptance checks:

- Roadmap decisions cite usage, feedback, or explicit strategic bets.
- Every new plugin maps to a daily or weekly job.

## Recommended implementation order

1. Save strategy docs.
2. Build persona-first app information architecture plan.
3. Build first-run Haven Desk onboarding.
4. Create plugin manifest and validator.
5. Convert existing project-pack approach into L0 packs.
6. Ship Small Business Ops pack.
7. Package QA/Product Ops as paid professional pack.
8. Build Documents surface around local RAG and citations.
9. Add privacy/trust status UX.
10. Add read-only/proposal-only MCP server.
11. Add approval queue automations.
12. Build installer and launch bundle.

## Explicit non-goals for the transition

- Do not rewrite the whole app.
- Do not remove existing QA/dev tools.
- Do not introduce cloud LLM calls into the cockpit.
- Do not add arbitrary plugin code execution in v1.
- Do not build autonomous sending, purchasing, trading, legal filing, or medical decision workflows.
- Do not claim enterprise readiness before team controls exist.

## Open decisions for Ozzy

These are the few remaining product decisions that should be made before implementation:

1. Should `Haven Desk` become the public product name while `Swiss Knife` remains the repo/internal name?
2. Which first mass-market pack should ship first: Small Business Ops, Household Secretary, or Student Tutor?
3. Should the first paid release target individual Pro users, professional packs, or a small-business setup/service offer?
4. Should the initial packaging remain local web app plus Docker/Ollama, or should a desktop installer become mandatory before public launch?

Recommended defaults:

1. Yes, use Haven Desk publicly.
2. Ship Small Business Ops first.
3. Monetize professional packs first, then Pro subscription.
4. Keep current local stack for alpha, but plan desktop installer before mass-market launch.

