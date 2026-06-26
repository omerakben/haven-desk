# User-CRUD-able starters Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. (Ultracode is on; this plan is executed via a Workflow that dispatches one subagent per task with a Codex review gate.)

**Goal:** Make Quick Action "starters" (the "School bake sale"-style form pre-fills) and Smart Inbox capture chips user-editable — ship standard ones people can edit/duplicate/delete, plus save-the-form-you-filled, with a Reset to defaults.

**Architecture:** A new `Starter` Prisma model with a `target` discriminator (a Quick Action id, or `"inbox"`). Built-ins stay in code (`BUILTIN_STARTERS`) as the synchronous source for the home demo + tests; the runner and Inbox fetch a live DB list and fall back to the code built-ins. Standards are seeded lazily and create-only, so a re-seed never overwrites an edit; Reset to defaults is the only path that restores shipped content.

**Tech Stack:** Next.js 16 (App Router, route handlers), TypeScript strict, Prisma 7 + SQLite (better-sqlite3 adapter), Vitest, Playwright, Tailwind + shadcn, sonner toasts.

## Global Constraints

- Build with `env -u NODE_ENV npm run build` (a shell `NODE_ENV` poisons `next build`). Gates from `cockpit/`: `npm run lint`, `npm run test:unit`, `npm run test:e2e`, `npm run build`.
- Local-only, single-user. No cloud calls. No secrets/DB/uploads committed.
- After pulling: `npm run db:push` (the new `Starter` model). No `db:seed` step needed — standards seed lazily on first read.
- Ollama access via `src/lib/ollama.ts`; DB via the singleton `import { prisma } from "@/lib/db"`. Route handlers: `export const runtime = "nodejs"; export const dynamic = "force-dynamic";`.
- Theme tokens, not raw `neutral-*`. shadcn new-york. Writing rules apply to all copy.
- Per-feature gated commit: stop dev → `rm -rf .next` → build → lint → unit → e2e → one commit.

---

### Task 1: `Starter` schema

**Files:**
- Modify: `cockpit/prisma/schema.prisma` (append a model)

**Interfaces:**
- Produces: a `Starter` table with `{ id, target, label, inputs(String JSON), builtin(Boolean), order(Float), sourceKey(String? @unique), createdAt, updatedAt }` and `@@index([target])`.

- [ ] **Step 1: Add the model** — append to `cockpit/prisma/schema.prisma`:

```prisma
model Starter {
  id        String   @id @default(cuid())
  target    String   // a QuickAction id (e.g. "reply-to-message") or "inbox"
  label     String
  inputs    String   @default("{}") // JSON: field name -> value; inbox uses { "text": "…" }
  builtin   Boolean  @default(false)
  order     Float    @default(0)
  sourceKey String?  @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([target])
}
```

- [ ] **Step 2: Push the schema**

Run: `cd cockpit && env -u NODE_ENV npm run db:push`
Expected: "Your database is now in sync with your Prisma schema." and the client regenerates.

- [ ] **Step 3: Commit**

```bash
git add cockpit/prisma/schema.prisma
git commit -m "feat(starters): add the Starter model"
```

---

### Task 2: `BUILTIN_STARTERS` in code + the focused seed content

Convert the hardcoded `EXAMPLES` map into a flat, keyed `BUILTIN_STARTERS` array (the seed source) while keeping the existing synchronous consumers (`getFeaturedDemo`, the `a.examples = …` attach, the two unit tests) working unchanged. Add the new focused standard content and the Inbox starters.

**Files:**
- Modify: `cockpit/src/lib/quickActions.ts` (replace the `EXAMPLES` block + the attach loop; add types/constants)
- Test: `cockpit/src/lib/quickActions.test.ts` (existing tests must stay green)

**Interfaces:**
- Produces:
  - `export type BuiltinStarter = { target: string; key: string; label: string; inputs: Record<string, string> }`
  - `export const BUILTIN_STARTERS: BuiltinStarter[]`
  - `export const INBOX_TARGET = "inbox"` and `export const INBOX_FIELD = "text"`
  - unchanged exports: `QuickActionExample`, `getFeaturedDemo`, `FEATURED_DEMO`, and `a.examples` still populated for action targets.

- [ ] **Step 1: Run the existing tests first (baseline green)**

Run: `cd cockpit && env -u NODE_ENV npx vitest run src/lib/quickActions.test.ts`
Expected: PASS (the `every action has at least one example` and `the featured demo resolves` tests pass today).

- [ ] **Step 2: Add the types/constants and `BUILTIN_STARTERS`** — in `quickActions.ts`, near the existing `QuickActionExample` type, add:

```ts
export const INBOX_TARGET = "inbox";
export const INBOX_FIELD = "text";

export type BuiltinStarter = { target: string; key: string; label: string; inputs: Record<string, string> };
```

Replace the existing `const EXAMPLES: Record<string, QuickActionExample[]> = { … }` block with `export const BUILTIN_STARTERS: BuiltinStarter[]`. Migrate every current example to a flat entry with a stable `key` of the form `"<target>:<slug>"`, e.g.:

```ts
export const BUILTIN_STARTERS: BuiltinStarter[] = [
  // reply-to-message (2–3 standards on this high-value action)
  { target: "reply-to-message", key: "reply-to-message:bake-sale", label: "School bake sale",
    inputs: { message: "Hi! We'd love to have you join the school bake sale committee. Our first meeting is this Wednesday at 6pm in the library. Can you make it?", intent: "happy to help but I can't do Wednesdays, ask if there's another day" } },
  { target: "reply-to-message", key: "reply-to-message:reschedule", label: "Reschedule a call",
    inputs: { message: "Are we still on for our call tomorrow at 2pm?", intent: "yes, but I need to push it to 3pm — apologize for the short notice" } },
  { target: "reply-to-message", key: "reply-to-message:decline-politely", label: "Politely decline",
    inputs: { message: "Would you be able to volunteer at the fundraiser this weekend?", intent: "I can't this time but I'd love to help with the next one" } },
  // notes-to-list, plan-week, summarize, polite-message, meal-plan get 2–3 each;
  // every other action keeps its single existing example (migrated verbatim, with a key).
  // Inbox starters (target: "inbox", inputs: { text }):
  { target: INBOX_TARGET, key: "inbox:meeting-note", label: "A meeting note",
    inputs: { [INBOX_FIELD]: "Sync with Dana: agreed to ship the proposal Friday, she'll send the budget, I follow up with the printer about the proofs." } },
  { target: INBOX_TARGET, key: "inbox:todo-list", label: "A list of to-dos",
    inputs: { [INBOX_FIELD]: "call the printer, send the quote to Sam, book the venue for the 12th, order business cards" } },
  { target: INBOX_TARGET, key: "inbox:remember-fact", label: "A fact to remember",
    inputs: { [INBOX_FIELD]: "Our tax-exempt number is 12-3456789; the accountant is Priya at Maple & Co." } },
];
```

(Author 2–3 standards for `reply-to-message`, `notes-to-list`, `plan-week`, `summarize`, `polite-message`, `meal-plan`; migrate the rest one-to-one. Every action's required inputs must be filled — see Task 3's validation, which the unit test enforces.)

- [ ] **Step 3: Derive the by-action map and keep the attach + featured demo working** — replace the existing `for (const a of QUICK_ACTIONS) a.examples = EXAMPLES[a.id] ?? []` with a derived map:

```ts
// Group the action-targeted built-ins back into the per-action example shape the
// runner, the attach, and getFeaturedDemo already use (inbox starters excluded).
const EXAMPLES_BY_ACTION: Record<string, QuickActionExample[]> = {};
for (const s of BUILTIN_STARTERS) {
  if (s.target === INBOX_TARGET) continue;
  (EXAMPLES_BY_ACTION[s.target] ??= []).push({ label: s.label, inputs: s.inputs });
}
for (const a of QUICK_ACTIONS) a.examples = EXAMPLES_BY_ACTION[a.id] ?? [];
```

- [ ] **Step 4: Run the tests to verify they still pass**

Run: `cd cockpit && env -u NODE_ENV npx vitest run src/lib/quickActions.test.ts`
Expected: PASS (every action still has ≥1 example; the featured demo still resolves).

- [ ] **Step 5: Commit**

```bash
git add cockpit/src/lib/quickActions.ts
git commit -m "feat(starters): BUILTIN_STARTERS in code (flat, keyed) + focused seed content"
```

---

### Task 3: `lib/starters.ts` — pure seed plan + validation (TDD)

**Files:**
- Create: `cockpit/src/lib/starters.ts`
- Test: `cockpit/src/lib/starters.test.ts`

**Interfaces:**
- Consumes: `BuiltinStarter`, `BUILTIN_STARTERS`, `INBOX_TARGET`, `INBOX_FIELD`, `getQuickAction`, `missingInputs` from `./quickActions`.
- Produces:
  - `export type StarterSeedRow = { sourceKey: string; target: string; label: string; inputs: string; builtin: true; order: number }`
  - `export function buildStarterSeedPlan(builtins: BuiltinStarter[]): StarterSeedRow[]`
  - `export function parseInputs(raw: string): Record<string, string> | null` (null = not a flat string→string object)
  - `export type StarterValidation = { ok: boolean; error?: string }`
  - `export function validateStarter(target: string, label: string, inputs: Record<string, string>): StarterValidation`
  - `export const MAX_LABEL = 100`, `export const MAX_INPUTS_BYTES = 8192`

- [ ] **Step 1: Write the failing tests** — `cockpit/src/lib/starters.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { BUILTIN_STARTERS, INBOX_TARGET, INBOX_FIELD } from "./quickActions";
import { buildStarterSeedPlan, parseInputs, validateStarter } from "./starters";

describe("starters", () => {
  it("buildStarterSeedPlan produces one row per builtin with unique keys, JSON inputs, ascending order", () => {
    const plan = buildStarterSeedPlan(BUILTIN_STARTERS);
    expect(plan).toHaveLength(BUILTIN_STARTERS.length);
    const keys = new Set(plan.map((r) => r.sourceKey));
    expect(keys.size).toBe(plan.length); // all unique
    expect(plan.every((r) => r.builtin === true)).toBe(true);
    expect(plan.every((r) => typeof r.inputs === "string" && JSON.parse(r.inputs))).toBeTruthy();
    expect(plan.map((r) => r.order)).toEqual([...plan.map((_, i) => i)]); // 0..n-1
  });

  it("parseInputs accepts a flat string map and rejects anything else", () => {
    expect(parseInputs('{"a":"b"}')).toEqual({ a: "b" });
    expect(parseInputs("not json")).toBeNull();
    expect(parseInputs("[1,2]")).toBeNull();
    expect(parseInputs('{"a":1}')).toBeNull(); // non-string value
  });

  it("validateStarter requires a known target", () => {
    expect(validateStarter("no-such-action", "X", { a: "b" }).ok).toBe(false);
  });

  it("validateStarter requires an action starter to fill the action's required inputs", () => {
    // reply-to-message requires `message` and `intent`.
    expect(validateStarter("reply-to-message", "X", { message: "hi" }).ok).toBe(false);
    expect(validateStarter("reply-to-message", "X", { message: "hi", intent: "yes" }).ok).toBe(true);
  });

  it("validateStarter requires non-empty text for an inbox starter", () => {
    expect(validateStarter(INBOX_TARGET, "X", { [INBOX_FIELD]: "" }).ok).toBe(false);
    expect(validateStarter(INBOX_TARGET, "X", { [INBOX_FIELD]: "a note" }).ok).toBe(true);
  });

  it("validateStarter caps label length and inputs size", () => {
    expect(validateStarter(INBOX_TARGET, "x".repeat(101), { [INBOX_FIELD]: "a" }).ok).toBe(false);
    const big = "x".repeat(9000);
    expect(validateStarter(INBOX_TARGET, "X", { [INBOX_FIELD]: big }).ok).toBe(false);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd cockpit && env -u NODE_ENV npx vitest run src/lib/starters.test.ts`
Expected: FAIL ("Cannot find module './starters'").

- [ ] **Step 3: Implement `lib/starters.ts`**:

```ts
import { BuiltinStarter, getQuickAction, missingInputs, INBOX_TARGET, INBOX_FIELD } from "./quickActions";

export const MAX_LABEL = 100;
export const MAX_INPUTS_BYTES = 8192;

export type StarterSeedRow = {
  sourceKey: string;
  target: string;
  label: string;
  inputs: string;
  builtin: true;
  order: number;
};

/** Deterministic create-only seed rows for the shipped standards. Pure. */
export function buildStarterSeedPlan(builtins: BuiltinStarter[]): StarterSeedRow[] {
  return builtins.map((b, i) => ({
    sourceKey: b.key,
    target: b.target,
    label: b.label,
    inputs: JSON.stringify(b.inputs),
    builtin: true,
    order: i,
  }));
}

/** Parse a stored inputs JSON string into a flat string map, or null if malformed. */
export function parseInputs(raw: string): Record<string, string> | null {
  let v: unknown;
  try {
    v = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!v || typeof v !== "object" || Array.isArray(v)) return null;
  const out: Record<string, string> = {};
  for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
    if (typeof val !== "string") return null;
    out[k] = val;
  }
  return out;
}

export type StarterValidation = { ok: boolean; error?: string };

/** Gate a starter write: known target, label/size caps, and a runnable payload. */
export function validateStarter(target: string, label: string, inputs: Record<string, string>): StarterValidation {
  if (!label || !label.trim()) return { ok: false, error: "A starter needs a label." };
  if (label.length > MAX_LABEL) return { ok: false, error: "That label is too long." };
  if (JSON.stringify(inputs).length > MAX_INPUTS_BYTES) return { ok: false, error: "That starter is too long." };

  if (target === INBOX_TARGET) {
    const text = inputs[INBOX_FIELD];
    if (typeof text !== "string" || !text.trim()) return { ok: false, error: "An Inbox starter needs some text." };
    return { ok: true };
  }

  const action = getQuickAction(target);
  if (!action) return { ok: false, error: "Unknown action." };
  const missing = missingInputs(action, inputs);
  if (missing.length > 0) return { ok: false, error: `This starter doesn't fill: ${missing.join(", ")}.` };
  return { ok: true };
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `cd cockpit && env -u NODE_ENV npx vitest run src/lib/starters.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add cockpit/src/lib/starters.ts cockpit/src/lib/starters.test.ts
git commit -m "feat(starters): pure seed plan + write validation (tested)"
```

---

### Task 4: API routes — list/create, edit/delete, reset

`ensureBuiltinStarters` seeds the standards lazily (create-only) the first time the table is read while empty, so fresh installs get the standards without a manual `db:seed`, and a deleted standard never silently reappears.

**Files:**
- Create: `cockpit/src/app/api/starters/route.ts` (GET + POST + `ensureBuiltinStarters`)
- Create: `cockpit/src/app/api/starters/[id]/route.ts` (PATCH + DELETE)
- Create: `cockpit/src/app/api/starters/reset/route.ts` (POST)

**Interfaces:**
- Consumes: `prisma` from `@/lib/db`; `buildStarterSeedPlan`, `parseInputs`, `validateStarter` from `@/lib/starters`; `BUILTIN_STARTERS` from `@/lib/quickActions`.
- Produces (HTTP):
  - `GET /api/starters?target=…` → `{ starters: { id, target, label, inputs: Record<string,string>, builtin, order }[] }`
  - `POST /api/starters` body `{ target, label, inputs }` → `{ starter }` | 400
  - `PATCH /api/starters/[id]` body `{ label?, inputs? }` → `{ ok, starter }` | 400 | 404
  - `DELETE /api/starters/[id]` → `{ ok }` (P2025 → 404)
  - `POST /api/starters/reset` body `{ target }` → `{ ok, count }`

- [ ] **Step 1: Create `api/starters/route.ts`**:

```ts
import { prisma } from "@/lib/db";
import { BUILTIN_STARTERS } from "@/lib/quickActions";
import { buildStarterSeedPlan, parseInputs, validateStarter } from "@/lib/starters";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Seed the standards once, create-only, when the table is empty. */
async function ensureBuiltinStarters() {
  const count = await prisma.starter.count();
  if (count > 0) return;
  for (const row of buildStarterSeedPlan(BUILTIN_STARTERS)) {
    // create-only: never overwrite an edit on a later call
    await prisma.starter.upsert({ where: { sourceKey: row.sourceKey }, create: row, update: {} });
  }
}

export async function GET(req: Request) {
  await ensureBuiltinStarters();
  const target = new URL(req.url).searchParams.get("target") ?? "";
  const rows = await prisma.starter.findMany({
    where: { target },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });
  const starters = rows.map((r) => ({
    id: r.id,
    target: r.target,
    label: r.label,
    inputs: parseInputs(r.inputs) ?? {},
    builtin: r.builtin,
    order: r.order,
  }));
  return Response.json({ starters });
}

export async function POST(req: Request) {
  const { target, label, inputs } = (await req.json().catch(() => ({}))) as {
    target?: string;
    label?: string;
    inputs?: Record<string, string>;
  };
  const t = typeof target === "string" ? target : "";
  const l = typeof label === "string" ? label.trim() : "";
  const i = inputs && typeof inputs === "object" && !Array.isArray(inputs) ? inputs : {};
  const v = validateStarter(t, l, i as Record<string, string>);
  if (!v.ok) return Response.json({ error: v.error }, { status: 400 });

  const max = await prisma.starter.aggregate({ where: { target: t }, _max: { order: true } });
  const starter = await prisma.starter.create({
    data: { target: t, label: l, inputs: JSON.stringify(i), builtin: false, order: (max._max.order ?? 0) + 1 },
  });
  return Response.json({ starter: { ...starter, inputs: i } });
}
```

- [ ] **Step 2: Create `api/starters/[id]/route.ts`**:

```ts
import { prisma } from "@/lib/db";
import { validateStarter } from "@/lib/starters";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as { label?: string; inputs?: Record<string, string> };

  const existing = await prisma.starter.findUnique({ where: { id } });
  if (!existing) return Response.json({ error: "Starter not found." }, { status: 404 });

  const label = typeof body.label === "string" ? body.label.trim() : existing.label;
  const inputs =
    body.inputs && typeof body.inputs === "object" && !Array.isArray(body.inputs)
      ? (body.inputs as Record<string, string>)
      : null;

  if (inputs) {
    const v = validateStarter(existing.target, label, inputs);
    if (!v.ok) return Response.json({ error: v.error }, { status: 400 });
  } else if (!label) {
    return Response.json({ error: "A starter needs a label." }, { status: 400 });
  }

  const data: Record<string, unknown> = { label };
  if (inputs) data.inputs = JSON.stringify(inputs);
  const starter = await prisma.starter.update({ where: { id }, data });
  return Response.json({ ok: true, starter });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await prisma.starter.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Starter not found." }, { status: 404 });
  }
}
```

- [ ] **Step 3: Create `api/starters/reset/route.ts`**:

```ts
import { prisma } from "@/lib/db";
import { BUILTIN_STARTERS } from "@/lib/quickActions";
import { buildStarterSeedPlan } from "@/lib/starters";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Restore a target's shipped standards: delete its seeded rows (reverting edits
// and recreating deleted ones), then re-apply the plan. User-created rows
// (sourceKey: null) are left untouched.
export async function POST(req: Request) {
  const { target } = (await req.json().catch(() => ({}))) as { target?: string };
  const t = typeof target === "string" ? target : "";
  if (!t) return Response.json({ error: "Missing target." }, { status: 400 });

  const plan = buildStarterSeedPlan(BUILTIN_STARTERS).filter((r) => r.target === t);
  await prisma.starter.deleteMany({ where: { target: t, builtin: true } });
  for (const row of plan) {
    await prisma.starter.create({ data: row });
  }
  return Response.json({ ok: true, count: plan.length });
}
```

- [ ] **Step 4: Smoke-test the routes live**

Run (dev server up on :3939):
```bash
curl -s "http://localhost:3939/api/starters?target=reply-to-message" | head -c 400
```
Expected: JSON `{ "starters": [ … ] }` including the seeded "School bake sale" row with `inputs` as an object. (If the shell is sandboxed off localhost, verify in the browser Network tab instead.)

- [ ] **Step 5: Commit**

```bash
git add cockpit/src/app/api/starters
git commit -m "feat(starters): list/create + edit/delete + reset routes, lazy create-only seed"
```

---

### Task 5: `StarterChips` component + Quick Action runner integration

A shared component renders the chips + inline manage affordances, fetching the live list and falling back to the code built-ins while loading. Wire it into the runner first.

**Files:**
- Create: `cockpit/src/components/StarterChips.tsx`
- Modify: `cockpit/src/components/QuickActions.tsx` (replace the "Try an example" block with `<StarterChips … />`)

**Interfaces:**
- Consumes: `GET/POST /api/starters`, `PATCH/DELETE /api/starters/[id]`, `POST /api/starters/reset`; `QuickActionExample` from `@/lib/quickActions`.
- Produces: `export function StarterChips(props: StarterChipsProps)` where

```ts
type StarterDto = { id: string; target: string; label: string; inputs: Record<string, string>; builtin: boolean };
type StarterChipsProps = {
  target: string;                                   // action id or "inbox"
  fallback: { label: string; inputs: Record<string, string> }[]; // code built-ins, shown while loading
  current: Record<string, string>;                  // the live form values, for "Save current as starter"
  onPick: (inputs: Record<string, string>) => void; // fill (+ run, for the runner) — the caller decides
  editFields: { name: string; label: string; type?: "text" | "textarea" }[]; // the action's inputs, or one "text" field for inbox
};
```

**Behavior (the component):**
- On mount and when `target` changes: `fetch('/api/starters?target='+target)` → `setStarters(dto[])`. While the request is in flight (or on failure), render `fallback` chips (labels only, `onPick` uses the fallback inputs) so chips never flash empty.
- Render each starter as a chip → `onPick(starter.inputs)`. A "Manage" toggle reveals, per chip, an edit (pencil) and delete (×); a "Save current as starter" button; and a "Reset to defaults" button (behind the shared `ConfirmDialog`).
- Save-current: open a small dialog asking for a label (default = a short derived label), `POST /api/starters { target, label, inputs: current }`; on 400 show the returned error via `toast.error`; on success refetch.
- Edit: open a dialog rendering `editFields` prefilled from the starter, `PATCH /api/starters/[id] { label, inputs }`; refetch on success.
- Delete: `DELETE /api/starters/[id]`; refetch. Reset: `POST /api/starters/reset { target }`; refetch.
- Use the existing `Dialog` (`@/components/ui/dialog`), `Button`, `ConfirmDialog`, and `toast` from sonner — match the codebase's dialog/CRUD patterns (cf. `EditTaskDialog`, `RecentItems`).

- [ ] **Step 1: Implement `StarterChips.tsx`** per the interface and behavior above (full component; reuse `Dialog`/`Button`/`ConfirmDialog`/`toast`; keep it a single focused file). The chip row reuses the tinted "See it instantly" styling already in `QuickActions.tsx` for visual continuity.

- [ ] **Step 2: Wire into the runner** — in `QuickActions.tsx`, replace the `{active.examples && …}` block with:

```tsx
<StarterChips
  target={active.id}
  fallback={active.examples ?? []}
  current={values}
  onPick={(inputs) => runWith(inputs)}
  editFields={active.inputs.map((i) => ({ name: i.name, label: i.label, type: i.type }))}
/>
```

- [ ] **Step 3: Lint + build + live-verify the runner**

Run: `cd cockpit && env -u NODE_ENV npm run lint && env -u NODE_ENV npm run build`
Expected: clean.
Live: open `/tools/quick-actions?action=reply-to-message`, confirm DB chips render (incl. the new 2nd/3rd reply starters), a chip fills+runs, "Save current as starter" adds a chip, edit changes one, delete removes one, Reset restores. Screenshot.

- [ ] **Step 4: Commit**

```bash
git add cockpit/src/components/StarterChips.tsx cockpit/src/components/QuickActions.tsx
git commit -m "feat(starters): StarterChips + inline CRUD on the Quick Action runner"
```

---

### Task 6: Smart Inbox integration

Surface editable Inbox starters on the empty state; tapping fills the textarea with the starter's `text`.

**Files:**
- Modify: `cockpit/src/components/tools/InboxTool.tsx`

**Interfaces:**
- Consumes: `StarterChips`, `INBOX_TARGET`, `INBOX_FIELD` from `@/lib/quickActions`.

- [ ] **Step 1: Render Inbox starters when the textarea is empty** — in `InboxTool.tsx`, above (or below) the drop area, when `!text.trim()`:

```tsx
{!text.trim() && (
  <StarterChips
    target={INBOX_TARGET}
    fallback={[]}
    current={{ [INBOX_FIELD]: text }}
    onPick={(inputs) => setText(inputs[INBOX_FIELD] ?? "")}
    editFields={[{ name: INBOX_FIELD, label: "Text", type: "textarea" }]}
  />
)}
```

- [ ] **Step 2: Lint + build + live-verify the Inbox**

Run: `cd cockpit && env -u NODE_ENV npm run lint && env -u NODE_ENV npm run build`
Expected: clean.
Live: open `/tools/inbox`, confirm the 3 seeded Inbox starters render, tapping one fills the textarea, "Save current as starter" (after typing) adds one, edit/delete/reset work. Screenshot.

- [ ] **Step 3: Commit**

```bash
git add cockpit/src/components/tools/InboxTool.tsx
git commit -m "feat(starters): editable starter chips on the Smart Inbox empty state"
```

---

### Task 7: e2e + docs + final gate + Codex review

**Files:**
- Create: `cockpit/e2e/starters.spec.ts`
- Modify: `CLAUDE.md` (roadmap entry + the `db:push` note)

**Interfaces:**
- Consumes: the routes + UI above.

- [ ] **Step 1: Write route-mocked e2e** — `cockpit/e2e/starters.spec.ts`: mock `GET /api/starters?target=reply-to-message` to return two starters; assert both chips render; mock `POST /api/starters` and assert "Save current as starter" posts and the chip appears (refetch mock returns three); mock `DELETE` and assert removal; mock `POST /api/starters/reset` and assert it fires. Add an Inbox case: mock `target=inbox`, tap a chip, assert the textarea fills. Follow the existing route-mock pattern in `e2e/*.spec.ts` (e.g. `qa-pipeline.spec.ts`).

- [ ] **Step 2: Run the full suite**

Run (dev server stopped, `rm -rf .next/dev`): `cd cockpit && env -u NODE_ENV npm run test:e2e`
Expected: all pass (existing + new starters spec).

- [ ] **Step 3: Update `CLAUDE.md`** — add a roadmap bullet describing the starters feature and add `Starter` to the "run `npm run db:push` after pulling" note.

- [ ] **Step 4: Final gate**

Run: `cd cockpit && env -u NODE_ENV npm run lint && env -u NODE_ENV npm run test:unit && env -u NODE_ENV npm run build`
Expected: lint clean, all unit pass, build green.

- [ ] **Step 5: Commit**

```bash
git add cockpit/e2e/starters.spec.ts CLAUDE.md
git commit -m "test(starters): route-mocked e2e on both surfaces + docs"
```

- [ ] **Step 6: Codex adversarial review** — dispatch a Codex review of `git diff main...HEAD` focused on: the create-only seed never clobbering edits (and the empty-table reseed edge), the reset semantics (user rows untouched, edits reverted), validation completeness on POST/PATCH, the fetch/fallback race in `StarterChips` (target switch mid-fetch, no stale list), and that `getFeaturedDemo` + its tests stay code-driven. Fix confirmed findings, re-gate.

---

## Self-review

**Spec coverage:**
- New `Starter` model → Task 1. ✓
- Built-ins in code + focused seed content → Task 2. ✓
- Create-only lazy seed + Reset → Task 4 (`ensureBuiltinStarters` create-only; `reset` route). ✓
- API routes mirroring prompts → Task 4. ✓
- Validation (`missingInputs` / non-empty inbox text / caps / known target) → Task 3 + enforced in Task 4 routes. ✓
- Inline CRUD + Save-current + Reset on the runner → Task 5; Inbox → Task 6. ✓
- Unified target (action | inbox) → Tasks 2–6 throughout. ✓
- `FeaturedDemo` + tests untouched → Task 2 (derived map keeps the attach + featured demo working). ✓
- Testing (unit pure + route-mocked e2e + live) → Tasks 3, 7. ✓
- YAGNI cuts honored (no project scope, favorites, tags, search, drag-reorder, starter export). ✓
- Known gap flagged: starters not in `/api/export` (spec out-of-scope; not built). ✓

**Deviation from spec (flagged):** the spec mentioned seeding from `prisma/seed.mjs`; this plan seeds **only lazily via `ensureBuiltinStarters()`**, because `seed.mjs` is plain `.mjs` and cannot import the TS `BUILTIN_STARTERS` without duplicating the content (DRY). The content lives once, in TS. Fresh installs get standards on first read; behavior is otherwise identical.

**Placeholder scan:** routes, lib, and tests carry complete code; the only described-not-coded unit is the `StarterChips` JSX (Task 5 Step 1), specified by a precise interface + behavior list + the exact wiring snippets that consume it — a deliberate altitude for a ~150-line shadcn component with dialogs, to be built against the named primitives (`Dialog`, `Button`, `ConfirmDialog`, `toast`).

**Type consistency:** `BuiltinStarter`/`BUILTIN_STARTERS`/`INBOX_TARGET`/`INBOX_FIELD` (Task 2) are consumed by `lib/starters.ts` (Task 3), the routes (Task 4), and the UI (Tasks 5–6) with matching names. `StarterSeedRow`, `parseInputs`, `validateStarter` signatures are stable across Tasks 3–4. The `StarterChips` props (`target`, `fallback`, `current`, `onPick`, `editFields`) match both call sites (Tasks 5, 6).
