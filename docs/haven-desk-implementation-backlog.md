# Haven Desk implementation backlog

Bridge from strategy to commits. Each item maps to a single PR.
Date: 2026-06-26

---

## How to read this

Each item follows this layout:

- **Why:** the user or engineering reason for the task
- **Scope:** what changes and what does not
- **Files:** primary files touched (paths relative to repo root)
- **Acceptance:** observable conditions that close the item
- **Verify:** exact command(s) to confirm; run from `cockpit/` unless noted otherwise
- **Size:** S (under half a day), M (one day), L (two to three days)
- **Depends-on:** backlog IDs that must land first

Items marked **[SHIPPED]** were completed in this planning session. They are already present in the repo or docs package. Do not reopen them.

Items marked **(Assumption)** contain at least one fact not confirmed by the repo or the canon brief. Treat them as hypotheses to verify before starting the task.

Milestones M0..M11 map to the engineering sequence in `docs/haven-desk-engineering-roadmap.md`. For the product narrative behind each milestone, see `docs/haven-desk-product-narrative.md`. For the UX target state, see `docs/haven-desk-ux-information-architecture.md`. For the pack contract spec, see `docs/haven-desk-plugin-pack-spec.md`. For pricing and licensing context, see `docs/haven-desk-monetization-plan.md`. For the three existing strategy docs (report, A-to-Z roadmap, clean-context prompt), see `docs/README.md`.

---

## M0: Docs and repo foundation [SHIPPED]

Goal: move the product thesis and strategy into durable repo artifacts so any session can pick up without re-deriving context.

### T-01: Haven Desk docs index [SHIPPED]

**Why:** Seven docs are being produced across this session. Without an index file, the next agent or engineer must `ls docs/` and read file names to understand which doc covers what.
**Scope:** Create `docs/README.md` listing all seven Haven Desk doc filenames with a one-line description each. Includes the three existing strategy docs. Does not touch any strategy doc or code.
**Files:** `docs/README.md`
**Acceptance:** `docs/README.md` lists at least seven `.md` files with descriptions. No links point to non-existent files. No hype language.
**Verify:** From repo root: `ls docs/`, `grep ".md" docs/README.md`
**Size:** S
**Depends-on:** none

---

### T-02: Top-level README link to Haven Desk docs [SHIPPED]

**Why:** A developer or journalist landing on the repo sees only "Swiss Knife, the developer cockpit." The public product name and transition context are invisible.
**Scope:** Add a short "Haven Desk" section near the top of the root `README.md` (2 to 3 sentences, link to `docs/README.md`). Do not replace existing install or setup content.
**Files:** `README.md`
**Acceptance:** `grep -i "haven desk" README.md` returns at least one match. Existing `./swiss up` install path is intact.
**Verify:** From repo root: `grep -i "haven desk" README.md`
**Size:** S
**Depends-on:** T-01

---

## M1: PluginManifest type and pure validator [SHIPPED]

Goal: define a declarative pack contract before writing any pack content. No marketplace, no runtime code in v1.

### T-03: PluginManifest TypeScript type [SHIPPED]

**Why:** The current L0 seeding pattern (`prisma/seed-lbmh.mjs` + `cockpit/projects/<name>/pack/content.mjs`) is ad hoc. Every future pack author needs a single canonical type, and every load path needs a contract to validate against.
**Scope:** TypeScript type `PluginManifest` and `PackPermissions` in `cockpit/src/lib/packs/manifest.ts`. Fields match the canon exactly: `slug`, `name`, `version`, `description`, `audience`, `industry`, `maturity`, `capabilities`, `requiredModels`, `templates`, `memoryFacts`, `taskSeeds`, `knowledgeSources`, `gates`, `routes`, `mcpTools`, `permissions`, `setupChecks`. No runtime logic in this file. All enum-typed fields use TypeScript union literals. No `any`.
**Files:** `cockpit/src/lib/packs/manifest.ts`
**Acceptance:** `import type { PluginManifest } from '@/lib/packs/manifest'` compiles cleanly. `npm run build` exits 0.
**Verify:** `npm run build`
**Size:** S
**Depends-on:** none

---

### T-04: Pure validator (validateManifest) [SHIPPED]

**Why:** The deterministic gate pattern used in `gherkinLint`, `lintAdr`, and `openapiLint` must cover packs. A broken pack must fail before any DB write occurs.
**Scope:** `validateManifest(manifest: unknown): { issues: ValidationIssue[], summary: string, ok: boolean }` in `cockpit/src/lib/packs/manifest.ts` (implemented this session alongside the type). Pure function, zero I/O, no model calls. Implements all ERROR rules from the canon: missing or empty required fields, slug format, semver format, audience and maturity not in enum, capabilities or requiredModels empty, duplicate slugs or sourceKeys within the manifest, `network`/`externalSend`/`runtimeCode`/`autonomous` set true, L0 declaring routes or mcpTools, `mcpProposeWrites` true below L2, and knowledgeSource entries with neither `path` nor `owuiUrl`. Implements WARN rules: L2 or L3 with no mcpTools, routes not starting with "/", high-stakes industry at maturity above L1, high-stakes industry without a guardrail note in `setupChecks`. Vitest unit tests covering every ERROR and WARN path are in `cockpit/src/lib/packs/manifest.test.ts` (39 tests total).
**Files:** `cockpit/src/lib/packs/manifest.ts`, `cockpit/src/lib/packs/manifest.test.ts`
**Acceptance:** Every canon ERROR case produces `ok: false` and an issue with `level: "ERROR"`. Every canon WARN case produces an issue with `level: "WARN"` and `ok: true` (unless paired with an ERROR). A complete valid manifest produces `ok: true` and zero issues. Unit tests pass.
**Verify:** From `cockpit/`: `npm run test:unit` (39 tests in `manifest.test.ts`, all pass)
**Size:** M
**Depends-on:** T-03

---

### T-05: Example pack manifests (household and small-business stubs) [SHIPPED]

**Why:** Pack authors need working examples to copy. The stubs also act as integration tests for the validator: a valid manifest must produce `ok: true`; an intentionally broken one must produce the expected issue list.
**Scope:** Two example pack manifests exported from `cockpit/src/lib/packs/examples.ts` (implemented this session). Each exports a const typed as `PluginManifest`. Content is minimal but fully valid: 1 to 2 templates, 2 to 3 memory facts, 1 task seed, correct semver, correct audience and maturity. Tests in `cockpit/src/lib/packs/manifest.test.ts` run `validateManifest` on each example and assert `ok === true`.
**Files:** `cockpit/src/lib/packs/examples.ts`, `cockpit/src/lib/packs/manifest.test.ts`
**Acceptance:** `validateManifest(householdExample).ok === true`. `validateManifest(smallBusinessExample).ok === true`. Unit tests pass.
**Verify:** `npm run test:unit`
**Size:** S
**Depends-on:** T-04

---

## M2: Persona-first nav reorg

Goal: a non-technical user does not see QA and developer tools as the dominant first impression.

### T-06: Consumer nav groups in nav.tsx

**Why:** Current groups are `work | write | qa | dev | system`. A household operator or small business owner should see groups oriented around daily tasks, not developer workflows.
**Scope:** Edit `cockpit/src/lib/nav.tsx`. Add or rename top-level groups to match the target IA from `docs/haven-desk-ux-information-architecture.md`. Move QA and dev items into a `professional` group. Do not delete any existing routes. Do not change any `href`. Update the group union type. Update `nav.test.ts` to allow the new group names (the drift tripwire must stay green; the test is the acceptance gate).

**Note:** `nav.test.ts` is the primary acceptance test for this task. Read its current allowed-groups assertion before editing `nav.tsx`. If the test fails after the edit, `nav.tsx` and `nav.test.ts` are out of sync; fix both before committing.

**Files:** `cockpit/src/lib/nav.tsx`, `cockpit/src/lib/nav.test.ts`
**Acceptance:** Sidebar renders the new primary groups. QA and dev routes are still reachable under the `professional` group. `nav.test.ts` passes with the updated group list. `npm run build` and `npm run lint` exit 0.
**Verify:** `npm run test:unit` (nav.test.ts must pass), `npm run build`, `npm run lint`
**Size:** M
**Depends-on:** T-01 (UX IA doc exists as reference)

---

### T-07: Dashboard grid persona-first ordering

**Why:** The Dashboard currently shows tool cards in nav-registry order, which places QA Pipeline and Code Review at the same visual weight as Tasks and Email Writer.
**Scope:** In `cockpit/src/app/page.tsx`, filter or sort the grid so consumer group cards render before professional group cards. A visible section divider separates the two groups. No route is hidden. Professional group cards still appear below the divider.
**Files:** `cockpit/src/app/page.tsx`
**Acceptance:** Consumer tools appear in the first grid section. QA Pipeline and Code Review appear below the divider. Removing the divider in code should make both sections equal again.
**Verify:** `npm run build`, `npm run lint`
**Size:** S
**Depends-on:** T-06

---

## M3: First-run onboarding

Goal: a new user reaches one useful workflow in under 10 minutes without reading the README.

### T-08: Persona picker screen

**Why:** The current first-run card (empty DB, `Settings.userName` null) shows a generic "local-only" message. A persona picker lets Haven Desk preload the right project template, memory facts, and task seeds.
**Scope:** New `/onboarding` page, shown on the first Dashboard load when `Settings.userName` is null and no project exists. Five canon personas (Household, Student, Small business, Creative, Personal admin) plus a sixth option labeled "QA and Product Ops (professional)" for engineering and QA teams. The canon persona list has five entries; the sixth option is a professional audience choice, not a persona. Picking a choice stores it in `Settings` via a new `persona` field (add to `prisma/schema.prisma`, then `npm run db:push`). After picking, redirect to project creation. A returning user (userName set) never sees the picker.
**Files:** `cockpit/src/app/onboarding/page.tsx`, `cockpit/prisma/schema.prisma` (add `Settings.persona String?`), `cockpit/src/app/api/settings/route.ts` (update PUT handler for new field)
**Acceptance:** Fresh DB shows the picker on first Dashboard visit. Picking "Small business" stores `persona = "small-business"` in Settings and redirects. A second visit skips the picker. `npm run db:push` applies the migration without data loss on an existing DB.
**Verify:** `npm run db:push`, `npm run build`, `npm run lint`, `npm run test:e2e` (add one route-mocked e2e for the onboarding redirect)
**Size:** M
**Depends-on:** T-06

---

### T-09: Engine health check in first-run flow

**Why:** If Ollama is absent during onboarding, the current HealthBanner does not appear on the onboarding page, leaving a new user with no actionable guidance.
**Scope:** On the `/onboarding` page, show a plain-language engine status. Reuse `GET /api/health` (no new route). Copy: "Local AI is ready" when healthy; "Local AI is not running. Open the Ollama app or run `ollama serve`." when not. Copy must be platform-neutral (no "macOS only" in the cockpit, which runs in a container).
**Files:** `cockpit/src/app/onboarding/page.tsx`
**Acceptance:** Engine-down state shows actionable copy. Engine-up state shows confirmation. No new API route is added.
**Verify:** `npm run lint`, `npm run build`
**Size:** S
**Depends-on:** T-08

---

### T-10: First guided workflow card

**Why:** After persona and project creation the user lands on Dashboard with no obvious next step.
**Scope:** After onboarding completes, a "Start here" card renders on Dashboard pointing to the persona-appropriate tool. For "small-business": links to Email Writer with a placeholder note. For "household": links to Tasks with a daily-brief suggestion. For "qa-product-ops": links to QA Pipeline. The card stores a dismissed state in `sessionStorage` and disappears after the user navigates to the linked tool.
**Files:** `cockpit/src/app/onboarding/page.tsx` (sets sessionStorage on redirect), `cockpit/src/app/page.tsx` (reads sessionStorage and renders card)
**Acceptance:** Completing onboarding shows the "Start here" card on Dashboard. Navigating to the linked tool dismisses the card. Refreshing Dashboard after dismissal does not re-show the card (sessionStorage persists within the tab session).
**Verify:** `npm run build`, `npm run lint`
**Size:** S
**Depends-on:** T-08, T-06

---

## M4: L0 pack loader generalization

Goal: any valid PluginManifest can be installed idempotently. The LBMH seeding pattern becomes one instance of a shared loader.

### T-11: loadPack() loader function

**Why:** `prisma/seed-lbmh.mjs` has bespoke upsert logic that will diverge from any new pack's shape. A typed `loadPack(manifest: PluginManifest, projectId?: string)` function becomes the single install path for all packs.
**Scope:** `cockpit/src/lib/packs/loader.ts`. Calls `validateManifest()` first and throws on any ERROR (no partial writes). Then upserts templates by slug, facts by sourceKey (skips pinned facts to prevent overwriting user edits), prompts by sourceKey, tasks by sourceKey. Attaches `projectId` where provided. Returns `{ templates: number, facts: number, tasks: number, skipped: number }`. Add `loader.test.ts` using a mocked Prisma client.
**Files:** `cockpit/src/lib/packs/loader.ts`, `cockpit/src/lib/packs/loader.test.ts`
**Acceptance:** Installing the small-business example manifest twice produces the same DB state both times (idempotent). Installing a manifest with a validation ERROR throws before any DB write. Unit tests pass.
**Verify:** `npm run test:unit`
**Size:** M
**Depends-on:** T-04, T-05

---

### T-12: Pack install API route and npm script

**Why:** Engineers and future installer tooling need a way to install a pack without running `node prisma/seed-*.mjs` by hand. An API route and npm script make packs installable programmatically.
**Scope:** `POST /api/packs/install` accepts `{ manifest: PluginManifest, projectId?: string }`. Auth: header-only capture token with `timingSafeEqual` (existing `lib/captureAuth.ts` pattern). Calls `loadPack()`. Returns `{ ok: boolean, installed: object, skipped: number }`. Add `npm run pack:install -- --file path/to/manifest.ts` to `cockpit/package.json` via a `cockpit/scripts/install-pack.mjs` wrapper.
**Files:** `cockpit/src/app/api/packs/install/route.ts`, `cockpit/package.json`, `cockpit/scripts/install-pack.mjs`
**Acceptance:** A valid manifest with the correct token returns 200 `{ ok: true }`. A missing token returns 401. A manifest with a validation ERROR returns 400 with the issue list. No partial writes on ERROR.
**Verify:** `npm run lint`, `npm run build`
**Size:** M
**Depends-on:** T-11

---

### T-13: Migrate LBMH seeding to use loadPack()

**Why:** After T-11 lands, `prisma/seed-lbmh.mjs` contains duplicated upsert logic that diverges from the generic loader. Migrating it reduces the surface area for future bugs.
**Scope:** Refactor `prisma/seed-lbmh.mjs` to import the LBMH pack manifest from `cockpit/projects/lbmh/manifest.ts` (gitignored) and call `loadPack()`. The LBMH manifest is a `PluginManifest` typed file that captures all 37 facts, 4 templates, 3 prompts, and task seeds previously hardcoded in the seed script. Net result: same DB state, less duplicated code.
**Files:** `prisma/seed-lbmh.mjs`, `cockpit/projects/lbmh/manifest.ts` (gitignored)
**Acceptance:** `npm run seed:lbmh` on a clean DB produces 37 memory facts, 4 templates, and 3 prompts, same as before. Running it twice is idempotent. Full e2e suite still passes.
**Verify:** `npm run seed:lbmh`, then `npm run test:unit && npm run test:e2e`
**Size:** S
**Depends-on:** T-11

---

## M5: Small Business Ops L0 pack content

Goal: the first mass-market pack ships as a valid PluginManifest that installs cleanly and demonstrates real business workflow value.

### T-14: Small Business Ops manifest

**Why:** The example stub (T-05) is minimal. The shipping manifest needs real workflow templates and facts.
**Scope:** `cockpit/src/lib/packs/small-business-ops/manifest.ts`. Audience: `small-business`. Maturity: `L0` (no routes, no mcpTools). Six templates: `sb-meeting-notes-to-tasks`, `sb-proposal-writer`, `sb-follow-up-email`, `sb-sop-builder`, `sb-weekly-review`, `sb-receipt-memo`. Eight to twelve memory facts covering business-context vocabulary (no client PII). Four task seeds for new-project setup. `setupChecks` must include the string "Review every draft before sending or storing." All six `PackPermissions` booleans remain false.
**Files:** `cockpit/src/lib/packs/small-business-ops/manifest.ts`
**Acceptance:** `validateManifest(smallBusinessOpsManifest).ok === true`. All six template bodies are non-empty. At least one template body uses a `{{variable}}` placeholder. Add tests to `manifest.test.ts` and run `npm run test:unit`.
**Verify:** `npm run test:unit`
**Size:** M
**Depends-on:** T-04, T-11

---

### T-15: Meeting notes to tasks template

**Why:** "Paste meeting notes, get tasks and a follow-up draft" is the primary pitch of the Small Business Ops pack. It must work end to end before the pack ships.
**Scope:** The `sb-meeting-notes-to-tasks` template body instructs the model to extract action items, assignees, and deadlines from raw meeting notes and produce a JSON array `{ action: string, assignee?: string, dueDate?: string }[]`. Uses `chatJson` from `cockpit/src/lib/ollama.ts` for structured output (no regex fallback). A gate function in `cockpit/src/lib/meetingNotes.ts` validates the array: each item needs a non-empty `action`. Add the template to the Small Business Ops manifest (T-14). Add a Prompt Library entry with `sourceKey: "sb-meeting-notes-prompt"`.
**Files:** Template body in `cockpit/src/lib/packs/small-business-ops/manifest.ts`, `cockpit/src/lib/meetingNotes.ts`, `cockpit/src/lib/meetingNotes.test.ts`
**Acceptance:** Installing the pack and running the template against a three-paragraph meeting note returns at least two task items from `chatJson`. Gate rejects a response with any item missing `action`. Unit tests for the gate function pass.
**Verify:** `npm run test:unit`, then a manual live test with Gemma running
**Size:** S
**Depends-on:** T-14, T-12

---

### T-16: Packs page (discovery and install)

**Why:** There is no `/packs` surface in the cockpit. A non-technical user who installs Haven Desk must be able to discover and install packs from within the UI, not from the terminal.
**Scope:** New `/packs` page. Lists installed and available packs. Each card shows name, description, maturity badge, audience, and capabilities (not the raw field names). An "Install" button calls `POST /api/packs/install` with the selected project. A second click shows "Installed" state. Track install state via a new `InstalledPack` Prisma model or a JSON column on `Settings` (see assumption below). Add `/packs` to `nav.tsx` under the consumer group.
**Files:** `cockpit/src/app/packs/page.tsx`, `cockpit/src/app/api/packs/install/route.ts` (extended from T-12), `cockpit/prisma/schema.prisma` (add install-state tracking)
**Acceptance:** `/packs` renders the Small Business Ops pack card. Clicking Install seeds the pack into the current project. `nav.test.ts` passes after the nav entry is added.
**Verify:** `npm run db:push`, `npm run build`, `npm run lint`, `npm run test:unit` (nav drift check)
**Size:** L
**Depends-on:** T-06, T-12, T-14

**(Assumption):** An `InstalledPack` model `{ id, slug, version, projectId?, installedAt }` is simpler to query than a JSON column and allows per-project install tracking. Either approach is valid; the engineer implementing T-16 should decide and document the choice before the PR.

---

## M6: QA and Product Ops pack grouping

Goal: the existing QA and developer tools become a named professional pack, not removed routes.

### T-17: QA and Product Ops pack manifest

**Why:** QA Pipeline, Gherkin Lint, Bug Report, Rubric Designer, and Eval Cases exist as first-class nav items with no grouping under a named pack. Wrapping them in a manifest makes them discoverable in the Packs page and clearly scoped as professional tools. Dev tools (ADR, Code Review, API Contract) belong to a separate future Dev Pack and are not included here.
**Scope:** `cockpit/src/lib/packs/qa-product-ops/manifest.ts`. Audience: `professional`. Maturity: `L1` (existing routes are declared). `routes`: `["/tools/qa-pipeline", "/tools/gherkin-lint", "/tools/bug-report", "/tools/rubric-designer", "/tools/eval-cases"]`. `requiredModels`: `["gemma4:e4b"]` (the 12B quality tier is optional; mention it only in `setupChecks`). `gates`: `["gherkinLint", "rubric", "evalCases"]`. At least five capability strings matching the listed routes. No new DB model or route is created in this task.
**Files:** `cockpit/src/lib/packs/qa-product-ops/manifest.ts`
**Acceptance:** `validateManifest(qaProductOpsPack).ok === true`. Maturity is `L1` (not L0, because routes are declared). All routes start with "/". Add tests to `manifest.test.ts` and run `npm run test:unit`.
**Verify:** `npm run test:unit`
**Size:** S
**Depends-on:** T-04

---

### T-18: Release readiness checklist template

**Why:** The QA pack's stated capabilities include "release readiness checklist," which does not exist yet as a template or route.
**Scope:** Template slug `qa-release-readiness`. Category: `qa`. Body instructs the model (via `chatJson`) to produce a checklist with sections: test coverage status, known issues, rollback plan, stakeholder sign-off, and deployment steps. Gate: the response must contain at least four non-empty sections (otherwise ERROR). Add to the QA pack manifest (T-17) and to the Prompt Library.
**Files:** Template body in `cockpit/src/lib/packs/qa-product-ops/manifest.ts`, `cockpit/src/lib/releaseReadiness.ts`, `cockpit/src/lib/releaseReadiness.test.ts`
**Acceptance:** Running the template against a one-paragraph release description returns a checklist with at least four sections. Gate blocks a response with fewer. `validateManifest(qaProductOpsPack).ok === true` still holds after adding the template. Unit tests pass.
**Verify:** `npm run test:unit`, manual live test
**Size:** S
**Depends-on:** T-17, T-04

---

### T-19: Professional group visibility by persona

**Why:** With T-06, QA and dev tools move to the `professional` nav group. A household or student user should not see that group at the same visual weight as consumer tools.
**Scope:** In `cockpit/src/lib/nav.tsx` (and its consumer, `SidebarNav` or equivalent), the `professional` group renders expanded only when `Settings.persona` is `qa-product-ops` or when the QA pack is installed (from T-16 install state). For all other personas it renders collapsed under an "Advanced tools" disclosure. Uses the persisted Settings value from T-08, no new API call needed.
**Files:** `cockpit/src/lib/nav.tsx`, sidebar component (path depends on existing file structure)
**Acceptance:** Persona `household` sees the professional group collapsed on fresh load. Persona `qa-product-ops` sees it expanded. `nav.test.ts` still passes (all routes registered regardless of collapsed state).
**Verify:** `npm run test:unit`, `npm run build`
**Size:** M
**Depends-on:** T-06, T-08, T-17

---

## M7: Documents surface

Goal: local files become a first-class entry point for the Personal Admin persona.

### T-20: Documents page and project knowledge base link

**Why:** Documents are currently accessible only via Open WebUI, deep-linked from `Project.owuiUrl`. There is no `/documents` route in the cockpit.
**Scope:** New route `/documents`. If the active project has an `owuiUrl`, show an "Open document library" button that opens the URL in a new tab (existing behavior, now surfaced from a dedicated page). If `owuiUrl` is null, show a setup card: "Connect a knowledge base in Open WebUI, then add the link in Settings." Also list `Idea` records with a non-null `imagePath` as captured local documents. No new DB model needed.
**Files:** `cockpit/src/app/documents/page.tsx`, `cockpit/src/lib/nav.tsx` (add Documents to consumer group)
**Acceptance:** `/documents` renders when `owuiUrl` is null (shows setup card) and when it has a value (shows open button). `Idea` records with `imagePath` appear in the list. `nav.test.ts` passes after adding the route.
**Verify:** `npm run build`, `npm run lint`, `npm run test:unit` (nav drift)
**Size:** M
**Depends-on:** T-06

---

### T-21: Citation-first document Q&A tool

**Why:** The Personal Admin persona needs answers from local documents with visible citations. Open WebUI handles the RAG; the cockpit wraps it with citation-first copy and a save-as-note path.
**Scope:** New tool page `/tools/doc-qa` using the existing `AiToolShell` pattern. The tool takes a plain-language question, proxies it to the active project's OWUI RAG endpoint, and renders the response with source references shown before the answer body. "Save as note" calls `POST /api/ideas` with the reviewed output verbatim (no model re-run).
**Files:** `cockpit/src/app/tools/doc-qa/page.tsx`, `cockpit/src/app/api/doc-qa/route.ts`
**Acceptance:** A question against a project with an OWUI knowledge base returns an answer with at least one source reference rendered above the body text. "Save as note" writes the output verbatim (confirmed by checking the saved Idea). Tool appears in nav and on the Documents page.
**Verify:** `npm run lint`, `npm run build`, manual live test with OWUI running
**Size:** M
**Depends-on:** T-20

---

### T-22: Deadline extractor

**Why:** The Personal Admin persona's primary task is tracking document deadlines (insurance renewals, warranties, tax notices). A deadline extractor turns pasted document text into reviewable task proposals.
**Scope:** New tool `/tools/deadline-extractor`. Uses `chatJson` to produce `{ deadline: string, action: string, source: string }[]`. Gate in `cockpit/src/lib/deadlineExtractor.ts`: each item must have a non-empty `deadline` and `action` (otherwise ERROR). "Add to tasks" creates one pending Task per accepted item using `POST /api/tasks`. `lib/quickDates.ts` normalizes date strings before saving.
**Files:** `cockpit/src/app/tools/deadline-extractor/page.tsx`, `cockpit/src/app/api/deadline-extractor/route.ts`, `cockpit/src/lib/deadlineExtractor.ts`, `cockpit/src/lib/deadlineExtractor.test.ts`
**Acceptance:** A sample insurance notice produces at least one deadline item. The gate rejects a response with an item missing `deadline` or `action`. "Add to tasks" creates tasks in a non-accepted state (user must explicitly save each). Unit tests for the gate pass.
**Verify:** `npm run test:unit`, `npm run lint`, `npm run build`
**Size:** M
**Depends-on:** T-20

---

## M8: Privacy and trust UX

Goal: make local-first visible and verifiable to non-technical users.

### T-23: Privacy status panel

**Why:** Haven Desk's core promise is "private by default." A non-technical user has no current way to verify that no data left their machine.
**Scope:** New `/settings/privacy` page (or a section inside the existing `/settings` page). Shows: local model currently active (from `getEffectiveConfig()`), base URL with a label ("Local" when loopback or `host.docker.internal`, "External" otherwise), a list of enabled external connectors (currently none in v1), and a link to the Activity Log. Uses plain language: "Your AI requests go to: Local AI (gemma4:e4b) on this computer." No new API route needed; reads existing `/api/settings` response.
**Files:** `cockpit/src/app/settings/privacy/page.tsx` (or extend `cockpit/src/app/settings/page.tsx`)
**Acceptance:** The page renders showing the current model and baseUrl. A loopback baseUrl is labeled "Local." A non-loopback baseUrl displays a warning message.
**Verify:** `npm run build`, `npm run lint`
**Size:** S
**Depends-on:** none

---

### T-24: Per-pack permission display on the Packs page

**Why:** A user who installs a pack must see what it can and cannot do before deciding to trust it with their project data.
**Scope:** On `/packs` (T-16), each pack card shows a permissions summary in plain language. For all v1 packs, all six dangerous permissions (`network`, `externalSend`, `runtimeCode`, `autonomous`, `mcpProposeWrites`) are false. The card shows: "No network access. Runs locally. No external sending." For any future pack that somehow passes validation with a true permission (not possible in v1 per validator rules), the card highlights it in amber.
**Files:** `cockpit/src/app/packs/page.tsx`
**Acceptance:** Small Business Ops and QA pack cards both show the "no network" summary. A manually constructed pack with `network: true` would fail the validator before reaching the UI; the display never needs to show a live example in v1.
**Verify:** `npm run build`, `npm run lint`
**Size:** S
**Depends-on:** T-16, T-04

---

### T-25: Export and delete controls on the privacy page

**Why:** `GET /api/export` and existing delete paths work but are not linked from any discoverable settings surface.
**Scope:** On `/settings/privacy` (T-23), add: a "Download data backup" button that calls `GET /api/export` and triggers a file download; a "Delete all local data" button behind the existing `ConfirmDialog` component. Confirm copy: "This deletes all tasks, notes, memory, and drafts stored locally. This cannot be undone." Soft-deleted (Trash) facts must not appear in the export; confirm with `backupCoverage.test.ts`.
**Files:** `cockpit/src/app/settings/privacy/page.tsx`
**Acceptance:** Download button produces a valid JSON backup. The delete dialog appears before any data is removed. `npm run test:unit` passes (`backupCoverage.test.ts` confirms Trash facts excluded from export).
**Verify:** `npm run test:unit` (backupCoverage.test.ts), `npm run build`
**Size:** S
**Depends-on:** T-23

---

## M9: Read-only and proposal-only MCP server

Goal: external agents can read cockpit state and propose changes without bypassing the review pattern.

### T-26: MCP server scaffold

**Why:** Stage J of the roadmap adds MCP as a safe local capability boundary. The server must bind to localhost only, require a header token, and log all tool calls.
**Scope:** New `cockpit/src/mcp/server.ts` (or a separate `mcp-server/` package at repo root). Binds to `127.0.0.1:4143`. Header auth: reuses the `CAPTURE_TOKEN` pattern with `timingSafeEqual` from `lib/captureAuth.ts`. Every tool call writes a row to `ActivityLog` via `logActivity`. No resources or tools ship in this task; those follow in T-27 and T-28.

**(Assumption):** The MCP TypeScript SDK version is not yet pinned. Before writing T-26, verify the current stable `@modelcontextprotocol/sdk` version and note it in the PR description.

**Files:** `cockpit/src/mcp/server.ts`, `cockpit/package.json` (add MCP SDK dep), `docker-compose.yml` (add MCP server startup bound to 127.0.0.1:4143)
**Acceptance:** `curl -H "x-capture-token: $TOKEN" http://127.0.0.1:4143/` returns a 200 or MCP greeting. A request without the token returns 401. Server startup appears in the Activity Log.
**Verify:** `npm run build`, `npm run lint`, manual curl test
**Size:** L
**Depends-on:** T-12 (for auth pattern reference)

---

### T-27: Read-only MCP resources

**Why:** An external agent (another Claude session, a local Codex instance) should be able to read the active project's tasks, memory, and templates to inform its work, without needing raw database access.
**Scope:** MCP resources added in `cockpit/src/mcp/resources.ts`: `projects` (list), `active-project` (resolved from request header or cookie), `memory-facts` (accepted and non-deleted facts for the active project), `templates` (all), `qa-sessions` (last 10 for the active project), `activity-summary` (last 20 ActivityLog entries). All reads apply `deletedAt: null` filters (matching existing read-path behavior from the hardening audit).
**Files:** `cockpit/src/mcp/resources.ts`
**Acceptance:** An MCP client can list projects and retrieve memory facts. Soft-deleted facts do not appear. A corpus of 200 facts returns in under 500 ms (existing `take: 200` bound applies).
**Verify:** `npm run build`, `npm run lint`, manual MCP client test
**Size:** M
**Depends-on:** T-26

---

### T-28: Proposal-only MCP tools

**Why:** External agents should be able to propose tasks and facts and run deterministic lints without silently mutating durable state.
**Scope:** MCP tools in `cockpit/src/mcp/tools.ts`: `create-task-proposal` (creates a `ProposalItem` row with `type: "task"`, source `"mcp"`, and task fields in `payload`); `create-fact-proposal` (creates a `ProposalItem` row with `type: "fact"` and fact fields in `payload`); `run-gherkin-lint` (calls `lintGherkin()`, returns issues, no DB write); `run-adr-lint` (calls `lintAdr()`); `run-openapi-lint` (calls `openapiLint()`). No tool writes a `Task` or `MemoryFact` directly; all writes route through the approval queue so a human must accept before any durable state changes. `Task.status` remains `todo | doing | done`; no new status values are added.
**Files:** `cockpit/src/mcp/tools.ts`
**Acceptance:** `create-task-proposal` creates a `ProposalItem` visible in the approval queue (`/tools/queue`). `run-gherkin-lint` returns the same issues as the cockpit Gherkin Lint route for the same input. No tool creates a `Task` or `MemoryFact` directly; every write requires human review in the queue (T-29).
**Verify:** `npm run build`, `npm run lint`, manual MCP client test
**Size:** M
**Depends-on:** T-27, T-29 (ProposalItem schema from T-29 must be migrated before these tools can write to it)

---

## M10: Approval-queue automation

Goal: automations propose work for human review. No automation mutates durable state directly.

### T-29: Approval queue schema and UI

**Why:** The morning brief, watched-folder ingest, and future routines produce proposals (tasks, facts, drafts) across different tool surfaces. A central review queue collects them in one place.
**Scope:** New Prisma model `ProposalItem { id, type String ("task"|"fact"|"draft"), payload Json, source String, status String ("pending"|"accepted"|"dismissed"), createdAt DateTime, projectId String? }`. New page `/tools/queue` lists pending proposals. Each row shows type, source, and a payload preview. Accept and Dismiss buttons call `PATCH /api/queue/[id]`. Accepting a task proposal creates a real Task from `payload`; accepting a fact proposal creates an active MemoryFact.
**Files:** `cockpit/prisma/schema.prisma`, `cockpit/src/app/tools/queue/page.tsx`, `cockpit/src/app/api/queue/route.ts`, `cockpit/src/app/api/queue/[id]/route.ts`
**Acceptance:** A proposal created via T-28 MCP tool appears in `/tools/queue`. Accepting it creates the corresponding Task or MemoryFact. Dismissing removes it from the queue (not hard-deleted; `status: "dismissed"` for audit trail). `npm run db:push` applies the migration.
**Verify:** `npm run db:push`, `npm run build`, `npm run lint`, manual live test
**Size:** L
**Depends-on:** T-26 (ProposalItem schema and queue UI can be built before T-28 MCP tools exist; T-28 depends on this task for the schema)

---

### T-30: Watched folder ingest (L3)

**Why:** A small business owner drops receipts, notes, and invoices into a local folder. An L3 routine watches that folder and proposes tasks and memory facts for each new file without modifying or deleting files.
**Scope:** Background process using Node.js `fs.watch` (or a `setInterval` poller as a cross-platform fallback). Reads files from a configurable `WATCH_FOLDER` env variable. Each new text file runs through `learnFromText()` to generate pending `ProposalItem` rows (T-29). A local JSON sidecar (`watch-state.json` in the watched folder or a DB table) tracks processed file paths to prevent re-processing. Files are never deleted or moved.

**(Assumption):** PDF text extraction requires an additional Node.js library (`pdf-parse` or `pdfjs-dist`). Confirm the library choice before writing the code; add it to `cockpit/package.json` explicitly rather than relying on a transitive dep.

**Files:** `cockpit/src/lib/watchFolder.ts`, `cockpit/src/app/api/watch/start/route.ts`, `cockpit/src/app/api/watch/stop/route.ts`
**Acceptance:** Dropping a `.txt` file into the watched folder produces at least one ProposalItem in `/tools/queue` within 30 seconds. Dropping the same file again creates no duplicate. Stopping the watcher via the stop route does not orphan the Node.js process.
**Verify:** `npm run lint`, `npm run build`, manual live test
**Size:** L
**Depends-on:** T-29

---

### T-31: Scheduled morning brief and evening wrap-up

**Why:** The standup and wrapup routes exist as one-shot endpoints. Scheduled automation would run them at a configurable time and surface the output as a ProposalItem for review rather than writing an Idea directly.
**Scope:** New `cockpit/src/lib/scheduler.ts` using `node-cron` (or equivalent). Reads `Settings.morningBriefTime` and `Settings.eveningWrapupTime` (new optional fields, migration via `npm run db:push`). No schedule runs unless the fields are set. Each scheduled fire calls the corresponding routine and creates a `ProposalItem` of type `"draft"`. The Idea is created only when the user accepts from the queue (T-29). Settings page gets two time-picker inputs for these fields.
**Files:** `cockpit/src/lib/scheduler.ts`, `cockpit/prisma/schema.prisma` (add two `Settings` fields), `cockpit/src/app/settings/page.tsx`
**Acceptance:** Setting `morningBriefTime = "08:00"` in Settings and waiting for that clock time produces a ProposalItem of type `"draft"` in `/tools/queue`. Dismissing the proposal creates no Idea. `npm run db:push` applies the migration cleanly.
**Verify:** `npm run db:push`, `npm run build`, `npm run lint`
**Size:** M
**Depends-on:** T-29

---

## M11: Desktop installer

Goal: a non-technical user installs Haven Desk without opening a terminal.

### T-32: Installer requirements spec

**Why:** Writing installer code before agreeing on targets, hardware minimums, and recovery paths risks rework.

**(Assumption):** This task produces a doc, not a code change.

**Scope:** A short `docs/haven-desk-installer-spec.md` covering: macOS target (14 or later, Apple Silicon), Windows target (10 and 11, x64 and ARM64), minimum RAM (16 GB recommended for `gemma4:e4b`, 32 GB for `gemma4:12b-mlx`), GPU notes (GPU not required for the light tier), Ollama version floor, model pull steps, and recovery copy for missing-Ollama and missing-model states. Include the llama-server probe logic from `./swiss doctor` as a reference for the Ollama app-vs-formula check.
**Files:** `docs/haven-desk-installer-spec.md`
**Acceptance:** An engineer can read the spec and know exactly what the installer must check and what to show on failure. No terminal knowledge is assumed of the end user.
**Verify:** Peer review (no automated gate for this task)
**Size:** S
**Depends-on:** none

---

### T-33: macOS installer package

**Why:** The current install path requires a terminal, Docker Desktop, Homebrew, and awareness of the Ollama app-vs-formula distinction. A macOS installer removes all of that for a non-technical user.

**(Assumption):** Target format is `.pkg` or `.dmg`. The tech choice (Electron, Tauri, or shell-script installer) is not locked in this backlog item. The engineer implementing T-33 should document the choice in the PR.

**Scope:** A macOS installer that: probes for the Ollama app using the llama-server check from `scripts/doctor.sh`; if missing, opens ollama.com/download and waits; pulls `gemma4:e4b` as the default light-tier model; starts the Docker Compose stack; opens `http://localhost:4141` in the default browser. The installer must not require Xcode or a terminal command from the user.
**Files:** `installer/macos/` (new directory), references `scripts/doctor.sh` for health check logic
**Acceptance:** A user on a clean macOS 14 Apple Silicon machine runs the installer and reaches the Haven Desk home page without opening Terminal. `./swiss doctor` reports all-green after the install completes.
**Verify:** Test on a clean macOS VM. Run `./swiss doctor` to confirm all checks pass.
**Size:** L
**Depends-on:** T-32, T-08

---

### T-34: Windows installer package

**Why:** `swiss.ps1` and `swiss.cmd` exist and were verified on real hardware (2026-06-10). The installer wraps them for a user who will not run PowerShell.

**(Assumption):** NSIS or WiX is the likely packaging tool. The choice is not locked.

**Scope:** A Windows installer that: checks Ollama for Windows is installed (`winget install Ollama.Ollama` or opens ollama.com/download/windows); pulls `gemma4:e4b`; starts the Docker Compose stack via `swiss.cmd up`; opens `http://localhost:4141` in Edge. Handles Windows port reservation conflicts (winnat) with retry copy and a link to the README troubleshooting section.
**Files:** `installer/windows/` (new directory)
**Acceptance:** A user on a clean Windows 11 machine runs the `.exe` or `.msi` and reaches Haven Desk home without opening PowerShell. `.\swiss doctor` reports all-green after install.
**Verify:** Test on a clean Windows 11 VM. Run `.\swiss doctor` to confirm all checks pass.
**Size:** L
**Depends-on:** T-32, T-08

---

## Suggested execution order

Each number is one PR. Items with no dependency on the previous can be merged in parallel with it.

1. T-01 (docs/README.md, no blockers)
2. T-02 (README.md link, depends on T-01)
3. T-03 (PluginManifest type, no blockers, parallel with T-01 and T-02)
4. T-04 (pure validator, depends on T-03)
5. T-05 (example packs, depends on T-04)
6. T-06 (nav reorg, depends on IA doc and T-03 for group type; read nav.test.ts first)
7. T-07 (dashboard ordering, depends on T-06)
8. T-08 (persona picker, depends on T-06)
9. T-09 (engine health in onboarding, depends on T-08)
10. T-10 (first guided workflow card, depends on T-08 and T-06)
11. T-11 (loadPack() loader, depends on T-04 and T-05)
12. T-12 (pack install API, depends on T-11)
13. T-17 (QA pack manifest, depends on T-04; can run in parallel with T-12)
14. T-14 (Small Business Ops manifest, depends on T-04 and T-11)
15. T-13 (migrate LBMH seeding, depends on T-11; run after T-14 to validate the pattern)
16. T-18 (release readiness template, depends on T-17 and T-04)
17. T-15 (meeting-notes template, depends on T-14 and T-12)
18. T-16 (Packs page UI, depends on T-06, T-12, and T-14)
19. T-19 (professional group visibility, depends on T-06, T-08, and T-17)
20. T-20 (Documents page, depends on T-06)
21. T-21 (doc Q&A tool, depends on T-20)
22. T-22 (deadline extractor, depends on T-20)
23. T-23 (privacy status panel, no hard blockers; can run after T-06)
24. T-24 (per-pack permissions, depends on T-16 and T-04)
25. T-25 (export and delete controls, depends on T-23)
26. T-32 (installer spec doc, no hard blockers; can run any time)
27. T-26 (MCP server scaffold, depends on T-12 for auth pattern)
28. T-27 (read-only MCP resources, depends on T-26)
29. T-29 (approval queue schema and UI; ProposalItem schema must exist before T-28 can write to it)
30. T-28 (proposal-only MCP tools, depends on T-27 and T-29)
31. T-30 (watched folder ingest, depends on T-29; confirm PDF library choice first)
32. T-31 (scheduled brief and wrap-up, depends on T-29)
33. T-33 (macOS installer, depends on T-32 and T-08; run after T-29 for a complete first-run path)
34. T-34 (Windows installer, depends on T-32 and T-08; can run in parallel with T-33)
