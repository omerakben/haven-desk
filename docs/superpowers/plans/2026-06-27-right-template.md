# Right template at the right moment — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. (Ultracode is on; executed inline with a Codex review gate.)

**Goal:** A dedicated, grouped `/tools/templates` page that makes pack/library templates easy to scan and run in one click, plus templates in ⌘K search.

**Architecture:** A server page fetches `kind:"prompt"` templates and renders a client browser that groups them (by category, with a source fallback) via a pure helper, runs them in a shared `TemplateRunDialog` (wrapping the existing `TemplateRunner`), and supports a `?run=<id>` deep-link. Templates also join `/api/search`. One shared `PROMPT_TEMPLATE_WHERE` keeps Brainstorm techniques out of every prompt surface.

**Tech Stack:** Next.js 16 (server + client components), TypeScript strict, Prisma + SQLite, Vitest, Playwright, shadcn.

## Global Constraints

- Build with `env -u NODE_ENV npm run build`. Gates from `cockpit/`: `npm run lint`, `npm run test:unit`, `npm run test:e2e`, `npm run build`.
- Local-only. Theme tokens, not raw `neutral-*`. Writing rules apply to copy.
- Every prompt-template query uses `PROMPT_TEMPLATE_WHERE` (`kind:"prompt"`, `archived:false`) — never show `kind:"technique"` (Brainstorm) or archived rows.
- Templates run via `TemplateRunner` (`/api/templates/run`); save never re-runs the model (the runner persists the on-screen result verbatim). DB via `import { prisma } from "@/lib/db"`.
- Per-feature gated commit: stop dev → `rm -rf .next` → build → lint → unit → e2e → one commit.

---

### Task 1: Categorize the SBO pack templates

So grouping is meaningful (they ship with no `category`). `PackTemplate.category?` already exists and `buildInstallPlan` carries it to the row.

**Files:**
- Modify: `cockpit/src/lib/packs/examples.ts` (add `category` to the six SBO templates)

- [ ] **Step 1: Add a category to each SBO template** — in `examples.ts`, add a `category` field to each template object (the object already has slug/kind/name/description/body/variables):
  - `sbo-meeting-notes-to-tasks` → `category: "planning"`
  - `sbo-follow-up-email` → `category: "email"`
  - `sbo-weekly-review` → `category: "planning"`
  - `sbo-proposal-writer` → `category: "proposal"`
  - `sbo-sop-builder` → `category: "operations"`
  - `sbo-receipt-organizer` → `category: "finance"`

  Example (proposal-writer): add `category: "proposal",` after its `kind: "prompt",` line.

- [ ] **Step 2: Verify pack tests still pass**

Run: `cd cockpit && env -u NODE_ENV npx vitest run src/lib/packs`
Expected: PASS (validator + install tests; `category` is an optional manifest field, so nothing breaks).

- [ ] **Step 3: Commit**

```bash
git add cockpit/src/lib/packs/examples.ts
git commit -m "feat(templates): give the SBO pack templates categories"
```

---

### Task 2: `lib/templateGroups.ts` — shared filter + pure grouping (TDD)

**Files:**
- Create: `cockpit/src/lib/templateGroups.ts`
- Test: `cockpit/src/lib/templateGroups.test.ts`

**Interfaces:**
- Produces:
  - `export const PROMPT_TEMPLATE_WHERE = { kind: "prompt", archived: false }`
  - `export type GroupableTemplate = { category: string | null; builtin: boolean; favorite: boolean; name: string }`
  - `export type TemplateGroup<T> = { label: string; templates: T[] }`
  - `export function groupTemplates<T extends GroupableTemplate>(templates: T[]): TemplateGroup<T>[]`

- [ ] **Step 1: Write the failing test** — `cockpit/src/lib/templateGroups.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { groupTemplates, PROMPT_TEMPLATE_WHERE } from "./templateGroups";

const t = (name: string, category: string | null, builtin = false, favorite = false) => ({ name, category, builtin, favorite });

describe("templateGroups", () => {
  it("PROMPT_TEMPLATE_WHERE excludes techniques and archived", () => {
    expect(PROMPT_TEMPLATE_WHERE).toEqual({ kind: "prompt", archived: false });
  });

  it("groups by title-cased category", () => {
    const groups = groupTemplates([t("A", "proposal"), t("B", "email"), t("C", "proposal")]);
    expect(groups.map((g) => g.label)).toEqual(["Email", "Proposal"]); // categories sorted alpha
    expect(groups.find((g) => g.label === "Proposal")!.templates.map((x) => x.name)).toEqual(["A", "C"]);
  });

  it("buckets null/blank category by source, after the categories", () => {
    const groups = groupTemplates([t("U", null, false), t("Z", "proposal"), t("Bi", "  ", true)]);
    expect(groups.map((g) => g.label)).toEqual(["Proposal", "Built-in", "Your templates"]);
  });

  it("sorts favorites first within a group, then by name", () => {
    const groups = groupTemplates([t("b", "x"), t("a", "x"), t("c", "x", false, true)]);
    expect(groups[0].templates.map((x) => x.name)).toEqual(["c", "a", "b"]);
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd cockpit && env -u NODE_ENV npx vitest run src/lib/templateGroups.test.ts`
Expected: FAIL ("Cannot find module './templateGroups'").

- [ ] **Step 3: Implement `lib/templateGroups.ts`**:

```ts
// The canonical filter for prompt-template surfaces (the Templates page, search).
// Brainstorm uses kind:"technique"; never show those here, and never archived.
export const PROMPT_TEMPLATE_WHERE = { kind: "prompt", archived: false };

export type GroupableTemplate = { category: string | null; builtin: boolean; favorite: boolean; name: string };
export type TemplateGroup<T> = { label: string; templates: T[] };

const SOURCE_BUILTIN = "Built-in";
const SOURCE_USER = "Your templates";

const titleCase = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * Group templates by category (title-cased); anything with no category falls
 * back to its source ("Built-in" / "Your templates"). Within a group: favorites
 * first, then by name. Group order: real categories alphabetically, then the two
 * source fallbacks last, so curated categories lead and catch-alls trail.
 */
export function groupTemplates<T extends GroupableTemplate>(templates: T[]): TemplateGroup<T>[] {
  const byLabel = new Map<string, T[]>();
  for (const item of templates) {
    const cat = item.category?.trim();
    const label = cat ? titleCase(cat) : item.builtin ? SOURCE_BUILTIN : SOURCE_USER;
    const arr = byLabel.get(label) ?? [];
    arr.push(item);
    byLabel.set(label, arr);
  }
  for (const arr of byLabel.values()) {
    arr.sort((a, b) => (a.favorite === b.favorite ? a.name.localeCompare(b.name) : a.favorite ? -1 : 1));
  }
  const fallbacks = [SOURCE_BUILTIN, SOURCE_USER];
  const categories = [...byLabel.keys()].filter((l) => !fallbacks.includes(l)).sort((a, b) => a.localeCompare(b));
  const tail = fallbacks.filter((l) => byLabel.has(l));
  return [...categories, ...tail].map((label) => ({ label, templates: byLabel.get(label)! }));
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `cd cockpit && env -u NODE_ENV npx vitest run src/lib/templateGroups.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add cockpit/src/lib/templateGroups.ts cockpit/src/lib/templateGroups.test.ts
git commit -m "feat(templates): shared prompt-template filter + pure grouping (tested)"
```

---

### Task 3: Shared `TemplateRunDialog`

**Files:**
- Create: `cockpit/src/components/library/TemplateRunDialog.tsx`
- Modify: `cockpit/src/components/library/PromptLibrary.tsx` (consume it; remove the inline run dialog)

**Interfaces:**
- Consumes: `TemplateRunner` (`{ template: { id; name; variables } }`).
- Produces: `export type DialogTemplate = { id: string; name: string; description?: string | null; variables: string }` and `export function TemplateRunDialog({ template, open, onOpenChange, savedLabel }: { template: DialogTemplate | null; open: boolean; onOpenChange: (o: boolean) => void; savedLabel?: string })`.

- [ ] **Step 1: Implement `TemplateRunDialog.tsx`**:

```tsx
"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TemplateRunner } from "@/components/library/TemplateRunner";

export type DialogTemplate = { id: string; name: string; description?: string | null; variables: string };

/** Fill + run a template in a dialog. Shared by the Templates page and the library. */
export function TemplateRunDialog({
  template,
  open,
  onOpenChange,
  savedLabel = "Saved",
}: {
  template: DialogTemplate | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  savedLabel?: string;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto overflow-x-hidden sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{template?.name}</DialogTitle>
          {template?.description && <DialogDescription>{template.description}</DialogDescription>}
        </DialogHeader>
        {template && <TemplateRunner template={template} savedLabel={savedLabel} />}
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Consume it in PromptLibrary** — in `PromptLibrary.tsx`: replace the inline `<Dialog open={!!useTemplate} …>…</Dialog>` block (the one wrapping `TemplateRunner`, around line 423-435) with:

```tsx
      <TemplateRunDialog
        template={useTemplate}
        open={!!useTemplate}
        onOpenChange={(o) => !o && setUseTemplate(null)}
        savedLabel="Saved to library"
      />
```

Change the import `import { TemplateRunner } from "@/components/library/TemplateRunner";` to `import { TemplateRunDialog } from "@/components/library/TemplateRunDialog";` (PromptLibrary no longer references `TemplateRunner` directly). Keep the `Dialog`/`DialogContent`/… imports (the create/edit dialogs still use them).

- [ ] **Step 3: Lint + build + verify the library still runs a template**

Run: `cd cockpit && env -u NODE_ENV npm run lint && env -u NODE_ENV npm run build`
Expected: clean.
Live: `/tools/prompt-library` → Templates tab → "Use" a template → the dialog opens and runs. Screenshot.

- [ ] **Step 4: Commit**

```bash
git add cockpit/src/components/library/TemplateRunDialog.tsx cockpit/src/components/library/PromptLibrary.tsx
git commit -m "refactor(templates): shared TemplateRunDialog (PromptLibrary consumes it)"
```

---

### Task 4: The Templates page + browser + nav

**Files:**
- Create: `cockpit/src/app/tools/templates/page.tsx`
- Create: `cockpit/src/components/library/TemplatesBrowser.tsx`
- Modify: `cockpit/src/lib/nav.tsx` (add the Templates entry)

**Interfaces:**
- Consumes: `PROMPT_TEMPLATE_WHERE`, `groupTemplates` (`@/lib/templateGroups`); `TemplateRunDialog` (`@/components/library/TemplateRunDialog`).
- Produces: `export type BrowseTemplate = { id: string; name: string; description: string | null; category: string | null; builtin: boolean; favorite: boolean; variables: string }` and `export function TemplatesBrowser({ templates, initialRunId }: { templates: BrowseTemplate[]; initialRunId?: string | null })`.

- [ ] **Step 1: Implement `TemplatesBrowser.tsx`**:

```tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Search, Play, Package } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { TemplateRunDialog } from "@/components/library/TemplateRunDialog";
import { groupTemplates } from "@/lib/templateGroups";

export type BrowseTemplate = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  builtin: boolean;
  favorite: boolean;
  variables: string;
};

export function TemplatesBrowser({ templates, initialRunId }: { templates: BrowseTemplate[]; initialRunId?: string | null }) {
  const [query, setQuery] = useState("");
  const [running, setRunning] = useState<BrowseTemplate | null>(null);

  // Deep-link (?run=<id> from ⌘K): open once for the given id, from the
  // already-fetched list — no extra fetch, and a list filter can't re-trigger it.
  useEffect(() => {
    if (!initialRunId) return;
    const t = templates.find((x) => x.id === initialRunId);
    if (t) setRunning(t);
  }, [initialRunId, templates]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return templates;
    return templates.filter((t) => `${t.name} ${t.description ?? ""} ${t.category ?? ""}`.toLowerCase().includes(q));
  }, [query, templates]);

  const groups = useMemo(() => groupTemplates(filtered), [filtered]);

  if (templates.length === 0) {
    return (
      <div className="max-w-3xl">
        <h1 className="text-2xl font-semibold tracking-tight">Templates</h1>
        <Card className="mt-6">
          <CardContent className="flex flex-col items-start gap-3 p-6">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Package className="h-[18px] w-[18px]" />
            </span>
            <div>
              <div className="font-medium">No templates yet</div>
              <p className="mt-1 text-sm text-muted-foreground">
                Install a pack to get ready-made templates like a proposal writer or an SOP builder.
              </p>
            </div>
            <Button asChild size="sm">
              <Link href="/tools/packs">Browse packs</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-semibold tracking-tight">Templates</h1>
      <p className="mt-1.5 text-[15px] text-muted-foreground">
        Pick a ready-made template, fill the blanks, and run it. Manage or create your own in the Prompt Library.
      </p>

      <div className="relative mt-5">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search templates — proposal, email, SOP…"
          aria-label="Search templates"
          className="h-10 w-full rounded-lg border border-input bg-card pl-9 pr-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
        />
      </div>

      {groups.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">No templates match “{query.trim()}”.</p>
      ) : (
        <div className="mt-6 space-y-7">
          {groups.map((g) => (
            <section key={g.label}>
              <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{g.label}</h2>
              <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {g.templates.map((t) => (
                  <Card key={t.id} className="h-full">
                    <CardContent className="flex h-full flex-col gap-2 p-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-medium">{t.name}</span>
                          {t.category && (
                            <Badge variant="outline" className="shrink-0 text-[10px]">
                              {t.category}
                            </Badge>
                          )}
                        </div>
                        {t.description && (
                          <p className="mt-1 line-clamp-2 text-xs leading-snug text-muted-foreground">{t.description}</p>
                        )}
                      </div>
                      <div className="mt-auto pt-1">
                        <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => setRunning(t)}>
                          <Play className="mr-1 h-3.5 w-3.5" /> Use
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <TemplateRunDialog
        template={running}
        open={running !== null}
        onOpenChange={(o) => !o && setRunning(null)}
        savedLabel="Saved to library"
      />
    </div>
  );
}
```

- [ ] **Step 2: Implement the page** — `cockpit/src/app/tools/templates/page.tsx`:

```tsx
import { prisma } from "@/lib/db";
import { PROMPT_TEMPLATE_WHERE } from "@/lib/templateGroups";
import { TemplatesBrowser } from "@/components/library/TemplatesBrowser";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function TemplatesPage({ searchParams }: { searchParams: Promise<{ run?: string }> }) {
  const { run } = await searchParams;
  const templates = await prisma.template
    .findMany({
      where: PROMPT_TEMPLATE_WHERE,
      orderBy: { name: "asc" },
      select: { id: true, name: true, description: true, category: true, builtin: true, favorite: true, variables: true },
    })
    .catch(() => []);
  return <TemplatesBrowser templates={templates} initialRunId={run ?? null} />;
}
```

- [ ] **Step 3: Add the nav entry** — in `cockpit/src/lib/nav.tsx`, import `LayoutTemplate` from lucide-react (add to the existing import), and add to the `write` group (next to Prompt Library):

```tsx
  { href: "/tools/templates", label: "Templates", icon: LayoutTemplate, group: "write", desc: "Browse & run ready-made templates.", keywords: "template proposal sop email pack run" },
```

- [ ] **Step 4: Lint + build + live-verify**

Run: `cd cockpit && env -u NODE_ENV npm run lint && env -u NODE_ENV npm run build`
Expected: clean (incl. `nav.test` — the page exists).
Live on `gemma4:e4b`: install the SBO pack at `/tools/packs` if not present; open `/tools/templates` → templates appear under category headers (Email / Operations / Proposal / Finance / Planning + Built-in); search narrows; "Use" on Proposal writer → dialog fills + runs + saves; visit `/tools/templates?run=<id>` → the dialog auto-opens. Screenshot.

- [ ] **Step 5: Commit**

```bash
git add cockpit/src/app/tools/templates/page.tsx cockpit/src/components/library/TemplatesBrowser.tsx cockpit/src/lib/nav.tsx
git commit -m "feat(templates): grouped /tools/templates browse + run + ?run= deep-link"
```

---

### Task 5: Templates in ⌘K / global search

**Files:**
- Modify: `cockpit/src/app/api/search/route.ts`

- [ ] **Step 1: Add Template to search** — in `search/route.ts`:
  - Add `import { PROMPT_TEMPLATE_WHERE } from "@/lib/templateGroups";`.
  - Add `"Template"` to the `SearchResult` `type` union (line 7).
  - Add a sixth query to the `Promise.all` (after `qaSession`):

```ts
    prisma.template
      .findMany({
        where: { ...PROMPT_TEMPLATE_WHERE, OR: [{ name: { contains: q } }, { description: { contains: q } }, { body: { contains: q } }] },
        take,
        orderBy: { updatedAt: "desc" },
        select: { id: true, name: true, description: true },
      })
      .catch(() => []),
```

  - Add `templates` to the destructured array and map it into `results`:

```ts
    ...templates.map((t) => ({
      type: "Template" as const,
      id: t.id,
      title: t.name,
      subtitle: t.description ?? undefined,
      href: `/tools/templates?run=${t.id}`,
    })),
```

- [ ] **Step 2: Confirm the palette renders the new type** — `CommandPalette.tsx` renders results generically by `type`; verify a "Template" result shows with its badge and navigates. If the palette has a hardcoded type→style map, add a `Template` case (check `cockpit/src/components/CommandPalette.tsx`).

- [ ] **Step 3: Lint + build + live-verify**

Run: `cd cockpit && env -u NODE_ENV npm run lint && env -u NODE_ENV npm run build`
Expected: clean.
Live: ⌘K → type "proposal" → a Template result appears → selecting it opens `/tools/templates?run=<id>` with the run dialog open. Screenshot.

- [ ] **Step 4: Commit**

```bash
git add cockpit/src/app/api/search/route.ts cockpit/src/components/CommandPalette.tsx
git commit -m "feat(templates): templates in global search, one-click runnable"
```

---

### Task 6: e2e + docs + final gate + Codex review

**Files:**
- Create: `cockpit/e2e/templates.spec.ts`
- Modify: `CLAUDE.md`

- [ ] **Step 1: Write route-mocked e2e** — `cockpit/e2e/templates.spec.ts`: the page is server-rendered from the DB, so seed via the live DB OR (preferred, model-independent) assert structure that doesn't need a model run. Practical approach: navigate to `/tools/templates`, and since the dev DB has builtins, assert a known category header (e.g. "Summarize" or a builtin's group) is visible and the search box filters; assert clicking "Use" opens the run dialog (the dialog title appears) without running the model. Add a `?run=<id>` case if a deterministic id is available (else cover it live). Keep it resilient to DB contents (assert on the search box + at least one group + the dialog open), following the existing tool-page e2e style. Do NOT depend on a specific pack being installed.

- [ ] **Step 2: Run the full suite**

Run (dev stopped, `rm -rf .next/dev`): `cd cockpit && env -u NODE_ENV npm run test:e2e`
Expected: all pass.

- [ ] **Step 3: Update `CLAUDE.md`** — add a roadmap bullet for the Templates page + search.

- [ ] **Step 4: Final gate**

Run: `cd cockpit && env -u NODE_ENV npm run lint && env -u NODE_ENV npm run test:unit && env -u NODE_ENV npm run build`
Expected: lint clean, all unit pass, build green.

- [ ] **Step 5: Commit**

```bash
git add cockpit/e2e/templates.spec.ts CLAUDE.md
git commit -m "test(templates): e2e + docs"
```

- [ ] **Step 6: Codex adversarial review** — dispatch a Codex review of `git diff main...HEAD` focused on: the `PROMPT_TEMPLATE_WHERE` filter applied on every prompt surface (no technique leakage), `groupTemplates` ordering/fallback correctness, the `?run=` deep-link open-once behavior (no re-trigger on filter, no set-state-in-effect warning), the SBO categorization applying on install, that `TemplateRunDialog` is behavior-identical to the old inline PromptLibrary dialog, and the search Template mapping. Fix confirmed findings, re-gate.

---

## Self-review

**Spec coverage:**
- Dedicated grouped `/tools/templates` page → Task 4. ✓
- Group by category with source fallback → Task 2 (`groupTemplates`) + Task 4 (render). ✓
- Categorize pack templates → Task 1. ✓
- Shared `TemplateRunDialog` + reuse the existing `TemplateRunner`; de-bloat PromptLibrary → Task 3. ✓
- `?run=<id>` deep-link → Task 4 (consumer) + Task 5 (search href). ✓
- Templates in ⌘K / `/api/search`, one-click runnable → Task 5. ✓
- Shared `kind:"prompt"`+`archived:false` filter everywhere → Task 2 (`PROMPT_TEMPLATE_WHERE`) used in Tasks 4, 5. ✓
- Empty state → Packs → Task 4. ✓
- Nav entry → Task 4. ✓
- YAGNI cuts (no usage tracking, per-tool, project scope, dashboard hero, no removing library management) — nothing in the plan adds them. ✓
- Testing (pure unit + route-mocked e2e + live) → Tasks 2, 6. ✓

**Placeholder scan:** libs/page/components/search carry complete code; the e2e (Task 6) is specified by exact intercept-free, DB-contents-resilient assertions to write against the existing tool-page e2e style (the DB-rendered page makes a fully pre-written mock brittle, so it's described precisely).

**Type consistency:** `PROMPT_TEMPLATE_WHERE`/`groupTemplates`/`GroupableTemplate` (Task 2) flow into the page query (Task 4), the browser (`BrowseTemplate extends GroupableTemplate`-compatible: has category/builtin/favorite/name), and search (Task 5). `DialogTemplate` (Task 3) is satisfied by `BrowseTemplate` (id/name/description/variables) and the library's `useTemplate`. The `?run=` param name is consistent across the page consumer (Task 4) and the search href (Task 5).
