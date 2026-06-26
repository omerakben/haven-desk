// Two reference packs that double as living documentation and as validator
// fixtures (manifest.test.ts asserts both pass with zero errors). They show the
// two ends of the v1 ladder: Small Business Ops is a pure L0 content pack (the
// first mass-market pack), QA and Product Ops is an L1 pack that surfaces routes
// and leans on deterministic gates that already exist in this repo (the first
// professional pack). Neither requests network, sending, code, or autonomy.

import { defaultPermissions, type PluginManifest } from "./manifest";

// First mass-market pack. Content only (templates, facts, task seeds) so it
// installs by seeding alone, no new routes or code. Proves the app can move
// beyond developers.
export const smallBusinessOpsPack: PluginManifest = {
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
  permissions: defaultPermissions(),
  setupChecks: [
    "Local model gemma4:e4b is installed.",
    "At least one business project exists.",
    "No email is sent automatically; every draft is reviewed before use.",
  ],
};

// First professional pack. L1: it surfaces existing cockpit routes and relies on
// deterministic gates already shipped in this repo (gherkinLint, rubric,
// evalCases, codeSmells). It requests no extra permissions.
export const qaProductOpsPack: PluginManifest = {
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
  permissions: defaultPermissions(),
  setupChecks: [
    "Local model gemma4:e4b is installed (gemma4:12b optional for the QA tier).",
    "A project exists to scope rubrics and golden cases.",
  ],
};

/** Reference packs shipped with the app, keyed by slug. */
export const EXAMPLE_PACKS: PluginManifest[] = [smallBusinessOpsPack, qaProductOpsPack];
