# Haven Desk engineering roadmap

Implementation milestones with acceptance criteria for the Swiss Knife to Haven Desk transition.

Date: 2026-06-26

---

## North star

Haven Desk is a private AI operations desk for daily life and small business work. It captures messy input, organizes it into tasks, memory, and documents, drafts useful output, and waits for review before saving or acting. The engineering sequence below moves the app from a developer cockpit to a persona-first daily runner without rewriting the existing foundation.

The app internal name stays `swiss-knife`. No package names, ports, scripts, or DB model names change during this transition.

---

## Success criteria

### Product

- A non-technical user understands the product in under 60 seconds.
- A first-time user reaches a useful output in under 10 minutes.
- The app has a clear public name, a persona-first first-run flow, and a Packs surface.
- QA and developer tools are discoverable but not the dominant first impression.
- At least two workflow packs are defined end to end: one mass-market, one professional.

### Technical

- Local-first rule intact: no cloud LLM calls from the cockpit.
- No new cloud model calls introduced by any pack, route, or automation.
- Every model step that feeds durable state remains wrapped by deterministic validation.
- Mutating automations produce proposals in a review queue, not silent writes.
- MCP operates as a read-only and proposal-only local boundary, not a bypass around approval flows.
- The nav registry remains the single source of truth; nav.test.ts stays green.
- All milestones land with build, lint, and unit tests green. e2e count never regresses.

### Monetization

- A free tier is explicitly defined and enforced at the feature level, not just described.
- A Pro individual tier ($8-$15/mo or $79-$149/yr) is gated in code before launch.
- At least one consumer pack ($49-$199) and one professional pack ($199-$499) have a purchase path.
- Pricing page exists and maps paid features to user outcomes, not arbitrary limits.

---

## Milestones

### M0: Docs package

**Status: Shipped 2026-06-26 (this session)**

**Goal.** Produce the full transition doc set so any clean-context session can continue without reconstruction.

**Dependencies.** None. M0 is the first artifact.

**Deliverables in this session.**
- `docs/haven-desk-product-narrative.md`
- `docs/haven-desk-engineering-roadmap.md` (this file)
- `docs/haven-desk-ux-information-architecture.md`
- `docs/haven-desk-plugin-pack-spec.md`
- `docs/haven-desk-monetization-plan.md`
- `docs/haven-desk-implementation-backlog.md`
- `docs/README.md` (index including the 3 earlier strategy docs)

**Acceptance checks.**
- `docs/README.md` exists and lists every Haven Desk doc in the package.
- No doc contradicts the canon brief (`haven-desk-canon.md`).
- No doc claims a feature is built unless `haven-desk-canon.md` repo-truth section confirms it.
- A fresh agent can start from `docs/haven-desk-clean-context-prompt.md` and orient in under 5 minutes.

**Guardrails.** No code changes in M0. No feature claims beyond what the canon repo-truth section confirms.

---

### M1: Persona-first information architecture

**Status: Shipped 2026-06-26 (this session).** The nav regrouped to Today / Capture / Write / Documents / Projects / Packs / Settings; all hrefs unchanged, the eight professional QA and dev tools moved under Packs, the empty Documents group is reserved, and nav.test is green. A read-only Packs surface (`/tools/packs`) and a workspace-global pack install (`POST /api/packs/install`, gated by `validatePackManifest`) also shipped as an early slice of M4/M5. Per-project pack install via composite keys is deferred. See CLAUDE.md for detail.

**Goal.** Reshape nav and dashboard groups so a non-technical first-time user sees Today, Capture, Write, Documents, Projects, Packs, and Settings as the top-level structure. QA and developer tools move into a professional pack group, visible but not dominant.

**Dependencies.** M0 (UX IA doc specifies the target group structure and label mapping).

**What changes.**
- `cockpit/src/lib/nav.tsx`: group labels and order updated to match the target IA.
- Dashboard card grid: favorites-first ordering already exists; group ordering updated.
- Sidebar groups: Work and Write collapse into persona-facing labels; QA and Dev surface under a Packs group or via command palette search.
- `nav.test.ts`: expected groups and hrefs updated in the same commit.

**What does not change.** No routes are removed. No route hrefs change. Command palette search still reaches every tool. Existing keyboard shortcuts preserved.

**Acceptance checks.**
- `nav.test.ts` passes with zero drift warnings.
- A user whose role is "household operator" or "student" does not see Gherkin Lint, ADR Writer, or API Contract in the primary sidebar on first load.
- All 21+ existing routes are reachable from the command palette (⌘K).
- `npm run lint` and `npm run test:e2e` pass.

**Guardrails.** Atomic commit: nav.tsx change and nav.test.ts expectation update must land together. Rollback plan is a single revert.

---

### M2: First-run onboarding

**Goal.** Guide a new user from empty DB to a completed workflow in under 10 minutes, without requiring terminal knowledge.

**Dependencies.** M1 (IA must be persona-first before onboarding references its groups).

**First-run flow (6 steps).**

1. Pick persona: Household, Small business, Student, Creative, Personal documents. A sixth option labeled "QA/product ops (professional)" is available for professional users but is not one of the five canon personas.
2. Name check: optional display name (writes to `Settings.userName`, already in schema).
3. Ollama health: plain-language status ("Your AI engine is ready" or "Start the Ollama app at ollama.com").
4. Create first project: persona-vocabulary label ("Home", "My business", "Course notes", etc.).
5. Add one input: a paste, screenshot, or quick-capture note.
6. Run one guided workflow: mapped to persona (family brief, meeting notes to tasks, study plan, etc.).

**Acceptance checks.**
- Empty DB triggers first-run card; existing DB with at least one Project skips it.
- Persona picker maps to a pack recommendation and a default first workflow, but does not install a pack automatically (assumption: auto-install is deferred to M4/M5 when the loader exists).
- Ollama-down state shows the plain-language command or app download link, not a raw HTTP error.
- No Open WebUI setup required to reach first output.
- First-run flow does not appear for a returning user (checked by Settings or Task/Project count).

**Guardrails.** No new DB schema models required for M2. Persona selection is stored in `Settings` (existing model) or a new field; it does not create a separate table. First-run UI must degrade gracefully when the feature-flag equivalent is off.

---

### M3: PluginManifest type and validator

**Status: Shipped 2026-06-26 (this session, spec and implementation)**

**Goal.** Define a stable, declarative pack contract that all future pack authors implement and that the runtime loader can validate without running a model.

**What was produced this session.** `docs/haven-desk-plugin-pack-spec.md` contains the full `PluginManifest` field contract, maturity ladder, and validator behavior. The spec is normative. The TypeScript implementation is also shipped this session.

**What the code ships.**

- `cockpit/src/lib/packs/manifest.ts`: exports `PluginManifest` type (all fields per canon), `PackPermissions` type, and `validateManifest(manifest: unknown): { issues: ValidationIssue[], summary: string, ok: boolean }`. Pure function, no DB access, no model calls.
- `cockpit/src/lib/packs/examples.ts`: two example packs.
- `cockpit/src/lib/packs/manifest.test.ts`: 39 passing unit tests covering every ERROR and WARN case from the spec. Run via `npm run test:unit`.

**Acceptance checks.**

- `validateManifest` returns `ok: false` for each ERROR case: missing slug, blank name, non-kebab slug, non-semver version, unknown audience enum, unknown maturity enum, empty capabilities, empty requiredModels, duplicate template slug, duplicate fact sourceKey, duplicate task seed sourceKey, `network: true`, `externalSend: true`, `runtimeCode: true`, `autonomous: true`, L0 pack with routes or mcpTools, `mcpProposeWrites: true` at maturity below L2, knowledgeSources entry with neither path nor owuiUrl.
- `validateManifest` returns `ok: true` with WARN (not ERROR) for: L2/L3 with no mcpTools, route missing leading "/", high-stakes industry above L1, high-stakes industry without a guardrail note in setupChecks.
- A valid minimal L0 manifest validates with zero issues.
- Zero model calls during any validation run.
- All 39 unit tests pass under `npm run test:unit` (current suite floor: 290 unit / 81 e2e).

**Guardrails.** M3 is type-only and validator-only. No install mechanism, no DB model for packs, no pack loader. Those ship in M4. `.gitattributes` entry for new `.ts` files in `cockpit/src/lib/packs/` added in same commit (CRLF guard).

---

### M4: Generic L0 pack loader

**Goal.** Replace the LBMH-specific `prisma/seed-lbmh.mjs` loader with a generic pack loader that accepts a validated `PluginManifest` and upserts templates, facts, and task seeds idempotently.

**Dependencies.** M3 (manifest type must be stable before the loader implements it).

**What changes.**

- `cockpit/src/lib/packs/loader.ts`: exports `installPack(manifest: PluginManifest, prisma: PrismaClient): Promise<InstallResult>`. Upserts templates by slug, memory facts by sourceKey, tasks by sourceKey, prompts by sourceKey. Returns counts of created vs updated.
- `prisma/schema.prisma`: adds `PackInstall` model (`slug`, `name`, `version`, `installedAt`, `updatedAt`). Tracks which packs are installed for the Packs surface UI. One row per slug, upserted on install.
- `prisma/seed-lbmh.mjs`: migrated to call `installPack` with an inline manifest object (or kept as-is with a note that it predates the manifest contract; assumption: migration preferred for consistency).
- A CLI command (or an existing `npm run` script) to install a pack from a manifest file path.

**Acceptance checks.**

- `installPack` called twice with the same manifest produces no duplicates (upsert behavior).
- `npm run seed:lbmh` still produces 37 active memory facts and all LBMH templates/tasks on a fresh DB.
- `PackInstall` row exists after install; row is updated (not duplicated) on reinstall.
- All 39+ existing e2e tests pass.

**Guardrails.** The loader must call `validateManifest` and reject invalid manifests with a clear error before any DB write. The loader never runs a model call. It does not modify existing active memory facts that were not seeded by the pack (identified by sourceKey matching the pack's declared sourceKeys only).

---

### M5: Small Business Ops pack

**Goal.** Ship the first mass-market L0 pack. This is the primary proof that Haven Desk can serve non-developer users.

**Dependencies.** M4 (generic loader), M1 (Packs group exists in nav).

**Pack contents.**

- Audience: `small-business`
- Maturity: L0
- 6 workflow templates: meeting notes to tasks, proposal draft, follow-up email drafter, SOP builder, weekly business review, receipt/invoice organizer.
- Memory facts: terminology seeds for common business workflow vocabulary.
- Task seeds: onboarding checklist tasks for a new business project.
- setupChecks: explicit guardrail notes for each high-stakes area (no auto-send, no financial transactions, no tax advice).

**Acceptance checks.**

- Pack passes `validateManifest` with zero errors.
- `installPack` upserts all templates, facts, and tasks cleanly.
- A user can create a "My business" project, run meeting notes through the meeting-to-tasks template, and save reviewed tasks without QA or developer knowledge.
- No template body contains any auto-send instruction, financial transaction claim, or tax advice.
- Pack is documented with a clear "what this pack does not do" section in its `description` and `setupChecks`.
- Activity log shows pack install and each workflow run.

**Guardrails.** L0 content only. No routes, no mcpTools in the manifest. All output is draft-and-review. Pack content lives under `cockpit/projects/small-business-ops/` (gitignored per existing pattern, not committed).

---

### M6: QA/Product Ops professional pack

**Goal.** Package the existing QA and developer tools as a paid professional pack, making them installable via the Packs surface and grouping them logically for product and QA users.

**Dependencies.** M4 (loader), M5 (pack patterns proven), M1 (QA tools no longer in primary nav).

**Pack contents.**

- Audience: `professional`
- Maturity: L1 (declares cockpit routes)
- routes: `/tools/qa-pipeline`, `/tools/gherkin-lint`, `/tools/bug-report`, `/tools/rubric-designer`, `/tools/eval-cases`
- requiredModels: `["gemma4:e4b"]` (the quality tier is optional and referenced in setupChecks only)
- gates: `gherkinLint`, `rubric`, `evalCases`
- Templates: story-to-acceptance-criteria, story-to-gherkin, bug-note-to-report, release readiness checklist (new), eval rubric starter.
- Memory facts: QA terminology glossary seeds.

The routes `/tools/code-review`, `/tools/adr`, and `/tools/api-contract` belong to a separate future Dev Pack, not this pack.

**Acceptance checks.**

- Pack passes `validateManifest` with zero errors.
- All 5 declared routes exist and respond with 200.
- All 3 declared gates are callable from their respective routes.
- Release readiness checklist template produces a complete draft from a project description.
- All 81+ existing e2e tests pass after pack declaration.
- Code review route does not inject memory context (existing security constraint confirmed).
- A QA manager who is not an engineer can explain the story-to-Gherkin-to-rubric flow after one trial run.

**Guardrails.** L1 means routes exist; no new routes are built for this pack. The pack declaration is additive. Code review memory isolation (no memory injection into code analysis calls) must be verified as unchanged.

---

### M7: Documents surface

**Goal.** Make local files a first-class workflow surface: project document library, local PDF Q&A with citations, deadline extraction, and checklist generation.

**Dependencies.** M1 (Documents group in nav), M5 or M6 (at least one pack uses document workflows before building the shared surface).

**Architecture decision.** Reuse Open WebUI for local RAG and document embedding. The cockpit adds citation-annotated workflows that produce reviewable proposals. Do not build a duplicate RAG stack. The existing `Project.owuiUrl` field already supports deep-linking.

**New cockpit-level capabilities (not duplicating OWUI).**

- Deadline extraction from pasted or linked document text: produces pending Task proposals, not direct saves.
- Checklist generator: reads a document section and produces a reviewable checklist Template.
- Source citation display: when an OWUI answer is retrieved, the cockpit surfaces the source document name and chunk reference alongside the answer.

**Acceptance checks.**

- Documents section accessible from main nav.
- A project with `owuiUrl` set shows a "Open in knowledge base" button that deep-links correctly.
- Deadline extraction from a pasted contract or letter produces at least one pending Task proposal, not an auto-saved task.
- Open WebUI offline state shows a plain-language message ("Your document library isn't running; start it with `./swiss up`"), not a generic 500.
- All citation responses include at least the document label from `knowledgeSources` when OWUI returns source metadata.

**Guardrails.** cockpit-only RAG is not built in M7. If OWUI cannot serve a use case, the gap is documented for M9 (MCP) or a later pack, not solved by duplicating the embedding stack.

---

### M8: Privacy/trust UX

**Goal.** Make the local-first promise visible and auditable. Users should be able to see where their data is, which tools ran, and what a pack's permissions are before enabling it.

**Dependencies.** M7 (all major surfaces must exist before wrapping them in trust UX).

**Features.**

- Privacy status panel (sidebar or Settings): current model tier (local/external), active connectors, whether any external network calls are permitted.
- "Where is my data?" screen: lists SQLite DB path, uploads folder, Open WebUI data volume, and any configured external connectors in plain language.
- Per-pack permission display: shows `PackPermissions` booleans before pack install, in human-readable terms.
- Export/delete controls: accessible from Settings; existing `/api/export` and `/api/import` surfaced with clear labels.
- Activity log: existing `ActivityLog` model and `/tools/activity` route linked from the privacy panel.

**Acceptance checks.**

- User can see whether the last tool run used local model only.
- Packs surface shows permission summary for each installed pack before the user enables it.
- "Where is my data?" screen accurately lists all storage paths.
- A user who removes a pack sees data seeded by that pack (facts, tasks, templates by sourceKey) flagged as pack-origin in the export.
- No claims on the privacy screen that go beyond what the code actually enforces (no "private like Apple" language).

**Guardrails.** Accuracy requirement: every privacy claim must be verifiable by reading the code. The existing SSRF guard on `PUT /api/settings` and the capture token comparison with `timingSafeEqual` are the reference for what "private" means here.

---

### M9: Read-only/proposal-only local MCP

**Goal.** Expose a local MCP server so Claude Desktop, Open WebUI, and other local agents can read approved context and run deterministic gates, without bypassing the cockpit's approval flows.

**Dependencies.** M3 (PluginManifest defines the `mcpTools` field), M8 (trust UX should describe the MCP surface before it is live).

**Initial read resources.**

- Active project and project list.
- Accepted memory facts (filtered: `deletedAt IS NULL`, `status = active`).
- Templates by slug.
- Saved artifacts (prompts, ideas, email drafts, ADRs, bug reports) by project.
- Gate results (gherkinLint, lintAdr, openapiLint) as structured JSON.
- Activity summary for the last 7 days.

**Initial proposal tools (write to pending, not active state).**

- `createPendingTask`: writes a proposal item to a separate approval-queue model (a `ProposalItem` or similar dedicated model). Task.status is exactly `todo | doing | done`; proposal and review states live in a dedicated model, not as a new Task.status value.
- `createPendingMemoryFact`: writes a MemoryFact with `status = pending` (already exists in schema).
- `exportProjectContext`: returns a structured JSON snapshot of the active project's facts, templates, and recent tasks for downstream use.
- Deterministic gates callable as read-only tools: `runGherkinLint`, `runAdrLint`, `runOpenapiLint`, `runCodeSmells`.

**Acceptance checks.**

- MCP server binds to `127.0.0.1` only.
- Every tool call requires a valid `x-capture-token` header (reuse `captureAuth.ts` pattern).
- Every tool call writes a row to `ActivityLog`.
- Proposal tools write to pending state only; no tool directly sets `status = active` on a MemoryFact or `status = done` on a Task.
- A test confirms that an MCP tool call cannot bypass the save-after-review invariant.
- `./swiss doctor` reports MCP server status.

**Guardrails.** MCP is local-only. No cloud routing. The `network: false` invariant from PluginManifest applies to all MCP tool declarations. L2 packs that declare `mcpTools` must list only tools registered in the MCP server.

---

### M10: Approval-queue automation

**Goal.** Add watched-folder ingest and scheduled routines that deposit proposals into a review queue, moving Haven Desk from a manual tool toward a daily runner without unsafe autonomy.

**Dependencies.** M9 (MCP proposal tools established the pending-state pattern; automations follow the same convention).

**Automations.**

- Morning brief: generates a DailyBrief summary and deposits it as a pending Idea for review.
- End-of-day wrap-up: scoped to active project tasks completed that day; produces a pending Idea (already partially implemented in existing `/api/routines/[slug]`; extend to pending state).
- Watched folder ingest: monitors a configured local directory; new files produce pending Idea proposals with the file path and an AI-generated summary.
- Clipboard/shortcut capture: existing `/api/capture` path; already review-gated via the existing capture token.
- Weekly review: generates a weekly summary proposal on a scheduled interval.
- Pending memory review: surfaces pending MemoryFacts for batch accept/dismiss in the Today panel (already partially in DailyBrief).

**Approval queue.**

- A unified queue view (new route `/tools/queue` or integrated into Today panel) shows all pending proposals: source (automation name, trigger time), content, and per-proposal actions (accept, edit, dismiss, delete).
- Accepting a proposal writes it to active state with the exact reviewed content.
- Activity log records: automation run, number of proposals created, proposals accepted/dismissed.

**Acceptance checks.**

- No automation silently writes to an active Task, MemoryFact, EmailDraft, or Idea.
- Every proposal requires at least one explicit user action (accept button or edit-then-save).
- Approval queue shows source label and trigger time for each proposal.
- Watched folder ingest does not process files larger than a configurable cap (assumption: 10 MB default; to be confirmed in backlog).
- `./swiss doctor` reports watched folder status and last automation run time.

**Guardrails.** L3 packs that declare automations must route all outputs through the proposal queue. The `autonomous: false` invariant from PluginManifest is enforced by the loader: a pack with `autonomous: true` in permissions fails validation.

---

### M11: Installer + launch bundle

**Goal.** Remove terminal-knowledge requirements from the initial setup and produce a coherent product launch with website, demo, and documentation.

**Dependencies.** M0 through M10 (all surfaces must be built before the installer is meaningful).

**Installer jobs (both platforms).**

- Check hardware (RAM, disk space).
- Install or verify Ollama app (macOS: detect cask vs formula and surface the fix; Windows: winget path with CUDA check).
- Pull default model (`gemma4:e4b` first, quality tier soft-fails).
- Start local services (Docker compose up).
- Open Haven Desk in the browser.
- Run `./swiss doctor` checks and surface any failures with copy-paste fixes.

**Launch bundle assets.**

- Product website with: home, privacy/local-first page, use cases, packs catalog, pricing, download, and docs pages.
- Demo video or guided walkthrough per persona (5 personas = 5 demos).
- Getting-started doc that fits on one page for non-technical users.
- Known limitations page (honest about model quality at L0, single-user, no team admin yet).

**Acceptance checks.**

- macOS installer: non-technical install instructions fit on one printed page.
- Windows installer: `.\swiss doctor` all green after a clean install (verified by Ozzy on Windows hardware, matching the June 10 precedent).
- App and website copy are consistent on product name, tagline, and local-first claim.
- Installer does not pull any cloud model or introduce cloud LLM calls.
- Existing Docker/Ollama path preserved for power users with a documented override.
- A fresh-clone `./swiss up` rehearsal passes end to end on macOS before launch.

**Guardrails.** Do not claim enterprise readiness in any launch copy before team admin, auth, update, and backup controls exist. Known limitations page must exist at launch.

---

## Cross-cutting risks and mitigations

**Model output quality at L0 packs.** The light `gemma4:e4b` produces inconsistent results on unfamiliar workflows. Every L0 pack must ship with well-tested templates calibrated for that model tier. Pack acceptance checks include a live test on `gemma4:e4b` before shipping.

**Nav drift.** The nav.test.ts tripwire has caught drift twice. M1 restructures the registry. The mitigation is an atomic commit rule: nav.tsx and nav.test.ts expectations must change in the same commit. CI failure blocks merge.

**Open WebUI dependency in Documents surface.** OWUI can be offline. M7 must degrade gracefully: cockpit workflows that do not require OWUI (deadline extraction from pasted text) must work regardless. The health banner pattern already exists.

**Pack security and prompt injection.** A pack author could embed prompt injection in template bodies or fact values. Mitigations: `validateManifest` enforces structural constraints; high-stakes industries require explicit guardrail notes in `setupChecks`; pack content is human-reviewed static text before inclusion.

**MCP becoming a noise source.** If MCP proposal tools produce uncapped pending entries, the approval queue becomes unusable. Per-session rate caps on proposal tools are an assumption to be decided in the implementation backlog before M9 ships.

**Windows line endings.** The `.gitattributes` regression from the June 10 audit showed CRLF breaking Docker entrypoints. New files added in M3 (`cockpit/src/lib/packs/*.ts`) must be covered by `.gitattributes` in the same commit.

**First-run blocking returning users.** The first-run card must check for an existing DB state before showing. The check can be: at least one Project row exists, or `Settings.userName` is set. An incorrect check would re-show onboarding to existing users on every boot.

**`NODE_ENV` poisoning next build.** Established in project memory: always build with `env -u NODE_ENV next build`. Any CI or installer script that calls `next build` must unset `NODE_ENV` first.

---

## Sequencing rationale

M0 comes first because every milestone references the canonical docs, and because the docs catch contradictions before any code is written.

M3 comes before M4 because the loader must implement the stable manifest type, not guess at it. Writing the type contract first avoids a breaking schema change mid-pack development.

M1 and M2 can proceed in parallel with M3 and M4 after M0. M2 depends on M1 (the IA must be persona-first before onboarding references its groups), but neither M1 nor M2 touches the pack system. The two streams can merge at M5.

M5 and M6 both depend on M4 and can be built in parallel. M5 is the mass-market proof point; M6 packages the existing professional tools. Doing them together means the Packs surface (part of M1) has two concrete packs to display.

M7 comes after at least one pack is proven. Building the Documents surface before any pack exists means building it in a vacuum. Having M5 or M6 shipping first gives Documents a realistic test case (a small business project with meeting notes already in it, or a QA project with feature files).

M8 wraps privacy UX around features that must exist. Building trust UX before the features are real produces a misleading screen. M8 after M7 means the privacy panel has all major surfaces to describe.

M9 exposes a new external surface (local MCP). That surface should be described by the privacy/trust UX (M8) before it is live.

M10 adds watched folders and automations. These interact with the proposal tools from M9. Building M10 before M9 would require inventing the proposal queue twice.

M11 is last because it bundles everything. The installer is meaningless without a working product, and the launch copy cannot be accurate until the product is built.

---

## Issue-level tasks

See `docs/haven-desk-implementation-backlog.md` for file-level tasks, priority order, and acceptance detail per issue.
