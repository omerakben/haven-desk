Plugin and pack specification for Haven Desk workflow packs.

Date: 2026-06-26

## Why declarative-first (no arbitrary code in v1)

Haven Desk packs are intentionally limited to structured data in v1. The choice is not a technical limitation but a safety boundary.

A pack that contains only templates, memory facts, task seeds, knowledge links, and references to existing cockpit routes cannot execute code, open network connections, or mutate state without the user's explicit save action. That constraint is what lets a user install a community pack without reading every line of it. It is also what lets the validator catch every structural problem before any data reaches the database.

The precedent already exists in the repo: `prisma/seed-lbmh.mjs` loads a LBMH project pack from `cockpit/projects/lbmh/pack/content.mjs` by upserting facts, templates, and prompts by their `sourceKey` or `slug`. That format is the practical L0 baseline. The `PluginManifest` type at `cockpit/src/lib/packs/manifest.ts`, implemented and tested this session (39 unit tests in `cockpit/src/lib/packs/manifest.test.ts`, run via `npm run test:unit`), gives that pattern a typed contract, a validator, and a maturity ladder so future packs can grow into routes, local MCP tools, and watched-folder automations without abandoning the safety model.

Arbitrary code execution, external network calls, and unsupervised mutations are not permitted in v1. They may appear in L3 packs in a future version, but only after a review-queue and per-action approval gate are in place. See the positioning and hard constraints in `haven-desk-strategy-report.md` and the build sequence in `haven-desk-engineering-roadmap.md`.

## PluginManifest shape

This table reflects the `PluginManifest` type implemented at `cockpit/src/lib/packs/manifest.ts`. Two example packs ship alongside it in `cockpit/src/lib/packs/examples.ts`, and 39 unit tests covering the validator run via `npm run test:unit` (`cockpit/src/lib/packs/manifest.test.ts`).

| Field | TypeScript type | Required | Notes |
|---|---|---|---|
| `slug` | `string` | yes | kebab-case, unique across installed packs. Matches the `sourceKey`/`slug` idempotent-seed convention. |
| `name` | `string` | yes | Human-readable display name. |
| `version` | `string` | yes | Semver `major.minor.patch`. |
| `description` | `string` | yes | One or two sentences. |
| `audience` | `"household" \| "student" \| "small-business" \| "creative" \| "personal-admin" \| "professional"` | yes | Single value matching a fixed enum. |
| `industry` | `string` | yes | Non-empty free-form label (e.g. `"small-business-ops"`, `"legal-admin"`, `"qa-product"`). |
| `maturity` | `"L0" \| "L1" \| "L2" \| "L3"` | yes | Determines what fields are legal. |
| `capabilities` | `string[]` | yes | At least 1 entry. Human-readable workflow promises (e.g. `"Draft meeting notes into action items"`). |
| `requiredModels` | `string[]` | yes | At least 1 entry, no blank strings. Default light tier is `gemma4:e4b`. |
| `templates` | `{ slug: string; kind: "prompt" \| "technique"; name: string; body: string; description?: string; category?: string; variables?: string[] }[]` | no | Template slugs must be unique within the manifest. |
| `memoryFacts` | `{ sourceKey: string; value: string; key?: string; category?: string; pinned?: boolean }[]` | no | `sourceKey` must be unique within the manifest. |
| `taskSeeds` | `{ sourceKey: string; title: string; status?: string; module?: string; notes?: string }[]` | no | `sourceKey` must be unique within the manifest. |
| `knowledgeSources` | `{ label: string; path?: string; owuiUrl?: string }[]` | no | Each entry needs `path` or `owuiUrl` (or both). |
| `gates` | `string[]` | no | Names of deterministic gates the pack uses (e.g. `gherkinLint`, `rubric`, `lintAdr`, `openapiLint`). |
| `routes` | `string[]` | no | Cockpit routes this pack surfaces. Each must start with `"/"`. Forbidden at L0. |
| `mcpTools` | `string[]` | no | Names of read-only or proposal-only MCP tools. L2 and above only. |
| `permissions` | `PackPermissions` | yes | Default-deny object. See next section. |
| `setupChecks` | `string[]` | no | Human-readable preconditions shown at install time. Required for high-stakes industries. |

## PackPermissions default-deny table

Every `PackPermissions` field starts `false`. A validator error blocks installation when any of the four v1 invariant fields is set `true`.

| Permission field | Default | L0 | L1 | L2 | L3 | v1 invariant |
|---|---|---|---|---|---|---|
| `readsLocalFiles` | `false` | no | allowed | allowed | allowed | no |
| `network` | `false` | no | no | no | no | MUST be `false` in v1 |
| `externalSend` | `false` | no | no | no | no | MUST be `false` in v1 |
| `mcpProposeWrites` | `false` | no | no | L2+ only | allowed | no (but blocked below L2) |
| `runtimeCode` | `false` | no | no | no | no | MUST be `false` in v1 |
| `autonomous` | `false` | no | no | no | no | MUST be `false` in v1 |

`mcpProposeWrites` enables MCP tools to place proposed writes into a review queue; the user approves each one before it reaches the database. Even then, the mutations route through the normal cockpit permission checks and reviewed-save pattern, not around them.

## Maturity ladder

**L0: Project pack (content only)**

Templates, memory facts, task seeds, prompt-library entries, and knowledge source links. No routes, no `mcpTools`. The pack loads into an existing project through the seed path and relies entirely on surfaces that already exist in the cockpit. The LBMH pack in `prisma/seed-lbmh.mjs` is a working L0 example.

**L1: Cockpit tool**

Everything L0 allows, plus a cockpit route, dedicated UI, storage model, and at least one deterministic gate. `readsLocalFiles` may be true. The pack declares which cockpit routes it surfaces in the `routes` array. Every model step that writes durable state must have a deterministic check (matching the `gherkinLint`/`lintAdr`/`rubric` house pattern).

**L2: Local MCP server**

Everything L1 allows, plus named MCP tools that read local resources or propose actions. The MCP server must be localhost-bound, require a header token, and log every call. `mcpProposeWrites` may be true. Each proposed write surfaces to a review queue before the cockpit persists it. At L2 the manifest must list at least one `mcpTools` entry (warning if absent).

**L3: Automation pack**

Everything L2 allows, plus watched-folder triggers, scheduled routines, and approval queues for time-based mutations. Every mutation still routes through a user-facing review step. `network`, `externalSend`, `runtimeCode`, and `autonomous` remain blocked in v1 regardless of maturity level.

## Validation rules

The validator returns `{ issues: PackIssue[], summary, ok }`, where `summary` is an object of counts. This mirrors the `{ issues, summary, ok }` shape of `lintAdr` and `gherkinLint`. `ok` is `false` when any ERROR is present. WARNs do not block installation but are shown to the user.

### Errors

These block installation:

- Missing or empty `slug`, `name`, `description`, `version`, or `industry`.
- `slug` is not kebab-case (must match `/^[a-z0-9]+(?:-[a-z0-9]+)*$/`).
- `version` is not valid semver (`major.minor.patch`, non-negative integers).
- `audience` is not one of the six enum values.
- `maturity` is not one of `L0`, `L1`, `L2`, `L3`.
- `capabilities` array is empty.
- `requiredModels` array is empty, or any entry is blank.
- Duplicate `template.slug` values within the same manifest.
- Duplicate `memoryFacts[].sourceKey` values within the same manifest.
- Duplicate `taskSeeds[].sourceKey` values within the same manifest.
- `permissions.network` is `true`.
- `permissions.externalSend` is `true`.
- `permissions.runtimeCode` is `true`.
- `permissions.autonomous` is `true`.
- `maturity` is `L0` and `routes` is non-empty.
- `maturity` is `L0` and `mcpTools` is non-empty.
- `permissions.mcpProposeWrites` is `true` and `maturity` is `L0` or `L1`.
- A `knowledgeSources` entry has neither `path` nor `owuiUrl`.
- `industry` matches a high-stakes category (`legal`, `medical`, `finance`, `tax`, `immigration`) and `maturity` is above `L1` (high-stakes packs must stay declarative and reviewed).
- `industry` matches a high-stakes category and `setupChecks` contains no guardrail note.

### Warnings

These are advisory:

- `maturity` is `L2` or `L3` and `mcpTools` is empty (declared maturity is not backed by any tool).
- A `routes` entry does not start with `"/"`.

### Result shape

```typescript
type PackSeverity = "ERROR" | "WARN";

type PackIssue = {
  severity: PackSeverity;
  field: string;   // dot-path to the offending field, e.g. "permissions.network"
  message: string;
};

type PackValidationResult = {
  issues: PackIssue[];
  summary: {
    errors: number;
    warnings: number;
    maturity: string | null;
    templates: number;
    memoryFacts: number;
    taskSeeds: number;
  };
  ok: boolean;       // false when any ERROR is present
};
```

## Install and seed expectations

The installer follows the same idempotent pattern established by `prisma/seed-lbmh.mjs`:

- **Facts** upsert by `sourceKey` (`MemoryFact.sourceKey` is unique). Re-running updates the `value`, `key`, `category`, and `pinned` fields without creating a duplicate.
- **Templates** upsert by `slug` (`Template.slug` is unique). Re-running refreshes `body`, `description`, and `variables`.
- **Task seeds** upsert by `sourceKey` (`Task.sourceKey` is unique). Status, priority, and module are refreshed on re-run.
- **Prompts** upsert by `sourceKey` (`Prompt.sourceKey` is unique).

A dry-run flag (`--dry-run`) logs what would be inserted or updated and exits without touching the database.

When no pack content file is present, the installer exits with a clean message and status 0. It does not error. This matches the LBMH seed behavior: `"No project pack found ... Nothing to seed."` The cockpit's empty-state first-run card points users to the install step rather than showing an error.

The installer creates a Project record if one does not exist with the matching `name`, using the manifest `name` and `description`. It does not delete or reassign existing content.

Pack slugs within `sourceKey` values should be namespaced to avoid cross-pack collisions (e.g. `small-biz-ops:meeting-notes-to-tasks`, `qa-product:gherkin-authoring`).

## Permission model and high-stakes guardrails

The default-deny model means a pack author must explicitly opt in to every elevated capability. No permission is inferred from the maturity level alone.

For packs in high-stakes industries (legal, medical, finance, tax, immigration), two rules are hard gates (validator ERRORs, so the pack fails to install) regardless of maturity:

1. The pack must stay at L1 or below. A validator ERROR fires if `maturity` is L2 or L3 and `industry` is high-stakes. These packs carry liability, so they stay declarative and reviewed.
2. The pack's `setupChecks` must include at least one guardrail note. The note is shown to the user at install time. Typical text: `"This pack produces admin checklists and draft letters. It is not legal advice. Review everything with a qualified professional before acting."` The validator ERRORs if this note is absent.

These two rules are not bureaucratic friction. They are the product promise that makes Haven Desk trustworthy in those categories: the pack organizes, extracts, and drafts, but the user is the decision-maker, and the pack says so up front.

No pack in v1 may send data outside the machine (`externalSend: false`), execute code at runtime (`runtimeCode: false`), or act without user review (`autonomous: false`). These constraints hold at every maturity level.

## First pack definitions

### Small Business Ops (L0)

This is the first mass-market pack. The shipped example is L0: templates, memory facts, and task seeds only, with no routes. A future L1 upgrade may add cockpit routes for proposal drafting and similar workflows, each gated by a deterministic completeness check.

```typescript
const smallBusinessOpsPack: PluginManifest = {
  slug: "small-business-ops",
  name: "Small Business Ops",
  version: "0.1.0",
  description:
    "Run day-to-day admin without hiring an assistant: turn notes into tasks and follow-ups, draft proposals and SOPs, and review the week.",
  audience: "small-business",
  industry: "small business operations",
  maturity: "L0",

  capabilities: [
    "Turn meeting notes into tasks and a follow-up draft",
    "Draft a proposal from a rough brief",
    "Draft a follow-up email in your tone",
    "Build a standard operating procedure from rough steps",
    "Prepare a weekly business review",
    "Organize receipts and invoices into a checklist",
  ],

  requiredModels: ["gemma4:e4b"],

  templates: [
    {
      slug: "sbo-meeting-notes-to-tasks",
      kind: "prompt",
      name: "Meeting notes to tasks",
      description: "Extract action items, owners, and dates from rough meeting notes.",
      body: "Read these meeting notes and list the action items as tasks. For each: a short title, the owner if named, and a due date if stated. Keep it to what the notes actually say.\n\nNotes:\n{{notes}}",
      variables: JSON.stringify([{ name: "notes", label: "Meeting notes", type: "textarea" }]),
    },
    {
      slug: "sbo-follow-up-email",
      kind: "prompt",
      name: "Follow-up email",
      description: "Draft a short, polite follow-up after a meeting or quote.",
      body: "Write a short, friendly follow-up email to {{recipient}} about {{topic}}. Keep it under 120 words, end with one clear next step, and do not invent details.",
      variables: JSON.stringify([
        { name: "recipient", label: "Recipient", type: "text" },
        { name: "topic", label: "Topic", type: "text" },
      ]),
    },
    {
      slug: "sbo-weekly-review",
      kind: "prompt",
      name: "Weekly business review",
      description: "Summarize the week into wins, open loops, and next week's focus.",
      body: "From these notes and tasks, write a weekly review with three short sections: Wins, Open loops, Focus next week. Be concrete and brief.\n\n{{input}}",
      variables: JSON.stringify([{ name: "input", label: "This week's notes and tasks", type: "textarea" }]),
    },
  ],

  memoryFacts: [
    {
      sourceKey: "sbo-fact-tone",
      key: "Writing tone",
      value: "Client messages stay warm, concise, and direct. No corporate filler.",
      category: "preference",
    },
    {
      sourceKey: "sbo-fact-review-cadence",
      key: "Review cadence",
      value: "A weekly business review runs every Friday afternoon.",
      category: "workflow",
    },
  ],

  taskSeeds: [
    { sourceKey: "sbo-task-setup-project", title: "Create a business project and set the working week", status: "todo" },
    { sourceKey: "sbo-task-first-review", title: "Run the first weekly business review", status: "todo" },
  ],

  knowledgeSources: [],
  gates: [],
  routes: [],
  mcpTools: [],

  permissions: {
    readsLocalFiles: false,
    network: false,
    externalSend: false,
    mcpProposeWrites: false,
    runtimeCode: false,
    autonomous: false,
  },

  setupChecks: [
    "Local model gemma4:e4b is installed.",
    "At least one business project exists.",
    "No email is sent automatically; every draft is reviewed before use.",
  ],
};
```

The L1 upgrade, when built, will add a `routes` array listing cockpit surfaces the pack activates. No routes ship in v0.1.0.

### QA and Product Ops (L1)

This pack is the first professional paid pack. It does not build new tools; it organizes the existing QA Pipeline, Gherkin Lint, Bug Report, Rubric Designer, and Eval Cases surfaces into a named pack with a project-specific template set and memory facts. The gates array names the deterministic validators the pack depends on.

```typescript
const qaProductOpsPack: PluginManifest = {
  slug: "qa-product-ops",
  name: "QA and Product Ops",
  version: "0.1.0",
  description:
    "Turn requirements into reliable acceptance artifacts: story to Gherkin to lint to rubric, plus bug reports, eval cases, and a release readiness checklist. The quality tier (gemma4:12b) can be set per tool for more rigor.",
  audience: "professional",
  industry: "software QA and product operations",
  maturity: "L1",

  capabilities: [
    "Turn a story into acceptance criteria and Gherkin",
    "Lint Gherkin for BDD hygiene",
    "Turn a rough note into a structured bug report",
    "Design a weighted, gated eval rubric",
    "Generate coverage-checked eval cases",
    "Produce a release readiness checklist",
  ],

  requiredModels: ["gemma4:e4b"],

  templates: [
    {
      slug: "qpo-release-readiness",
      kind: "prompt",
      name: "Release readiness checklist",
      description: "Draft a pre-release checklist from the change set and known risks.",
      body: "Draft a release readiness checklist for this change. Cover: acceptance criteria met, tests run, known risks, rollback plan, and sign-off. Keep each item one line.\n\nChange summary:\n{{summary}}",
      variables: JSON.stringify([{ name: "summary", label: "Change summary", type: "textarea" }]),
    },
  ],

  memoryFacts: [
    {
      sourceKey: "qpo-fact-gate-first",
      key: "Quality bar",
      value: "Every AI draft that feeds durable state passes a deterministic gate (lint, score, or schema) before it is saved.",
      category: "standard",
    },
  ],

  taskSeeds: [
    { sourceKey: "qpo-task-first-pipeline", title: "Run a story through the QA pipeline (Gherkin, lint, rubric)", status: "todo" },
  ],

  knowledgeSources: [],

  gates: ["gherkinLint", "rubric", "evalCases"],

  routes: [
    "/tools/qa-pipeline",
    "/tools/gherkin-lint",
    "/tools/bug-report",
    "/tools/rubric-designer",
    "/tools/eval-cases",
  ],

  mcpTools: [],

  permissions: {
    readsLocalFiles: false,
    network: false,
    externalSend: false,
    mcpProposeWrites: false,
    runtimeCode: false,
    autonomous: false,
  },

  setupChecks: [
    "Local model gemma4:e4b is installed (gemma4:12b optional for the QA tier).",
    "A project exists to scope rubrics and golden cases.",
  ],
};
```

The `gates` array references the validators that already exist at `cockpit/src/lib/gherkinLint.ts` and `cockpit/src/lib/ai/` (the `scoreFeature`/`extractVerdict` path). The installer verifies those files exist before marking the pack as ready. This check prevents installing a pack that depends on a gate that has not been built yet.

## Pack authoring workflow

A pack moves through four steps before its content reaches the database.

**1. Write the manifest**

Create a file (e.g. `cockpit/projects/my-pack/pack/manifest.ts`) that exports a `PluginManifest` object. Start with `maturity: "L0"` and fill in the required fields. Add templates and memory facts first; routes come later when the L0 pack is working.

**2. Validate**

Run the validator by calling `validatePackManifest` from `cockpit/src/lib/packs/manifest.ts` (the function is pure and dependency-free). See the call pattern in `cockpit/src/lib/packs/manifest.test.ts`. A CLI wrapper (`npm run pack:validate`) is planned. Fix every ERROR before moving on. WARN items are advisory. The validator result is `{ issues, summary, ok }`, matching the `lintAdr` and `gherkinLint` output shape, so the same test pattern used for those gates applies here.

**3. Dry-run seed**

Run the installer with `--dry-run` to see exactly what rows would be created or updated:

```
npm run pack:seed -- --pack cockpit/projects/my-pack/pack/manifest.ts --dry-run
```

The dry-run prints each upsert with the `sourceKey` or `slug` that identifies it and whether it is a create or an update. Nothing is written to the database.

**4. Install**

Run the installer without `--dry-run`. The installer upserts all content into the target project and prints a summary line: fact count, template count, task-seed count, prompt count. Re-running is safe; the idempotent upsert pattern does not create duplicates.

For packs in high-stakes industries, verify the `setupChecks` copy with a non-technical reader before shipping. The guardrail note is the product's representation to the user about what the pack can and cannot do.
