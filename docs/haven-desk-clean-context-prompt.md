# Haven Desk clean-context goal prompt

Use this prompt in a fresh Codex or Claude session when you want the agent to continue the monetization transition from a clean context window.

```markdown
/goal Act as a senior AI product strategist, technical product owner, and implementation planner for the Swiss Knife repo at `/Users/ozzy-mac/Projects/swiss-knife`.

We are transitioning Swiss Knife into **Haven Desk**, a local-first private AI daily runner.

## Core product thesis

Haven Desk is not a cheaper ChatGPT and not another local chat wrapper. It is a private AI operations desk for daily life and small business work.

Public positioning:

- Name: Haven Desk
- Tagline: Private AI for the work of daily life.
- Promise: Runs locally, keeps user context on the machine by default, has no recurring API meter for core workflows, and turns messy daily input into reviewed tasks, drafts, memory, documents, and routines.

The product must move beyond developer/QA users into non-technical users:

- Parents and household operators.
- Students and learners.
- Small business owners.
- Creative professionals.
- Personal admin and document-heavy users.

## Repo truth to verify first

Before planning or editing, inspect:

- `AGENTS.md`
- `CLAUDE.md`
- `README.md`
- `cockpit/package.json`
- `cockpit/src/lib/nav.tsx`
- `cockpit/prisma/schema.prisma`
- `docs/haven-desk-strategy-report.md`
- `docs/haven-desk-a-to-z-roadmap.md`

Current app shape from prior context:

- Local Gemma through Ollama.
- No cloud LLM calls from the cockpit.
- Next.js cockpit with Prisma and SQLite.
- Existing surfaces include Dashboard, Tasks, Smart Inbox, Memory, Projects, Prompt Optimizer, Prompt Library, Email Writer, Brainstorming, Image, QA Pipeline, Gherkin Lint, Bug Report, Rubric Designer, Eval Cases, Code Review, ADR Writer, API Contract, Activity, and Settings.
- Open WebUI exists alongside the cockpit for local chat/RAG and project knowledge bases.

## Hard constraints

- Keep Ollama native on the host, never in Docker.
- Keep cockpit LLM calls local.
- Do not add cloud LLM calls.
- Do not commit secrets or local data.
- Respect save-after-review: persist the exact reviewed output, not a hidden rerun.
- Every model step that feeds durable state should be wrapped by deterministic validation where feasible.
- MCP is a bridge to local capabilities, not a bypass around cockpit permissions or reviewed saves.
- Plugins start as safe workflow packs before arbitrary runtime code.

## Documents already created

The strategy and roadmap live in:

- `docs/haven-desk-strategy-report.md`
- `docs/haven-desk-a-to-z-roadmap.md`
- `docs/haven-desk-clean-context-prompt.md`

Read them before proposing changes.

## Task

Build the complete monetization transition plan into implementation-ready work.

Produce or update repo docs that cover:

1. Product positioning and public narrative.
2. Persona-first information architecture.
3. First-run onboarding for non-technical users.
4. Plugin/pack manifest design.
5. First paid workflow packs.
6. MCP integration strategy.
7. Pricing, licensing, and packaging strategy.
8. Implementation phases with testable acceptance criteria.
9. Risks, non-goals, and guardrails.
10. A backlog that can be converted into issues.

## Recommended first implementation bets

1. Keep `Swiss Knife` as internal/repo name and use `Haven Desk` as public product name.
2. Reorganize public UX around Today, Capture, Write, Documents, Projects, Packs, and Settings.
3. Hide QA/dev tools inside a professional pack rather than removing them.
4. Build Small Business Ops as the first mass-market pack.
5. Package QA/Product Ops as the first professional paid pack.
6. Add a declarative `PluginManifest` and validator before runtime plugins.
7. Introduce MCP later as read-only and proposal-only local tools.

## Expected output

If in planning mode:

- Produce a decision-complete plan wrapped in `<proposed_plan>`.

If in default implementation mode:

- Create or update markdown docs under `docs/`.
- Keep changes docs-only unless explicitly asked for code.
- Use clear filenames.
- Do not modify app code unless asked.
- Validate with `git diff --check` and any cheap markdown/file checks available.

## Style

- Be direct and concrete.
- Use sentence case headings.
- Avoid hype.
- Avoid em dashes.
- Separate facts from assumptions.
- Keep high-stakes workflows read-only, cited, and approval-based.
```

## Suggested first follow-up command

After pasting the prompt above, ask:

```markdown
Read the Haven Desk docs and produce a decision-complete implementation plan for the first repo changes: public product docs, persona-first navigation plan, plugin manifest design, and the first two paid packs.
```

