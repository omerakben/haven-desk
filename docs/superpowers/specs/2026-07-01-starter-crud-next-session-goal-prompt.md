# Goal prompt — CRUD everything (starters / examples / placeholders) — next session

Paste the "GOAL PROMPT" block below into the next session to continue the
personalization sweep. Context and status are underneath it so you (or Claude)
can pick up without re-deriving anything.

> **Paths in this doc are written from the repo root, so the app lives under
> `cockpit/`** (e.g. `cockpit/src/lib/quickActions.ts`). Run all dev/gate
> commands (`npm …`, `npx …`, `prisma …`, `env -u NODE_ENV …`) from inside
> `cockpit/` — that's where `package.json` and the Prisma schema live.

---

## GOAL PROMPT (paste this)

> **Make every "starter"/example/placeholder in Haven Desk user-CRUD-able — this is a personalization tool, so nothing a user sees should be a hardcoded string they can't change.**
>
> Already done (do NOT redo): Quick Actions, Smart Inbox, Image, Email Writer, Meeting Notes, **Refine, Help Wizard, and Projects** are all on the editable `Starter` system (`StarterChips`: tap-to-fill, ✎ edit, ✕ delete, Save current, Reset to defaults). Prompt **templates** everywhere already have full CRUD via the `Template` model.
>
> **Do this, one small gated commit each, builder/verifier review before merge:**
>
> 1. **Audit for any remaining hardcoded example/starter chip** I missed. Grep for inline example arrays and "Try one / Not sure where / Start with" copy not going through `StarterChips`. Convert each to the `Starter` system exactly like Email Writer (`cockpit/src/components/email/EmailWriter.tsx` is the canonical usage): add a `*_TARGET` to `TEXT_STARTER_TARGETS` in `cockpit/src/lib/quickActions.ts`, add built-ins to `BUILTIN_STARTERS` that reproduce today's defaults, render `<StarterChips target=… fallback={builtinStartersFor(target)} current={{[INBOX_FIELD]: state}} onPick={…} editFields={[{name: INBOX_FIELD, …}]} headline=…/>`. No route/schema work needed — `/api/starters` GET lazy-seeds any new target, and reset/export/import are generic. Extend `cockpit/src/lib/starters.test.ts`'s single-text invariant to the new targets.
>
> 2. **Editable tool placeholders (the grey `e.g. …` hint text).** This is the bigger, deferred piece — decide the design WITH me first (`superpowers:brainstorming`), because it needs a new persisted "per-tool default text" concept the app doesn't have yet. Options to weigh: (a) a `ToolPref`/`Setting` row per tool storing a custom placeholder + optional default input, editable from an inline "✎ edit this hint" affordance or from Settings; (b) reuse the `Starter` system with a "default/pinned" flag that also seeds the input on load; (c) skip it (my recommendation last session — low value, high friction). Pick one, spec it, then build behind a gate.
>
> 3. **Verify** every change from inside `cockpit/`: `env -u NODE_ENV` with lint + unit + e2e + build (set `NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt` if Prisma/network needs it), **and** live in Chrome on real Gemma at :4141. Route-mock `/api/starters` in any e2e that asserts a chip by label (hermeticity — see `cockpit/e2e/wizard.spec.ts` for the pattern).
>
> Keep it Simple, Easy, less friction — one click does something valuable. Ship each piece; update the roadmap in `CLAUDE.md` when it lands.

---

## Status at end of 2026-07-01 session (what's already CRUD-able)

**On the `Starter` system (`StarterChips`) — full CRUD:**
- Quick Actions (per-action) · Smart Inbox · Image · Email Writer · Meeting Notes
- **Refine · Help Wizard · Projects** ← added this session (PR #15, merged to `main`)

**Templates (`Template` model) — full CRUD:** Prompt Library (create/edit/delete/favorite), Templates page, pack templates, Brainstorm techniques.

## The remaining gap = placeholders only

The only user-visible hardcoded strings left are the grey `placeholder="e.g. …"`
hint texts inside input boxes (NOT tap-to-fill starters). Known spots
(paths from the repo root):

- `cockpit/src/components/tasks/TaskAiTools.tsx:75` — "e.g. Prepare and ship the Q3 launch announcement"
- `cockpit/src/components/library/PromptLibrary.tsx:588` — "e.g. Summarize {{text}} into {{count}} bullet points."
- `cockpit/src/components/qa/QaSessionView.tsx:226`
- `cockpit/src/components/eval/EvalCaseGenerator.tsx:147`
- `cockpit/src/components/tools/BugReportTool.tsx:110`
- `cockpit/src/components/rubric/RubricDesigner.tsx:133`
- `cockpit/src/components/api-contract/ApiContractDesigner.tsx:71`
- `cockpit/src/components/email/EmailWriter.tsx:181` (brief box — note the chips above it are already CRUD)
- `cockpit/src/components/SettingsForm.tsx` (model-tag hints — probably leave; these are config guidance, not examples)

These are hints, not examples — making each an editable DB row is the item #2
decision above. My last-session recommendation: **skip**, unless you want a
per-tool "default text" feature (then do item #2 properly, design-first).

## The pattern to copy (canonical files, from the repo root)

- Component API + manage UI: `cockpit/src/components/StarterChips.tsx`
- Canonical single-text usage: `cockpit/src/components/email/EmailWriter.tsx` (~line 158)
- Targets + built-ins + `builtinStartersFor`: `cockpit/src/lib/quickActions.ts`
- Validation gate + seed plan: `cockpit/src/lib/starters.ts` (+ tests `cockpit/src/lib/starters.test.ts`)
- Lazy per-target seed / CRUD API: `cockpit/src/app/api/starters/route.ts`, `.../reset/route.ts`
- e2e hermeticity (mock `/api/starters`): `cockpit/e2e/wizard.spec.ts`, `cockpit/e2e/image-starters.spec.ts`

## Dev-env gotchas from this session (save time next time)

Run these from inside `cockpit/`:

- `npm install` postinstall + `prisma generate` hit the proxy with ECONNRESET.
  Fix: `npm install --ignore-scripts`, then place Prisma engines by hand
  (`curl` from `binaries.prisma.sh` works; Prisma's own downloader doesn't),
  then `npm rebuild better-sqlite3` (needed for runtime/seed), then
  `prisma db push` and `npm run db:seed`.
- Build/gates: prefix with `env -u NODE_ENV` (a shell `NODE_ENV=development`
  poisons `next build`) and `NODE_EXTRA_CA_CERTS=/root/.ccr/ca-bundle.crt`.
- Playwright browser mismatch: symlink the pinned build path to the pre-installed
  chromium under `/opt/pw-browsers` (no `playwright install`).
