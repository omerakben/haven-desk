# AGENTS.md — Codex partner brief for Swiss Knife

Read this first. `CLAUDE.md` (same repo) is the full source of truth with history and roadmap; this is the short version you need before touching code.

## What this is

Swiss Knife is a locally-run, private "daily cockpit" web app powered by local Gemma (via Ollama). The app we build lives in `cockpit/` — Next.js 15 (App Router), TypeScript strict, Prisma + SQLite, Tailwind 3 + shadcn/ui. Everything runs on the user's Mac. No cloud LLM calls come from the app itself.

## How we work together

Claude Code orchestrates and reviews. You (Codex, `gpt-5.5`) take delegated implementation tasks and return them green. Local Gemma 12B is the *app's* engine — drafting, summarizing, RAG Q&A — not your tooling and not where our coding work goes; heavy coding stays with Claude and you.

Finish a task with the tree green (gates below), commit per feature with conventional commits (`type(scope): description`), and never do feature work on `main`. Keep changes small so they roll back cleanly.

## Hard rules (do not violate)

1. Ollama runs natively on macOS, never in Docker. Containers reach the host engine via `host.docker.internal`. Containerized Ollama on a Mac is CPU-only (~5–6x slower).
2. Keep everything local. No cloud LLM calls from the cockpit — the point is privacy and zero per-task API cost.
3. Respect the tiering. Local Gemma 12B handles drafting, cleanup, summarizing, organizing, and RAG Q&A. Don't design app features that need more than a 12B can deliver.
4. Don't commit secrets or local data. `.env`, `*.db`, `node_modules/`, `cockpit/uploads/`, and `cockpit/projects/` are gitignored. Keep it that way.

## Conventions that matter

- Ollama access goes through `cockpit/src/lib/ollama.ts` (`chat`, `streamChat`, `chatJson`). Don't scatter raw fetches.
- Vision is counter-intuitive: `gemma4:e4b` has vision, `gemma4:12b-mlx` does not. Image input must use the native `/api/chat` `images: [base64]` path (`chatWithImages`), never the `/v1` `image_url` path.
- AI tools share a kit: a `"use client"` page renders `AiToolShell`; its API route health-gates with `assertOllamaReady()`, then returns `streamTextResponse({ messages, onComplete })` and persists in `onComplete`. The in-band error marker is `ERROR_SENTINEL`.
- DB access goes through the singleton in `cockpit/src/lib/db.ts`. Schema change = edit `prisma/schema.prisma`, then `npm run db:push`.
- Dark mode is next-themes (`attribute="class"`). Use theme tokens (`bg-background`, `text-muted-foreground`, `border-border`), not raw `neutral-*`.
- Effective model / baseUrl / temperature come from `getEffectiveConfig()` (Settings row → env → defaults). `PUT /api/settings` allowlists `baseUrl` to loopback / `host.docker.internal` — keep that SSRF guard.
- Every model step that feeds a gate is wrapped by a deterministic check (lint, score, or schema validation). Match that pattern when you add a tool.

## Quality gates (run from `cockpit/`)

- `npm run lint`
- `npm run test:unit` — Vitest, the real regression net for the deterministic libs
- `npm run test:e2e` — Playwright, route-mocked so it passes without Ollama
- `npm run build`

The app degrades gracefully when Ollama is down (health banner + 503 with guidance), so most work is buildable and testable without the model running.

## Pull docs, don't guess

Use the context7 MCP for version-accurate library docs (Next.js 15, Prisma, Tailwind, shadcn) rather than training memory. Use the playwright MCP (or `npm run test:e2e`) for UI checks.
