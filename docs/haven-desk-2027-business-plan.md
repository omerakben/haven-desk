# Haven Desk 2027 business plan

Date: 2026-06-27

This plan turns the existing Haven Desk product direction into a commercial plan for the 2027 market. It builds on the current repo strategy docs: `haven-desk-product-narrative.md`, `haven-desk-strategy-report.md`, `haven-desk-monetization-plan.md`, `haven-desk-plugin-pack-spec.md`, and `haven-desk-release-readiness-audit.md`.

All prices and conversion targets below are assumptions to validate in beta, not commitments.

## 1. Executive summary & core value proposition

- Market position: Haven Desk should own the category "private AI daily runner" for people and small teams who want AI help with real daily work but do not want their private context living inside a cloud chatbot.
- Elevator pitch: Haven Desk runs on your computer, learns from the notes, files, projects, and routines you approve, and turns messy input into reviewed drafts, tasks, checklists, and follow-ups without sending core work to a cloud LLM by default.
- The 2027 thesis:
  - AI agents will be embedded into mainstream software. Gartner projects that 40% of enterprise applications will include task-specific agents by 2026, with collaborative agents becoming more common by 2027: https://www.gartner.com/en/newsroom/press-releases/2025-08-26-gartner-predicts-40-percent-of-enterprise-apps-will-feature-task-specific-ai-agents-by-2026-up-from-less-than-5-percent-in-2025
  - Local AI hardware will be normal, not exotic. IDC forecast AI PCs growing to more than 167 million units in 2027 and nearly 60% of all PC shipments: https://www.businesswire.com/news/home/20240207779602/en/IDC-Forecasts-Artificial-Intelligence-PCs-to-Account-for-Nearly-60-of-All-PC-Shipments-by-2027
  - Small businesses are already crossing the AI adoption line. The U.S. Chamber reported that 58% of small businesses use generative AI, up from 40% in 2024 and 23% in 2023: https://www.uschamber.com/technology/empowering-small-business-the-impact-of-technology-on-u-s-small-business
  - The hard part is not access to AI. It is workflow adoption, governance, and ROI. McKinsey reports broad AI use but uneven scaling, with most organizations still not embedding AI deeply enough into workflows: https://www.mckinsey.com/capabilities/quantumblack/our-insights/the-state-of-ai
  - Agent hype will punish vendors without guardrails. Gartner also predicts that over 40% of agentic AI projects will be canceled by the end of 2027 due to cost, unclear business value, or inadequate risk controls: https://www.gartner.com/en/newsroom/press-releases/2025-06-25-gartner-predicts-over-40-percent-of-agentic-ai-projects-will-be-canceled-by-end-of-2027
- Core value proposition:
  - For non-technical users: "Get AI help with family, work, school, and paperwork without learning prompt engineering."
  - For small businesses: "Turn notes into follow-ups, SOPs, tasks, and weekly reviews without hiring an assistant or leaking client context."
  - For professional teams: "Use AI on sensitive specs and documents through local, reviewable workflows with deterministic checks."
- Why a customer buys:
  - Privacy: They have context they do not want to paste into cloud chat.
  - Workflow: They want finished artifacts, not another blank chat box.
  - Cost control: Local inference reduces per-token anxiety for routine work.
  - Trust: The app proposes, the user reviews, then the app saves or exports.
  - Specificity: Packs make the product useful for a role on day one.
- Ultimate 2027 market position:
  - Not "cheaper ChatGPT."
  - Not "local chat for hobbyists."
  - Not "autonomous life agent."
  - Haven Desk is the local-first workflow layer between personal context and useful output.
- Strategic objective by the end of 2027:
  - Ship a signed installer and first-run flow that gets a non-technical user to a saved outcome in under 10 minutes.
  - Convert the current toolset into persona packs with clear paid value.
  - Prove two paid wedges: Small Business Ops for mainstream revenue and QA/Product Ops for technical privacy-sensitive revenue.
  - Establish a pack economy that can grow without turning the core app into unsafe arbitrary plugin execution.

## 2. Target market analysis (2027)

- Segment 1: Solo operators and small business owners.
  - Examples: freelancers, consultants, local services, small agencies, family businesses, real estate operators, independent repair/service businesses.
  - 2027 pain:
    - AI is everywhere, but their work still lives across email, notes, screenshots, invoices, client messages, PDFs, calendars, and memory.
    - They do not have time to prompt, reformat, copy between tools, or build automations.
    - Client context, pricing, quotes, and operational notes are sensitive.
    - Hiring a real assistant is expensive, and generic AI tools do not know their business unless they paste everything into them.
  - Haven Desk solution:
    - Small Business Ops pack: meeting notes to tasks, follow-up email, proposal draft, SOP builder, weekly review, receipt/invoice checklist.
    - Project memory for business tone, service rules, recurring clients, and operating preferences.
    - Review-before-save actions that keep the owner in control.
    - Local-first operation so customer and pricing context stay on the owner's machine.
  - Why they buy:
    - They see a direct replacement for 2 to 5 hours per week of admin drag.
    - They get a recurring weekly ritual, not a novelty chatbot.
    - They can justify $29 to $49 per month if it creates follow-ups and task lists they actually use.
  - Required proof before broad marketing:
    - A first meeting-notes-to-tasks workflow that creates real Task proposals, not just prose.
    - A weekly review that pulls from real tasks, notes, and saved output.
    - 5 to 10 paid pilots who still use the product after 30 days.

- Segment 2: Household and personal-admin operators.
  - Examples: parents, caregivers, busy couples, adult children helping family, people managing insurance, warranties, support tickets, school paperwork, job search, immigration/admin paperwork, or health-adjacent documents.
  - 2027 pain:
    - Household administration is becoming more digital and more fragmented.
    - The information is too private for casual cloud prompting: school records, appointment notes, addresses, family schedules, bills, and medical-adjacent context.
    - People do not want "AI productivity." They want to know what they owe, who needs a reply, and what deadline they are about to miss.
  - Haven Desk solution:
    - Household Secretary pack: school/service message drafter, family weekly brief, grocery and meal plan, appointment prep checklist, renewal reminders, support-call prep.
    - Local document and capture flow for screenshots, PDFs, receipts, and notes.
    - Plain-language help wizard that explains and navigates without pretending to execute unsupported actions.
    - High-stakes guardrails that frame the product as admin support, not legal, medical, tax, or financial advice.
  - Why they buy:
    - They want relief from open loops and paperwork anxiety.
    - They trust a local-first assistant more for family context.
    - They can accept $99 to $179 per year if the installer is simple and the product shows weekly value.
  - Required proof before broad marketing:
    - A non-technical person can install it without terminal knowledge.
    - First-run onboarding produces one saved family/personal outcome in under 10 minutes.
    - The app can explain its privacy boundary in plain language.

- Segment 3: Privacy-sensitive professional teams.
  - Examples: QA managers, product managers, technical leads, consultants, compliance-heavy internal teams, agencies handling client strategy.
  - 2027 pain:
    - They want AI speed but cannot paste internal specs, defects, logs, designs, contracts, or client briefs into unmanaged cloud tools.
    - Agentic tools are proliferating, but governance and auditability are weak.
    - They need repeatable artifacts and evidence, not one-off chat answers.
  - Haven Desk solution:
    - QA/Product Ops pack: story to Gherkin, deterministic Gherkin lint, rubric scoring, bug report writer, eval cases, release-readiness checklist.
    - Local project memory and glossary facts.
    - Deterministic checks around model output, matching the current codebase pattern.
    - Offline or local-team license option for buyers who will not accept cloud account checks.
  - Why they buy:
    - They can use AI where policy blocks cloud assistants.
    - They get a repeatable workflow and artifacts reviewers can inspect.
    - A $999 to $2,500 annual local team license is easier to justify than a data-policy exception.
  - Required proof before broad marketing:
    - One technical preview customer uses the QA flow on real but non-proprietary work.
    - The pack produces artifacts that save review time and reduce rework.
    - Team license and local license-file flow exist before money changes hands.

## 3. Product roadmap & feature recommendations

- Feature 1: Frictionless installer and first-run value path.
  - Why it matters: The release-readiness audit says the product is demo-ready for technical users but not closed-alpha ready for non-technical users because setup still requires terminal, Docker, native Ollama, model pulls, and troubleshooting.
  - What to build:
    - Signed macOS installer and Windows installer after a simpler `.command`/`.cmd` bridge proves the flow.
    - `./swiss doctor` style checks surfaced as plain-language setup cards.
    - Persona picker: Household, Small business, Student, Creative, Personal admin, QA/Product Ops.
    - First guided workflow per persona.
    - "Time to first saved result" instrumentation stored locally.
  - 2027 dominance requirement:
    - A non-technical user should go from download to one useful saved output in under 10 minutes.
    - Target metric: 80% install success in observed beta sessions, 60% first saved output completion, 30% week-two return.
  - Commercial impact:
    - Unlocks household and small-business acquisition.
    - Reduces support burden.
    - Makes paid pilots scalable.

- Feature 2: Pack marketplace and pack studio.
  - Why it matters: Local AI will be commoditized by 2027. Packs are the product's commercial moat because they turn general local inference into role-specific outcomes.
  - What to build:
    - InstalledPack model with per-project install state.
    - In-app pack discovery and install flow.
    - Paid pack license checks that never lock the user's local data.
    - Pack Studio for building templates, memory facts, task seeds, setup checks, and deterministic gates.
    - Pack update channel with local license file support and manual import.
  - First paid packs:
    - Small Business Ops.
    - Household Secretary.
    - QA/Product Ops.
    - Student Study Desk.
    - Creative Studio.
  - 2027 dominance requirement:
    - Third-party pack authors can create safe L0 packs without runtime code.
    - Certified L1 packs can add routes and gates only after review.
    - High-stakes packs remain admin-only and reviewed.
  - Commercial impact:
    - Creates one-time pack revenue, annual update revenue, and future revenue share.
    - Lets Haven Desk sell outcomes without bloating the core app.

- Feature 3: Local context engine for files, memory, and citations.
  - Why it matters: The durable product wedge is not the model. It is the user's private context becoming useful over time.
  - What to build:
    - Documents surface that deep-links into Open WebUI RAG where appropriate and surfaces citation-aware workflows in the cockpit.
    - Capture inbox for screenshots, PDFs, pasted notes, voice notes, and forwarded text.
    - Deadline extraction into pending task proposals.
    - "Context used" panel on every AI result.
    - Memory governance: relevance ranking, merge proposals, archive/restore, and user-approved learning.
    - Local encrypted backup and restore path.
  - 2027 dominance requirement:
    - The product must answer "why did it say this?" through citations, context panels, and saved artifacts.
    - Every durable output should be traceable back to user-approved input or a model-free rule.
  - Commercial impact:
    - Justifies Pro because memory, documents, and projects compound over time.
    - Makes churn lower than prompt-only tools.

- Feature 4: Reviewable action layer with local connectors.
  - Why it matters: Agentic AI will be common by 2027, but the projects that fail will be the ones with unclear value and weak controls. Haven Desk should be action-capable without being reckless.
  - What to build:
    - Approval queue: every proposed external or durable action waits for explicit user approval.
    - Local connectors for calendar files, Apple Mail or Outlook drafts, local folders, browser capture, and eventually accounting/document tools.
    - Local MCP boundary for read-only resources and proposed writes.
    - "Explain and navigate" assistant upgraded into "suggest next action" while still refusing to silently execute.
    - Activity log that shows what was proposed, accepted, exported, or dismissed.
  - 2027 dominance requirement:
    - Haven Desk should do more than draft, but every mutation remains visible and reversible where possible.
    - External send, payments, tax, legal, medical, and destructive operations stay outside autonomous scope.
  - Commercial impact:
    - Supports paid integrations and team licensing.
    - Creates trust-based differentiation against agent-washed competitors.

- Feature 5: Commercial trust infrastructure.
  - Why it matters: A privacy product cannot monetize by weakening privacy. The business model must preserve local-first trust.
  - What to build:
    - Local license file with offline grace period.
    - Manual license import for air-gapped or privacy-sensitive teams.
    - Paid feature flags that never block read access to local user data.
    - Telemetry-off-by-default posture for bundled services and explicit opt-in for any diagnostic export.
    - Pricing page, upgrade flow, and support entitlement view.
    - Team admin only after local backup, audit log, and role model are real.
  - 2027 dominance requirement:
    - The commercial layer must be boring, auditable, and hard to misinterpret.
    - No cloud LLM calls from the cockpit for core workflows.
  - Commercial impact:
    - Enables subscriptions, paid packs, support retainers, and team licenses without betraying the product thesis.

## 4. Monetization strategy (the revenue model)

- Free local core.
  - Price: $0.
  - Includes:
    - One project.
    - Core write/capture/task tools.
    - Basic memory cap.
    - Manual export/import.
    - Local model setup.
    - Read access to all user-created data forever.
  - Why:
    - Trust is the acquisition strategy.
    - Users need proof before paying for a local install.
    - Free local use creates community, pack authors, and technical advocates.
  - Guardrail:
    - Do not require a cloud account to use the local app.

- Pro individual.
  - Assumption: $12/month or $99/year. Student annual: $59/year.
  - Adds:
    - Unlimited projects.
    - Full memory loop and relevance ranking.
    - Voice capture.
    - Automation routines like standup and wrapup.
    - Scheduled local backups.
    - Per-tool model overrides.
    - Premium personalization.
  - Why:
    - The product becomes stickier as local context accumulates.
    - Annual pricing reduces churn and payment friction for students and households.

- Household plan.
  - Assumption: $19/month or $179/year.
  - Adds:
    - Household Secretary pack included.
    - Multiple local profiles or shared project spaces, only after role/privacy boundaries are clear.
    - Family weekly brief routines.
    - Higher local document/capture limits.
  - Why:
    - Household admin is a daily recurring pain.
    - The buyer wants relief more than technical features.

- Solo business.
  - Assumption: $29/month baseline, $49/month with priority support.
  - Adds:
    - Small Business Ops pack included.
    - Business weekly review.
    - Proposal, SOP, follow-up, and meeting-to-tasks workflows.
    - Client/project organization.
    - Priority email support.
  - Why:
    - This is the clearest mainstream revenue wedge.
    - A solo operator can justify the price if the product saves 2 to 5 admin hours per month.

- Pack marketplace.
  - Consumer pack assumption: $49 to $199 one-time, or $5 to $15/month for updates.
  - Professional pack assumption: $199 to $499 one-time, or $199/year for updates.
  - Revenue share:
    - 70/30 split for certified third-party packs after curation and validator compliance.
    - Higher platform share for packs that require Haven Desk support or certification.
  - Why:
    - Packs monetize outcomes instead of raw model access.
    - Pack authors create domain depth faster than the core team can.
    - Users can buy exactly the job they need.

- Small team and local license.
  - Assumption: $999 to $2,500/year for 2 to 10 users, or $12 to $29/user/month where account billing is acceptable.
  - Adds:
    - Local license file.
    - Professional pack included.
    - Onboarding call.
    - Team backup/export guidance.
    - Optional support retainer.
  - Why:
    - Privacy-sensitive professional teams value offline licensing.
    - The QA/Product Ops wedge can close before the household market is ready.

- Setup, onboarding, and certified partner services.
  - Install and configure: $500 to $3,000 depending on buyer type.
  - Workflow pack onboarding: $2,000 to $5,000.
  - Custom pack development: $5,000 to $10,000.
  - Support retainer: $100 to $500/month.
  - Certified partner model:
    - Train MSPs, bookkeepers, AI consultants, and virtual assistant agencies to install Haven Desk and configure packs.
    - Partners keep service revenue; Haven Desk keeps software and pack revenue.
  - Why:
    - Services produce the first dollars and reveal real workflows.
    - The long-term goal is to convert repeated service work into reusable packs.
  - Guardrail:
    - Cap founder-led services during beta so consulting does not swallow product focus.

- Premium integrations.
  - Examples:
    - Calendar export and local calendar workflows.
    - Local email draft handoff.
    - Watched folder import.
    - Document OCR and citation workflows.
    - Optional local connectors for business tools where the user supplies credentials and approves each action.
  - Pricing:
    - Bundle in Pro for basic integrations.
    - Charge per professional connector or include in team license.
  - Why:
    - Integrations are where support and risk live, so they should be paid.
    - The value is actionability, not tokens.

- Novel revenue streams that preserve trust.
  - Private Pack Exchange:
    - Curated marketplace for workflow packs, templates, and local project seeds.
    - Revenue from pack sales, certification, and annual updates.
  - Local workflow intelligence reports:
    - Paid reports generated locally for the user: weekly admin load, overdue patterns, response-time patterns, recurring document deadlines.
    - No central data sale.
  - Opt-in benchmark cooperative:
    - Users may explicitly export anonymized aggregate workflow metrics for benchmark reports.
    - Default is no upload. No raw notes, files, prompts, client names, or document text.
  - AI PC bundle and hardware affiliate:
    - Recommend known-good local AI hardware profiles and capture affiliate or partner revenue where appropriate.
    - Keep product claims tied to tested hardware.
  - Pack certification for agencies:
    - Agencies pay to have packs reviewed against Haven Desk safety and quality criteria.
    - Certified packs get marketplace placement and compatibility badges.

## 5. Go-to-market strategy

- Positioning narrative:
  - Primary message: "AI that knows your work without owning your data."
  - Supporting message: "A private desk for notes, files, tasks, drafts, and weekly routines."
  - Product contrast:
    - ChatGPT is for the strongest general model.
    - Haven Desk is for private context, repeatable workflows, and reviewed local action.
    - Generic local chat is for enthusiasts.
    - Haven Desk is for outcomes.
  - Avoid:
    - "Autonomous life agent."
    - "Better than ChatGPT."
    - "Private by default" until telemetry and external connector gaps are closed.
    - High-stakes advice claims.

- Launch sequence:
  - Phase 0: Technical preview.
    - Audience: QA/product teams, privacy-minded developers, local AI enthusiasts, small-business owners comfortable with technical setup.
    - Offer: free technical preview plus paid setup for first pilots.
    - Goal: validate workflows and gather proof without overpromising mass-market readiness.
  - Phase 1: Small Business Ops paid beta.
    - Audience: 5 to 10 solo operators and consultants.
    - Offer: $29/month or paid onboarding credit applied to first year.
    - Required outcome: each user completes meeting notes to tasks, follow-up email, and weekly review in week one.
    - Success threshold: at least 50% keep using after 30 days and at least 3 users say they would be disappointed if access ended.
  - Phase 2: Household Secretary observed alpha.
    - Audience: 10 to 20 non-technical household/personal-admin users.
    - Offer: free or low-cost alpha after installer exists.
    - Required outcome: one school/service message, one task/deadline extraction, one weekly household brief.
    - Success threshold: install success above 80%, first saved outcome above 60%, week-two return above 30%.
  - Phase 3: Public launch.
    - Preconditions: signed installer, payment/license flow, privacy fixes, pack install flow, first-run onboarding, support docs, two case studies.
    - Offer: Free core, Pro annual, Solo Business, paid packs.

- Initial campaign: "The 10-minute private AI desk challenge."
  - Hook:
    - Bring one messy input: a meeting note, school email, PDF, receipt, support issue, or feature spec.
    - Haven Desk turns it into a reviewed task list, email draft, checklist, or QA artifact without cloud LLM calls from the cockpit.
  - Assets:
    - 90-second demo video per persona.
    - Before/after screenshots.
    - "Where your data goes" trust diagram.
    - Local install walkthrough.
    - Pack-specific landing pages.
    - Public roadmap with honest readiness labels.
  - Calls to action:
    - Join the technical preview.
    - Book a paid setup pilot.
    - Download the free local core.
    - Buy the Small Business Ops pack.

- Sales motion:
  - Founder-led sales for first 20 paid customers.
  - Each pilot starts with one workflow, not a feature tour.
  - Use an intake template:
    - What recurring admin task costs you time weekly?
    - What data do you refuse to paste into cloud AI?
    - What output would make this worth paying for next month?
  - Convert repeated answers into pack templates and onboarding scripts.
  - Publish case studies only with explicit approval and scrubbed details.

- Partnership targets:
  - Local AI ecosystem:
    - Ollama community, Open WebUI community, local AI creators, AI PC reviewers.
    - Goal: credibility with people who already believe in local inference.
  - Small business distribution:
    - Chambers of commerce, coworking spaces, bookkeeping firms, virtual assistant agencies, local MSPs, small-business coaches.
    - Goal: reach buyers who feel the admin pain every week.
  - Professional wedge:
    - QA communities, product management communities, software consultancies, privacy/security meetups.
    - Goal: sell the technical-preview use case honestly before mass-market readiness.
  - Education and learning:
    - Certification programs, bootcamps, tutoring networks, continuing education providers.
    - Goal: validate Student Study Desk after the core installer is easy.
  - Pack creators:
    - Consultants with repeatable domain workflows.
    - Goal: seed the marketplace with useful packs without building every domain internally.

- Validation loops:
  - Activation metrics:
    - Install success rate.
    - Time to first saved output.
    - First pack installed.
    - First routine run.
    - Week-two return.
  - Revenue metrics:
    - Paid pilot conversion.
    - Pack attach rate.
    - Pro annual conversion.
    - Setup-to-subscription conversion.
    - 30-day retention.
  - Quality metrics:
    - Result accepted without edit.
    - Result refined then accepted.
    - Result discarded.
    - User trust score after first workflow.
  - Support metrics:
    - Setup tickets per install.
    - Ollama/model failure rate.
    - Time to resolve.
    - Most common plain-language error states.

- The blunt 2027 recommendation:
  - Do not race to be the broadest AI assistant.
  - Win a narrow category first: private workflow packs for real recurring admin.
  - Ship the installer, prove Small Business Ops, package QA/Product Ops for revenue, and make every action reviewable.
  - Haven Desk becomes commercially viable when users stop saying "it can chat" and start saying "it runs my weekly admin without leaking my context."
