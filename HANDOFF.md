# HANDOFF — Take it to GitHub + Claude Code

This repo is ready to version-control and continue building in Claude Code.

> **Status (2026-06-04):** The foundation milestone has landed. The repo is
> already git-initialized locally (branch `foundation`, off `main`),
> `cockpit/node_modules` was cleaned and reinstalled on macOS, and the engine tag
> is `gemma4:12b-mlx`. Steps 1–2 below are done; they remain as reference for
> creating the GitHub remote and pushing.

## 1. First, clean up

A Linux `cockpit/node_modules/` may have been left by initial scaffolding. Remove it so a clean macOS install happens later:

```bash
rm -rf cockpit/node_modules
```

(It's gitignored, so it won't be committed either way — but deleting avoids a wrong-platform install if you run local dev.)

## 2. Initialize git + create the GitHub repo

**Option A — GitHub CLI (fastest):**
```bash
cd swiss-knife
git init
git add .
git commit -m "chore: scaffold Swiss Knife (Phase 0 + 1)"
gh repo create swiss-knife --private --source=. --push
```

**Option B — manual:**
```bash
cd swiss-knife
git init && git add . && git commit -m "chore: scaffold Swiss Knife (Phase 0 + 1)"
# create an empty repo named swiss-knife in the GitHub UI, then:
git remote add origin git@github.com:<you>/swiss-knife.git
git branch -M main
git push -u origin main
```

Branch per phase so rollbacks are trivial:
```bash
git checkout -b phase-2-prompt-library
```

## 3. Repo layout (monorepo-ready)

```
swiss-knife/
├─ CLAUDE.md            # agent context — read first
├─ HANDOFF.md           # this file
├─ README.md
├─ .mcp.json            # project-scoped MCP servers (Context7 + Playwright)
├─ .gitignore
├─ docker-compose.yml   # Open WebUI + cockpit (Ollama is native)
├─ start.sh             # one-command launcher
├─ scripts/
└─ cockpit/             # the Next.js app  ← app #1
```

It's already a clean monorepo root. If you later add more apps (e.g. a CLI or a shared package), move `cockpit/` to `apps/cockpit/`, add `packages/`, and adopt npm/pnpm workspaces. Not needed yet.

## 4. Wire up MCP servers in Claude Code

`.mcp.json` is committed, so when you open this repo in Claude Code it will offer to enable **Context7** (current, version-accurate library docs) and **Playwright** (browser automation / E2E tests) automatically. If you prefer to add them by hand:

```bash
# Context7 — up-to-date docs for whatever library you're coding against
claude mcp add context7 -- npx -y @upstash/context7-mcp@latest
#   (optional higher rate limits: append  --api-key YOUR_KEY)

# Playwright — drive a real browser, write/run E2E tests
claude mcp add playwright -- npx @playwright/mcp@latest
npx playwright install            # install browser binaries

# verify
claude mcp list
```

Tip: say "use context7" / "use Playwright MCP" explicitly in prompts, or Claude may fall back to guesswork / raw bash.

## 5. Recommended plugins / skills to add

- **Next.js / frontend practices** — add a Next.js or React skill so Claude Code follows current App-Router patterns (see the skills widget in chat).
- **Local LLM / Ollama** — search the plugin marketplace inside Claude Code (`/plugin` or the marketplace) for an Ollama / local-LLM builder plugin if you want preset workflows.
- Keep `CLAUDE.md` current — it's the single highest-leverage file for steering the agent.

## 6. Good first prompts for Claude Code

- "Read CLAUDE.md. Then build Phase 2: a prompt library page that lists saved prompts from SQLite with search and copy-to-clipboard. use context7 for Next.js App Router."
- "Add an email-writer tool under src/app/tools/email-writer with an API route, reusing src/lib/ollama.ts."
- "Write a Playwright MCP test that loads the dashboard and runs the prompt optimizer end-to-end."
