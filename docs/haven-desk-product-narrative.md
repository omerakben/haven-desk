# Haven Desk product narrative

Date: 2026-06-26

This document is the canonical public positioning for Haven Desk. It is the five-minute read for a buyer, early adopter, or new contributor who needs the product story before touching the codebase or the strategy docs.

---

## What Haven Desk is

Haven Desk is a private AI daily runner that lives on your computer. It takes the messy input of daily life (voice notes, pasted tickets, email threads, document snippets, task ideas) and turns that input into reviewed drafts, organized tasks, searchable memory, and repeatable routines, all without uploading your data to a cloud service.

The product runs on a local Gemma model through Ollama. No API key is required for core workflows. No cloud LLM sees your text by default. The inference happens on your machine, the database is a local SQLite file, and the files you capture stay in a local uploads folder.

The cockpit is a Next.js web app (port 4141 in Docker, 3000 in local dev) backed by Prisma and SQLite. It connects to Ollama at `localhost:11434`. Everything that stores or acts on your data goes through an explicit review step before it is saved.

For deeper context on the engineering roadmap, see `docs/haven-desk-engineering-roadmap.md`. For the full strategic analysis that produced this positioning, see `docs/haven-desk-strategy-report.md`.

---

## What Haven Desk is not

- Not a ChatGPT wrapper or a cloud AI subscription with a local UI skin.
- Not an autonomous agent that acts without your review. Every draft is a proposal until you save it.
- Not a legal, medical, financial, or tax advisor. High-stakes packs (legal admin, fitness, finance) produce checklists and draft letters for human review, not binding decisions.
- Not enterprise software (yet). There is no team admin panel, SSO, audit log, or central deployment system in the current build. The canon labels enterprise claims off-limits until those controls are real.
- Not a developer-only tool. The QA and developer tools are grouped into professional packs. The mass-market surface is designed for non-technical users.
- Not a replacement for Open WebUI or Ollama's own interfaces. Open WebUI (port 4142) handles free-form chat, document RAG, and prompt sync. Haven Desk handles structured daily workflows on top of the same local model.

---

## Tagline and one-line pitch

**Tagline:** Private AI for the work of daily life.

**One-line pitch:** Haven Desk turns your local files, notes, tasks, and routines into a private AI workspace that runs on your computer, drafts useful work, organizes the day, and asks before taking action.

---

## The five target personas

Each persona is described by their daily job and a realistic willingness-to-pay band, drawn from the canon.

### 1. Household operator

Parents, caregivers, busy couples, adult children managing family logistics. Their daily job is capturing school messages, tracking appointment deadlines, drafting polite replies to services, building grocery lists, and running a weekly family brief. They will pay $8 to $15 per month for an individual plan or $15 to $25 for a household plan. They choose Haven Desk because they do not want family health notes, school records, or care schedules going into a cloud chatbot.

### 2. Small business owner

Solo operators, freelancers, small agencies, and local service businesses. Their daily job is turning meeting notes into tasks and follow-ups, writing proposals, building SOPs, organizing receipts, and running a weekly business review. They will pay $19 to $49 per month as a solo business. They also pay for setup services ($1,000 to $10,000 for a configured pack) and ongoing support retainers ($100 to $500 per month). They choose Haven Desk because their client lists, pricing, and supplier details are not for cloud logging.

### 3. Student or learner

College students, certification candidates, career-changers, and self-directed learners. Their daily job is importing a syllabus and building a study plan, getting local notes explained, generating quizzes, tracking assignments, and running exam reviews. They will pay $6 to $12 per month, and an annual license fits better than a high monthly price. They choose Haven Desk because it works offline on a laptop and costs less than a general-purpose AI subscription for one recurring use case.

### 4. Creative professional

Writers, designers, content creators, marketers, and consultants. Their daily job is writing campaign briefs, repurposing one draft into multiple formats, maintaining client tone memory, and managing a content calendar. They will pay $15 to $30 per month. They choose Haven Desk because local client tone memory and draft history are not things they want stored on a vendor's servers.

### 5. Personal documents and admin user

People managing insurance, tax prep, immigration paperwork, warranties, benefits, medical bills, job searches, and home projects. Their daily job is asking questions against local documents with citations, extracting deadlines, building checklists for support calls, and drafting letters. They will pay $15 to $30 per month, rising to $20 to $40 per month for a reliable document cockpit that handles sensitive personal paperwork. They choose Haven Desk because these documents contain some of the most sensitive personal information a person holds.

---

## Local-first trust promise

Three concrete facts govern the trust promise. They are not aspirational; they are verifiable in the current codebase.

**What stays on the machine.** The SQLite database (`cockpit/prisma/dev.db`) is local. Uploads and project pack content live in gitignored local directories. The Ollama model files live in `~/.ollama`. No inference request leaves the machine through the cockpit. The `PUT /api/settings` endpoint allowlists `baseUrl` to loopback addresses and `host.docker.internal` only; any attempt to point the model at a remote host returns a 400 (SSRF guard).

**Review before save.** AI tool routes stream a draft to the screen. Saving is a separate, explicit action that stores the reviewed payload verbatim. The codebase never re-runs the model at save time and never persists output silently in an `onComplete` callback. This pattern is called save-after-review in the codebase and is enforced across Prompt Optimizer, Email Writer, Bug Report, and every new tool route.

**Deterministic gates in plain language.** Before any model output is treated as durable (stored, scored, or acted on), a deterministic check runs first. In plain terms: the code checks the output by rules, not by asking the model to verify itself. Current gates include Gherkin Lint (checks that a feature file has the right structure), ADR Lint (checks that an architecture decision record has all required sections), OpenAPI Lint (validates an API spec against the real schema offline), Rubric (scores a feature file against a weighted rubric and returns a pass/block verdict), Code Smells (static cyclomatic complexity and nesting scan), and Cosine Dedupe (compares memory facts by embedding similarity before inserting a duplicate).

These gates follow a consistent pattern: they return `{ issues, summary, ok }`, use ERROR for blocking problems and WARN for advisory ones, and run in milliseconds with no model call.

---

## Competitive positioning

Four one-liners, one for each competitive cluster, drawn directly from the canon.

**vs ChatGPT / OpenAI:** Use ChatGPT for the strongest general model. Use Haven Desk when the work depends on private local context and repeatable, reviewable workflows.

**vs Google Workspace / Microsoft 365:** Haven Desk is your private layer across files, notes, and projects, without committing your life to one cloud suite.

**vs Apple Intelligence:** Haven Desk is a workflow cockpit on top of local AI, not just OS-level assistance.

**vs Ollama, LM Studio, AnythingLLM, Open WebUI:** Haven Desk is not another local chat box. It is a private workflow desk that uses local models.

The common thread in all four: local model inference is table stakes by 2027. The durable advantage is packaging that inference into trusted, structured, human-reviewed workflows for specific daily jobs.

---

## What we claim vs what we never claim

**We claim:**

- Private by default. Data stays on the machine.
- Runs locally. No API key required for core workflows.
- Drafts and organizes. The model proposes; the user decides.
- You review before anything is saved or sent.
- Built for repeatable workflows, not just chat.
- Works offline for most tasks (Ollama must be running; the internet is not required).
- No recurring per-token cost for core use.

**We never claim:**

- Better than ChatGPT on model quality.
- Autonomous. The system does not act without your review in v1.
- Legal, medical, tax, or financial advice.
- Enterprise-ready before team admin, SSO, audit logging, and deployment controls exist.
- "Private like Apple" unless every external connector (Open WebUI sync, MCP tools, capture routes) is explicit and off by default.
- Zero risk. A local SQLite file can be copied. A capture token can be shared. Privacy is a property of the system design, not an absolute guarantee.

The distinction matters most at sales time. Overclaiming privacy or autonomy creates liability and breaks trust faster than any competitor.

---

## The category we want to own

**Private AI daily runner.**

Supporting phrases in decreasing order of preference:
- Local AI operations desk
- Private workflow cockpit
- Reviewable AI for daily work

The category claim is narrow by design. "Private AI assistant" is too broad; it describes ChatGPT with a privacy policy. "Local AI" is a technology claim, not a job claim. "Private AI daily runner" names both the privacy guarantee and the recurring daily use case, which is the use case that generates subscription revenue.

The product wins this category by being the first local AI product that non-technical users can run for a specific daily job, complete with structured workflows, memory, and pack-based onboarding, without a cloud account, an API key, or a developer setup session.

For the full pack catalog and maturity ladder that backs this claim, see `docs/haven-desk-plugin-pack-spec.md`. For the pricing tiers and monetization model, see `docs/haven-desk-monetization-plan.md`.
