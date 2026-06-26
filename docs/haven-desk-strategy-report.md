# Haven Desk strategy report

Date: 2026-06-26

## Executive recommendation

Haven Desk should not be positioned as a cheaper ChatGPT, a local chat clone, or a developer-only QA cockpit. The winning position is:

> Private AI for the work of daily life.

Haven Desk should become a local-first AI operations desk that helps non-technical users manage daily administration, documents, writing, research, tasks, and repeatable business workflows without sending their private context to a cloud LLM by default.

The durable advantage is not only local inference. By 2027, local/on-device AI will be common across Apple, Microsoft, Google, browsers, and open-source tooling. Haven Desk wins only if it packages local AI into trusted workflows:

- Local data and memory.
- No recurring API meter for core use.
- Offline usefulness.
- Human-reviewed actions.
- Save-after-review persistence.
- Deterministic checks around model output.
- Industry-specific plugins and packs.

The product should move from "Swiss Knife, the developer cockpit" to "Haven Desk, the private AI daily runner."

## Current product truth

The current Swiss Knife repo already has the right foundation for this transition:

- Local Gemma through Ollama, with no cloud LLM calls from the cockpit.
- Next.js cockpit with SQLite, local data, and project scoping.
- Prompt Optimizer, Prompt Library, Email Writer, Brainstorming, Tasks, Smart Inbox, Memory, Image, Projects, Activity, and Settings.
- QA and developer tools: QA Pipeline, Gherkin Lint, Bug Report, Rubric Designer, Eval Cases, Code Review, ADR Writer, and API Contract.
- Open WebUI integration for chat, document RAG, prompt sync, and project knowledge bases.
- Save-after-run and deterministic gate patterns already established in the codebase.

This means the strategy is not "build an AI app from scratch." The strategy is to package, rename, simplify, and verticalize the current platform around daily outcomes.

## Strategic positioning

### Product name

Recommended public name: Haven Desk

Internal name can remain Swiss Knife for the repo or developer edition. Haven Desk is more mass-market:

- "Haven" signals privacy, safety, and ownership.
- "Desk" signals daily work, files, tasks, admin, and action.
- It avoids sounding like a developer tool or a generic AI chatbot.

### Tagline

Private AI for the work of daily life.

### One-sentence pitch

Haven Desk turns your local files, notes, tasks, and routines into a private AI workspace that runs on your computer, drafts useful work, organizes the day, and asks before taking action.

### Value proposition

For individuals, families, students, creators, and small businesses who want AI help with real-life work but do not want to upload sensitive context into cloud chatbots, Haven Desk is a local-first AI daily runner that keeps data on the user's machine, works without per-token API costs, and packages AI into repeatable, reviewable workflows.

### What not to claim

Do not claim:

- "Better than ChatGPT."
- "Autonomous agent that handles your life."
- "Legal, medical, tax, or financial advice."
- "Enterprise-ready" before admin, auth, update, backup, and deployment controls are real.
- "Private like Apple" unless every external connector, sync, or cloud path is explicit and off by default.

Use this instead:

- "Private by default."
- "Runs locally."
- "Drafts and organizes."
- "You review before anything is saved or sent."
- "Built for repeatable workflows, not just chat."

## Market opportunity

AI chatbot usage is mainstream, but paid consumer AI is still narrow. That creates a clear product requirement: Haven Desk must sell visible daily utility, not abstract AI access.

The best wedge is not "local LLM enthusiasts." The best wedge is users with private recurring context:

- Local files.
- Receipts.
- School notes.
- Client notes.
- Contracts.
- Health-adjacent admin.
- Business operations.
- Email drafts.
- Family schedules.
- Project tasks.

Those users need help, but they hesitate to paste everything into cloud assistants. That hesitation becomes Haven Desk's opening.

## Target personas and daily runner use cases

### 1. Household operator

Audience:

- Parents.
- Caregivers.
- Busy couples.
- Adult children helping family members.

Daily pain:

- School emails, appointments, forms, shopping, meal planning, bills, renewals, household tasks, and "what am I forgetting?"

Haven Desk job:

- Turn captures and notes into tasks.
- Build daily and weekly family briefs.
- Create grocery and meal plans.
- Track document deadlines.
- Summarize local PDFs or screenshots.
- Draft polite messages to schools, services, landlords, or support desks.

Why local matters:

- Family admin often touches private schedules, health-adjacent notes, school details, finances, addresses, and IDs.

Willingness to pay:

- $8-$15/month individual.
- $15-$25/month household plan if setup is easy and calendar/file integration is reliable.

### 2. Small business owner

Audience:

- Solo operators.
- Freelancers.
- Small agencies.
- Local services.
- Independent consultants.

Daily pain:

- Follow-ups, proposals, receipts, invoices, customer replies, SOPs, job notes, vendor docs, and project status.

Haven Desk job:

- Convert meeting notes into tasks and follow-up emails.
- Draft proposals and client updates.
- Organize receipts and files.
- Build SOPs from rough notes.
- Prepare daily business brief.
- Track open loops by project.

Why local matters:

- Client details, quotes, pricing, contracts, customer lists, and operational notes can be sensitive.

Willingness to pay:

- $19-$49/month for a solo business license.
- More for setup, vertical packs, and support.

### 3. Student or learner

Audience:

- College students.
- Certification learners.
- Self-directed learners.
- Professionals retraining into AI, software, healthcare admin, finance, or operations.

Daily pain:

- Notes, PDFs, deadlines, assignments, quizzes, unclear concepts, study plans, and exam prep.

Haven Desk job:

- Build study plans from syllabus files.
- Explain local notes and PDFs.
- Generate quizzes.
- Track assignments.
- Create review summaries.
- Convert lectures or voice notes into study artifacts.

Why local matters:

- Works offline, lowers cost anxiety, and keeps personal learning records local.

Willingness to pay:

- $6-$12/month student pricing.
- Annual discounted license likely works better than high monthly pricing.

### 4. Creative professional

Audience:

- Writers.
- Designers.
- Content creators.
- Marketers.
- Independent consultants.

Daily pain:

- Briefs, drafts, repurposing, client context, tone matching, campaign planning, and organizing ideas.

Haven Desk job:

- Create campaign briefs.
- Repurpose a draft into email, LinkedIn, blog, and short-form variants.
- Store client style rules locally.
- Turn screenshots or notes into structured creative tasks.
- Maintain a reusable prompt and template library.

Why local matters:

- Client work, unreleased ideas, drafts, strategy, and personal voice stay on the user's machine.

Willingness to pay:

- $15-$30/month if the creative workflow saves time every week.

### 5. Personal documents and admin user

Audience:

- People managing insurance, tax prep, immigration/admin paperwork, warranties, benefits, medical bills, job search documents, or home projects.

Daily pain:

- "Where is the right document?"
- "What deadline matters?"
- "What do I need before calling support?"
- "How do I draft this message?"

Haven Desk job:

- Local document Q&A with citations.
- Deadline extraction.
- Checklist generation.
- Support-call prep.
- Draft letters and forms.
- Keep a local paper trail by project.

Why local matters:

- These are exactly the documents users should not casually paste into cloud chat.

Willingness to pay:

- $15-$30/month for personal admin.
- $20-$40/month if the product becomes a reliable document cockpit with citations and checklists.

## Product shape

Haven Desk should be organized around jobs, not tools.

### Current tool categories

Current repo categories are developer-friendly:

- Work.
- Write.
- QA and evals.
- Dev.
- System.

### Mass-market categories

Recommended public categories:

- Today: daily brief, open loops, due items, pending reviews.
- Capture: drop notes, screenshots, audio, files, inbox text.
- Write: email, messages, proposals, summaries, creative drafts.
- Documents: ask local files, extract deadlines, prepare packets.
- Projects: family, school, business, client, legal/admin, learning.
- Packs: install persona or industry workflows.
- Settings: model, privacy, backup, local integrations.

Developer and QA tools can remain, but they should be moved into a "Professional packs" area rather than leading the first-run experience.

## Product principles

### 1. Local-first by default

The core app should work with local models, local files, and local storage.

Cloud sync, cloud inference, or external connectors may exist later, but they must be:

- Off by default.
- Clearly labeled.
- Auditable.
- Permissioned.
- Reversible.

### 2. Human-reviewed actions

Haven Desk should propose, draft, extract, classify, and organize. It should not silently act.

Default write pattern:

1. User captures or asks.
2. Model drafts or classifies.
3. Deterministic gate checks where possible.
4. User reviews.
5. Save exact reviewed output.
6. Log activity.

### 3. Deterministic gates around local model weaknesses

Local 4B-12B models are useful but not magic. The app should wrap them with:

- Schema validation.
- Citation requirements.
- Checklist completeness checks.
- Score/rubric gates.
- Date parsing gates.
- OpenAPI/Gherkin/ADR lint gates.
- CSV/math checks for finance-like workflows.

### 4. Plugins should be workflow packs first

Plugins should not start as arbitrary code execution.

Maturity ladder:

- L0 project pack: templates, memory facts, tasks, prompts, knowledge links.
- L1 cockpit tool: UI, API route, storage, deterministic gate.
- L2 local MCP or OpenAPI server: read resources and propose actions.
- L3 automation: watched folders, scheduled routines, approval queues.

### 5. MCP is the bridge, not the source of truth

The cockpit remains source of truth for:

- Projects.
- Tasks.
- Memory.
- Saved prompts and drafts.
- Review state.
- Activity logs.
- Plugin install state.
- Local privacy rules.

MCP exposes approved resources and tools to local agents and Open WebUI. MCP should not bypass the cockpit's reviewed-save and human-accept flows.

## Plugin and pack strategy

### Plugin contract

Haven Desk should define a `PluginManifest` with:

- `slug`
- `name`
- `version`
- `industry`
- `audience`
- `maturity`
- `capabilities`
- `requiredModels`
- `templates`
- `memoryFacts`
- `taskSeeds`
- `knowledgeSources`
- `gates`
- `routes`
- `mcpTools`
- `permissions`
- `setupChecks`

For v1, this can be a TypeScript type plus a deterministic validator. It does not need a marketplace on day one.

### Initial packs

#### Household secretary pack

Promise:

- Keep home admin under control.

Includes:

- Daily family brief.
- School message drafter.
- Appointment prep checklist.
- Meal and grocery planner.
- Home document tracker.
- Renewal reminder templates.

#### Student tutor pack

Promise:

- Turn local study materials into a private tutor.

Includes:

- Syllabus importer.
- Study plan generator.
- Quiz builder.
- Notes explainer.
- Assignment tracker.
- Exam review routine.

#### Small business ops pack

Promise:

- Run admin without hiring an assistant.

Includes:

- Proposal writer.
- Follow-up drafter.
- Meeting notes to tasks.
- SOP builder.
- Receipt and invoice organizer.
- Weekly business review.

#### Creative studio pack

Promise:

- Turn ideas and client context into finished drafts.

Includes:

- Campaign brief.
- Repurpose draft.
- Client tone memory.
- Content calendar.
- Creative feedback checklist.
- Asset notes from screenshots.

#### Legal and admin pack

Promise:

- Organize paperwork and prepare next steps.

Includes:

- Document checklist.
- Deadline extractor.
- Support-call prep.
- Clause review checklist.
- Evidence packet builder.
- Draft letter generator.

Guardrail:

- Must be marketed as admin support, not legal advice.

#### Fitness and nutrition pack

Promise:

- Plan meals, workouts, and habits privately.

Includes:

- Meal planner.
- Grocery list.
- Workout schedule.
- Habit tracker.
- Preference memory.
- Progress reflection.

Guardrail:

- Must avoid diagnosis, treatment, or medical claims.

#### QA and product ops pack

Promise:

- Turn requirements into reliable acceptance artifacts.

Includes:

- Existing QA Pipeline.
- Gherkin Lint.
- Rubric Designer.
- Eval Cases.
- Bug Report.
- Release readiness checklist.

This remains the best early paid prosumer pack because the current product already has strong primitives here.

## Monetization framework

### Model 1: Consumer pro license

Target:

- Individuals, parents, students, creators, and personal admin users.

Free tier:

- Local install.
- One project.
- Basic tasks.
- Prompt tools.
- Limited memory.
- Manual export/import.
- Local model setup.

Paid tier:

- $8-$15/month.
- $79-$149/year.

Paid features:

- Unlimited projects.
- Advanced memory.
- Document workflows.
- Voice and quick capture.
- Automation routines.
- Premium packs.
- Better onboarding and setup assistant.
- Scheduled local backups.
- Theme and personalization.

Risk:

- Generic drafting is heavily commoditized.

Mitigation:

- Sell daily routines, document privacy, and pack outcomes, not chat.

### Model 2: B2B and prosumer local business edition

Target:

- Freelancers.
- Agencies.
- QA teams.
- small professional offices.
- Local service businesses.

Pricing:

- $19-$49/month for solo business.
- $12-$29/user/month for small teams.
- $499-$2,500/year for local team license.

Paid features:

- Shared project packs.
- Local network deployment.
- Review queues.
- Audit logs.
- Backup policy.
- Role templates.
- Policy controls.
- Installer support.
- Priority support.

Risk:

- Support burden increases quickly across Mac, Windows, Ollama, Docker, backups, LAN exposure, and local model performance.

Mitigation:

- Start with "solo business" and "small team local license" before enterprise claims.

### Model 3: Hybrid freemium plus paid packs

Target:

- Free local AI users who will not pay for chat, but will pay for a finished workflow.

Core idea:

- The base app is useful and local.
- Revenue comes from workflow packs, premium installers, support, and vertical implementation.

Pack pricing:

- $49-$199 consumer packs.
- $199-$499 professional packs.
- $1,000-$10,000 setup for small businesses with repeatable workflows.
- $100-$500/month support retainer for maintained packs and local ops.

Examples:

- "Small business ops pack."
- "QA acceptance pack."
- "Student exam prep pack."
- "Family admin pack."
- "Document admin pack."

Risk:

- Bespoke consulting can swallow product focus.

Mitigation:

- Only accept service work that turns into reusable pack assets.

## Competitive positioning

### Against ChatGPT and OpenAI

OpenAI will win:

- Frontier model quality.
- General agents.
- Broad brand awareness.
- Connectors.
- Coding.
- Cloud workflows.

Haven Desk should win:

- Local private files.
- No per-task meter.
- User-owned data.
- Repeatable local workflows.
- Transparent reviewed saves.
- Offline useful tasks.

Positioning:

- "Use ChatGPT when you need the strongest general model. Use Haven Desk when the work depends on private local context and repeatable reviewable workflows."

### Against Google and Microsoft

Google and Microsoft will win:

- Built-in distribution.
- Gmail, Docs, Office, Teams, Outlook, Drive, Search.
- Enterprise bundles.

Haven Desk should win:

- Cross-account local workspace.
- User-owned project memory.
- Non-enterprise personal admin.
- No tenant lock-in.
- Local-only sensitive workflows.

Positioning:

- "Your private layer across files, notes, and projects, without committing your life to one cloud suite."

### Against Apple

Apple will win:

- On-device system integration.
- Privacy brand.
- Native OS capabilities.

Haven Desk should win:

- Cross-platform Mac and Windows support.
- Workflow packs.
- Power-user local automation.
- Open local model ecosystem.
- Project-level memory and tools.

Positioning:

- "A workflow cockpit on top of local AI, not just OS-level assistance."

### Against Ollama, LM Studio, AnythingLLM, and Open WebUI

Local AI apps will win:

- Free local chat.
- Model experimentation.
- RAG utilities.
- Developer mindshare.

Haven Desk should win:

- Daily tasks.
- Capture.
- Workflows.
- Packaged outcomes.
- Review gates.
- Local activity history.
- Vertical templates.

Positioning:

- "Not another local chat box. A private workflow desk that uses local models."

## Distribution strategy

### Phase 1 distribution

Audience:

- Local AI enthusiasts.
- QA/product ops teams.
- Solo consultants.
- privacy-conscious power users.

Channels:

- GitHub.
- Indie Hacker/Product Hunt style launch.
- YouTube demos.
- LinkedIn build-in-public.
- Local-first AI communities.
- QA/SDET communities.

Offer:

- Free local app.
- Paid Pro license.
- First paid packs.

### Phase 2 distribution

Audience:

- Non-technical small business owners.
- Students.
- Families.
- Creators.

Channels:

- Simple website.
- Persona-specific landing pages.
- Installer download.
- Short workflow demos.
- Pack marketplace.
- Partnerships with consultants or local IT support providers.

Offer:

- "Get useful in 10 minutes."
- "Your files stay on your computer."
- "No AI API bill."

## Key risks

### Setup friction

Risk:

- Non-technical users may not tolerate Docker, Ollama, model downloads, ports, and local troubleshooting.

Response:

- Build a one-click desktop installer.
- Hide developer terms.
- Provide health checks with plain-language fixes.
- Make first-run workflow useful before advanced configuration.

### Local model quality

Risk:

- A 4B-12B local model may fail on complex reasoning.

Response:

- Keep local model jobs bounded.
- Use deterministic gates.
- Prefer extraction, drafting, summarization, classification, planning, and checklist generation.
- Keep high-stakes outputs cited and reviewed.

### Cloud competitors copy local features

Risk:

- Apple, Google, Microsoft, and OpenAI will improve local/on-device features.

Response:

- Do not rely only on "local."
- Build workflow packs, review state, local memory, exportable artifacts, and trusted action flows.

### Plugin security

Risk:

- MCP and plugins can become a prompt injection and arbitrary-action surface.

Response:

- Make plugins declarative first.
- Bind local servers to `127.0.0.1`.
- Use header tokens.
- Prefer read-only and proposal-only MCP tools.
- Log every action.
- Require approval for mutations.

### Tool sprawl

Risk:

- The app becomes a drawer of unrelated tools.

Response:

- Organize by persona jobs.
- Hide advanced/pro tools behind packs.
- Make Today, Capture, Documents, Projects, and Packs the mass-market core.

## Near-term priority

The next serious milestone should be:

> Turn Swiss Knife into a packaged Haven Desk prototype with a public narrative, a persona-first home, a plugin/pack system design, and two end-to-end paid workflow packs.

Recommended first two paid packs:

1. Small business ops pack.
2. QA and product ops pack.

Reason:

- Small business proves the non-developer daily-driver transition.
- QA/product ops monetizes the current strongest product primitives.

