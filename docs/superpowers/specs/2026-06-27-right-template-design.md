# Right template at the right moment

Date: 2026-06-27

## Goal

The valuable pre-built templates (proposal writer, SOP builder, receipt organizer) and a user's own templates are buried in the Prompt Library's flat list, hard to find at the moment you want one. Give them a dedicated, **organized** browse — grouped so the right template is easy to scan and run in one click — and make them findable from ⌘K (they're absent from search today).

## Decisions reached (brainstorm + Codex design memo)

- **A dedicated Templates page** (`/tools/templates`) is the primary surface — the grouped browse. Prompt Library keeps *managing* templates (create/edit/delete) + saved prompts; the new page is *browse-and-run*.
- **Group by category, with a source fallback.** Categorize the pack templates (they ship with none), and bucket any still-uncategorized template by source ("Built-in" / "Your templates").
- **One-click run anywhere** via the existing `TemplateRunner`, wrapped in a shared `TemplateRunDialog`; a `?run=<id>` deep-link auto-opens it.
- **Templates join ⌘K / global search** (the cheapest fix for "not findable"), one-click runnable via the same deep-link.
- A strict `kind:"prompt"` + `archived:false` filter, shared in one place, so Brainstorm techniques never leak in.
- **Deferred (YAGNI):** usage-based ranking (a `useCount` fast-follow), per-tool context, project-scoped relevance.

## Design

### Categorize the pack templates

The SBO pack templates in `lib/packs/examples.ts` set no `category`. Add one to each so they group meaningfully (the manifest template type + `buildInstallPlan` already carry `category` through to the row):

- `sbo-proposal-writer` → `proposal`
- `sbo-sop-builder` → `operations`
- `sbo-receipt-organizer` → `finance`
- `sbo-follow-up-email` → `email`
- `sbo-meeting-notes-to-tasks` → `planning`
- `sbo-weekly-review` → `planning`

Re-installing the pack upserts by slug and applies the category (the install update branch carries it). Existing global builtins already have categories (summarize, rewrite, explain). The validator's expectations are unchanged (category is an optional field).

### The shared filter

A single `lib/templateGroups.ts` exports the canonical prompt-template filter so search, the page fetch, and any future surface can't drift into showing techniques:

```ts
export const PROMPT_TEMPLATE_WHERE = { kind: "prompt", archived: false } as const;
```

### Grouping (pure, tested)

`lib/templateGroups.ts` also exports `groupTemplates`:

```ts
export type GroupableTemplate = { category: string | null; builtin: boolean; favorite: boolean; name: string };
export type TemplateGroup<T> = { label: string; templates: T[] };
export function groupTemplates<T extends GroupableTemplate>(templates: T[]): TemplateGroup<T>[];
```

- Bucket each template by its `category` (trimmed, title-cased as the label) if non-empty; else by **source** — `builtin ? "Built-in" : "Your templates"`.
- Within a group: favorites first, then by `name` (locale compare).
- Group order: real-category groups alphabetically, then the two source-fallback groups last (`Built-in`, then `Your templates`), so the curated categories lead and the catch-alls trail.
- Pure and unit-tested (the only place grouping/ordering logic lives).

### The Templates page

- `app/tools/templates/page.tsx` (server, `runtime=nodejs`, `dynamic=force-dynamic`): fetch `prisma.template.findMany({ where: PROMPT_TEMPLATE_WHERE, select: { id, name, description, category, builtin, favorite, variables } })`. Read `searchParams.run`. Render a client `TemplatesBrowser` with the templates + `initialRunId`.
- `components/library/TemplatesBrowser.tsx` (client):
  - A search box filtering by name/description/category (client-side, like the Quick Actions gallery search).
  - `groupTemplates(filtered)` → sections; each section a header + a card grid. Card = name + description + an optional category badge + a **"Use"** button (run-only; no edit/delete on this surface — that stays in Prompt Library).
  - "Use" opens the shared `TemplateRunDialog` for that template.
  - On mount / when `initialRunId` changes, find it in the already-fetched list and open the dialog once (no extra fetch); this powers `?run=` from ⌘K. Clear the handling after opening so a list filter can't re-trigger it.
  - Empty state (zero prompt templates): a nudge card linking to `/tools/packs` ("No templates yet — install a pack"), not an empty grid.
- Nav: add a `Templates` entry under the `write` group in `lib/nav.tsx` (icon `LayoutTemplate`), with a `desc` so it cards on the dashboard and a `keywords` of "template proposal sop". `nav.test` stays green (the page exists).

### Shared `TemplateRunDialog`

`components/library/TemplateRunDialog.tsx`: `Dialog` + `DialogHeader` (name/description) + `TemplateRunner`, props `{ template: { id; name; description?: string | null; variables: string } | null; open; onOpenChange; savedLabel? }`. Lift it out of `PromptLibrary.tsx` (its `useTemplate` dialog, lines ~423-435); Prompt Library imports it (net smaller). The new page mounts the same component.

### ⌘K / global search

In `app/api/search/route.ts`: add `"Template"` to the result union and a `prisma.template.findMany({ where: { ...PROMPT_TEMPLATE_WHERE, OR: [name/description contains q] }, take, select: { id, name, description } })`. Map to `{ type: "Template", title: name, subtitle: description, href: '/tools/templates?run=' + id }` so a result is one-click runnable. No Template↔Prompt dedup needed (distinct models, distinct intent); the result badge distinguishes them.

## Out of scope (YAGNI)

- Usage tracking / behavior ranking (`useCount`/`lastUsedAt`) — a clean fast-follow (the run route is the single choke point), not v1.
- Per-tool contextual surfacing; project-scoped relevance (install is global v1).
- A dashboard Templates hero — the dedicated page is the chosen surface.
- Removing template management from Prompt Library (it stays the manage/CRUD home).

## Testing

- **Unit (pure):** `groupTemplates` (category bucketing, source fallback for null category, favorites-first within a group, group ordering with categories before the fallbacks); the `PROMPT_TEMPLATE_WHERE` constant shape.
- **Route-mocked e2e:** the Templates page renders grouped sections from a mocked list; "Use" opens the run dialog; search filters; `?run=<id>` auto-opens the dialog; the empty state links to Packs. A ⌘K search result for a template links to `/tools/templates?run=`.
- **Live verify** on `gemma4:e4b`: install the SBO pack → its templates appear under their categories (proposal/operations/finance/…); run "Proposal writer" from the page (fill vars → result → save); find it via ⌘K and one-click run; Prompt Library still runs templates (uses the shared dialog).
- `nav.test` green (new Templates entry ↔ real page).

## Implementation checklist

1. `lib/packs/examples.ts`: set `category` on the six SBO templates; confirm the validator + install tests pass.
2. `lib/templateGroups.ts`: `PROMPT_TEMPLATE_WHERE` + pure `groupTemplates` + unit tests.
3. `components/library/TemplateRunDialog.tsx`: extract from PromptLibrary; rewire PromptLibrary to consume it.
4. `app/tools/templates/page.tsx` + `components/library/TemplatesBrowser.tsx`: server fetch + grouped client browse + search + run dialog + `?run=` consumer + empty→Packs; add the nav entry.
5. `app/api/search/route.ts`: add Template (shared filter, `?run=` href).
6. e2e + live verify + Codex review + CLAUDE.md note. Gate each step (`env -u NODE_ENV`: lint, unit, e2e, build).

## Risks and mitigations

1. **Technique-template leakage** (top correctness risk) → the shared `PROMPT_TEMPLATE_WHERE` used by every prompt surface (page + search); never query templates without it.
2. **Deep-link / dialog state** (`?run=` + search filter + Radix reset — an area this repo has been bitten by, e.g. React #418, deep links masked by filters) → consume `run` from the already-fetched list (no new fetch), open once on mount/prop-change, clear after opening so a filter can't re-trigger.
3. **Weak grouping if a category is missed** → categorize all six pack templates now; the source fallback ("Built-in"/"Your templates") guarantees nothing lands in a void; user-created templates without a category still group sensibly.
