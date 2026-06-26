Persona-first information architecture, route mapping, first-run onboarding, and the concrete nav.tsx change plan for the Haven Desk transition of Swiss Knife.

Date: 2026-06-26

---

## Current IA vs target IA

The current sidebar groups in `cockpit/src/lib/nav.tsx` (verified 2026-06-26) are:

| Current group id | Sidebar label |
|---|---|
| (none) | Dashboard (always first, ungrouped) |
| work | Work |
| write | Write |
| qa | QA & Evals |
| dev | Dev |
| system | System |

These groups are accurate for an SDET or developer audience. They are opaque to the five Haven Desk personas (household operator, small business owner, student/learner, creative professional, personal documents/admin). The labels "QA & Evals" and "Dev" actively signal the wrong audience.

The target groups for the public Haven Desk UX, decided in the canon, are:

| Target group id | Sidebar label | What lives here |
|---|---|---|
| (none) | Dashboard / Today | The home view; always first; ungrouped |
| today | Today | Tasks, Memory: the daily operational surfaces |
| capture | Capture | Smart Inbox, Image: input-first tools |
| write | Write | Prompt Optimizer, Prompt Library, Email Writer, Brainstorming |
| documents | Documents | Placeholder in v1; native document Q&A routes will land here |
| projects | Projects | The Projects hub and switcher |
| packs | Packs | All workflow packs including the professional tools |
| settings | Settings | Settings, Activity log |

The "documents" group has zero NAV_ITEMS in v1. Open WebUI handles document RAG today and is deep-linked from the Projects page. The group id is reserved in the union so future native document routes have a valid home without another migration. Because no items carry the group, the sidebar renders no Documents section until a route is added.

The migration keeps every existing `href` unchanged and removes no pages. The only changes are the `NavGroup` union type, the `NAV_GROUPS` array, and the `group` field on each `NAV_ITEM`.

---

## Route mapping table

Every current route mapped to its target group. "Packs > Professional" means the item lands in the Packs section and is tagged as a professional tool in its desc or keyword metadata.

| Route | Current group | Target group | Notes |
|---|---|---|---|
| `/` | (none) | (none) | Dashboard; always first; no group |
| `/tools/tasks` | work | today | Core daily surface |
| `/tools/memory` | work | today | Facts injected into tools daily |
| `/tools/inbox` | work | capture | Input sorting and quick-add |
| `/tools/image` | write | capture | Primary action is providing an image as input |
| `/tools/projects` | work | projects | Hub + Open WebUI deep-link |
| `/tools/prompt-optimizer` | write | write | Prompt drafting; no change |
| `/tools/prompt-library` | write | write | Templates + saved prompts |
| `/tools/email-writer` | write | write | Compose and reply |
| `/tools/brainstorm` | write | write | Structured techniques |
| `/tools/qa-pipeline` | qa | packs | Packs > Professional |
| `/tools/gherkin-lint` | qa | packs | Packs > Professional |
| `/tools/bug-report` | qa | packs | Packs > Professional |
| `/tools/rubric-designer` | qa | packs | Packs > Professional |
| `/tools/eval-cases` | qa | packs | Packs > Professional |
| `/tools/code-review` | dev | packs | Packs > Professional |
| `/tools/adr` | dev | packs | Packs > Professional |
| `/tools/api-contract` | dev | packs | Packs > Professional |
| `/tools/activity` | system | settings | System meta; lives near Settings |
| `/settings` | system | settings | No change in placement |

---

## How QA and dev tools stay reachable

The eight professional tools (QA Pipeline, Gherkin Lint, Bug Report, Rubric Designer, Eval Cases, Code Review, ADR Writer, API Contract) move to the `packs` nav group. Their hrefs do not change. Three access paths remain:

1. The Packs section in the sidebar renders all eight items as it does today (they have desc values, so they appear as dashboard cards too).
2. The command palette (derives from `NAV_ITEMS` directly) surfaces all eight by label and keyword. A user who types "gherkin" or "bug" or "openapi" reaches the tool in two keystrokes.
3. Direct URL navigation works unchanged because no routes are removed.

A future iteration can filter Packs sidebar items by installed pack slug, showing only tools the user has activated. That is a separate decision and a separate commit. V1 shows all packs items unconditionally.

The canon is explicit: do not remove the QA/dev tools. This doc does not recommend hiding them at the route level. Grouping them under Packs is the visibility change.

---

## First-run onboarding flow

The existing first-run card (shown when the DB is empty, per CLAUDE.md) is the current state. The target onboarding is a structured seven-step flow. Steps 1, 2, 4, and 5 are not yet built; they are design intent for the next implementation sprint. Steps 3, 6, and 7 rely on existing primitives.

**Step 1: Persona pick** (not yet built)
Five cards, one per persona. Labels match the canon names: Household operator, Small business owner, Student or learner, Creative professional, Personal documents and admin. Picking a persona sets a local preference (Settings model or a new `Settings.persona` field) that guides step 4.

**Step 2: Model tier or default** (not yet built; HealthBanner is built)
After persona pick, surface the current engine status. If Ollama is up and `gemma4:e4b` is available, proceed. If the model is not pulled, show the exact pull command (see "Empty states and health" below). If Ollama is not running, show the launch instruction. This step re-uses the existing `assertOllamaReady()` health check from `src/lib/health.ts`.

**Step 3: First project** (create flow exists)
Prompt the user to name a project or skip. Skipping sets the app to global mode. The "No project (global)" label in the switcher already explains this state. A project name is not required to proceed.

**Step 4: Add one input** (not yet built)
Show a single guided prompt based on the chosen persona. Examples by persona:
- Household operator: "Drop a family note or school message in the Inbox."
- Small business owner: "Paste meeting notes or a draft email."
- Student or learner: "Paste a syllabus section or a study question."
- Creative professional: "Describe a campaign or content idea."
- Personal documents and admin: "Paste a document excerpt or deadline reminder."

The input goes to the Smart Inbox (`/tools/inbox`) or a dedicated persona entry point. No routing changes are needed in v1; the Inbox handles all text input already.

**Step 5: Run one guided workflow** (not yet built as guided; tools exist)
Route the persona's input through one relevant tool and run it with one click. Persona-to-tool mapping:
- Household operator: Email Writer (school message draft).
- Small business owner: Email Writer or Brainstorming (meeting to follow-ups).
- Student or learner: Brainstorming (study plan technique).
- Creative professional: Prompt Optimizer or Brainstorming (campaign brief).
- Personal documents and admin: Smart Inbox (extract tasks and deadlines).

The model runs and streams a draft. The user reads it before anything is stored.

**Step 6: Review and save** (save-after-review pattern exists)
The draft is shown in the tool's output area. The user clicks Save. The app stores the exact reviewed output verbatim. No hidden re-run occurs. This is the existing save-after-review pattern in `POST /api/prompts` and `POST /api/ideas`.

**Step 7: Activity logged** (ActivityLog exists)
A record is written to `ActivityLog` noting the onboarding workflow type and timestamp. The Today panel (DailyBrief) and `/tools/activity` reflect this entry immediately.

---

## Empty states and plain-language health

Every surface without data should tell the user the next concrete local action, not just "Nothing here yet."

**Ollama not running**
Current HealthBanner text is acceptable. The target copy for non-technical users:
> "Your AI engine is not running. Open the Ollama app on your computer to start it. If you just installed it, look in your Applications folder."
Avoid mentioning Docker or CLI commands on the first line. A "Show advanced" toggle can surface `ollama serve` for technical users.

**Model not pulled**
> "The `gemma4:e4b` model is not downloaded yet. Open a terminal and run: `ollama pull gemma4:e4b`"
Show the estimated download size (around 4 GB for e4b) if available from the Ollama models API.

**Empty tasks**
> "No tasks yet. Type one above or use ⌘K to quick-add from anywhere."

**Empty memory**
> "No facts saved. Paste a note into Brainstorming or the Inbox and accept the suggestions that appear."

**Empty projects**
> "Working globally, nothing is scoped to a project. Create a project to group tasks, memory, and documents together."

**QA Pipeline with no pack**
The existing `needsPack: true` empty state already prompts to run `npm run seed:lbmh`. For Haven Desk this copy changes to:
> "This tool is part of the QA and Product Ops pack. Install it to get started."
The underlying mechanism (`needsPack: true`) stays; only the copy changes.

**Documents group (v1)**
If a user lands on a future `/documents` route before it is built, show:
> "Document workflows coming soon. For now, open your project and click 'Open in Knowledge Base' to use local AI with your documents in Open WebUI."

---

## nav.tsx change plan

This section describes the exact changes to `cockpit/src/lib/nav.tsx`. This change is a separate, test-gated commit from the docs commit. The docs commit writes only to `docs/`. The nav commit touches `cockpit/src/lib/nav.tsx` and must pass `npm run lint`, `npm run test:unit`, and `npm run test:e2e` before merging.

### New NavGroup union

Replace:
```typescript
export type NavGroup = "work" | "write" | "qa" | "dev" | "system";
```

With:
```typescript
export type NavGroup = "today" | "capture" | "write" | "documents" | "projects" | "packs" | "settings";
```

### New NAV_GROUPS array

Replace the five-entry array with:
```typescript
export const NAV_GROUPS: { id: NavGroup; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "capture", label: "Capture" },
  { id: "write", label: "Write" },
  { id: "documents", label: "Documents" },
  { id: "projects", label: "Projects" },
  { id: "packs", label: "Packs" },
  { id: "settings", label: "Settings" },
];
```

The sidebar renders a section header only when at least one NAV_ITEM carries that group id. Documents renders no header in v1 because no items map to it.

### Group reassignment for every NAV_ITEM

Apply the following group values. Hrefs, labels, icons, descs, and keywords are unchanged.

| href | old group | new group |
|---|---|---|
| `/` | (none) | (none) |
| `/tools/tasks` | work | today |
| `/tools/memory` | work | today |
| `/tools/inbox` | work | capture |
| `/tools/image` | write | capture |
| `/tools/projects` | work | projects |
| `/tools/prompt-optimizer` | write | write |
| `/tools/prompt-library` | write | write |
| `/tools/email-writer` | write | write |
| `/tools/brainstorm` | write | write |
| `/tools/qa-pipeline` | qa | packs |
| `/tools/gherkin-lint` | qa | packs |
| `/tools/bug-report` | qa | packs |
| `/tools/rubric-designer` | qa | packs |
| `/tools/eval-cases` | qa | packs |
| `/tools/code-review` | dev | packs |
| `/tools/adr` | dev | packs |
| `/tools/api-contract` | dev | packs |
| `/tools/activity` | system | settings |
| `/settings` | system | settings |

### Non-breaking migration

No page files move. No hrefs change. The `nav.test.ts` drift tripwire checks four things:
1. Every tool page file is registered in NAV_ITEMS (hrefs unchanged, still true).
2. Every registered href resolves to a page file (hrefs unchanged, still true).
3. Every non-Dashboard item has a `group` that is a valid member of the `NavGroup` union (remapped above, all valid).
4. hrefs are unique (no duplicates introduced).

After the nav commit, run the full suite to confirm. Do not merge without all three test commands green.

---

## Acceptance checks

These checks confirm the IA transition is complete and correct.

- [ ] `nav.test.ts` passes with zero failures after the nav commit.
- [ ] `npm run lint` reports no errors after the nav commit.
- [ ] `npm run test:unit` passes (290+ unit tests green; the nav migration adds no regression surface).
- [ ] `npm run test:e2e` passes (81+ e2e tests green; hrefs unchanged so Playwright selectors work without update).
- [ ] The sidebar renders six section headers: Today, Capture, Write, Projects, Packs, Settings (Documents is absent in v1 because no items carry it).
- [ ] The command palette (`⌘K`) returns results for "gherkin", "bug", "openapi", "adr", and "code" pointing to the correct hrefs.
- [ ] Navigating directly to `/tools/qa-pipeline` works without redirect.
- [ ] The Dashboard cards grid shows the same set of tools as before (FEATURED_TOOLS derives from items with a `desc`, which has not changed).
- [ ] A fresh DB shows the first-run card (existing behavior; onboarding redesign is a later sprint).
- [ ] The HealthBanner renders when Ollama is down and shows a concrete next action.

---

## Related docs

- `haven-desk-strategy-report.md`: full persona definitions and positioning rationale.
- `haven-desk-a-to-z-roadmap.md`: the implementation sequence and stage definitions.
- `haven-desk-plugin-pack-spec.md`: the PluginManifest contract that backs the Packs group.
- `haven-desk-engineering-roadmap.md`: where the first-run onboarding sprint fits in the build sequence.
- `haven-desk-implementation-backlog.md`: the specific issues for persona pick, guided workflow, and first-run copy changes.
