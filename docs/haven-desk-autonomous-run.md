# Haven Desk autonomous run log

Living status doc for the autonomous build of Haven Desk. Ozzy is the owner and the gate; Claude is the lead operator, working with Codex as builder/verifier. Read this to catch up; the changelog at the bottom is appended as work lands.

Last updated: 2026-06-26.

## Operating agreement

Claude runs the buildable work end to end and stops at the gates below for Ozzy. Each unit of work is committed locally per feature, gated (lint, unit, build, and e2e or a live browser check), and recorded here.

What Claude proceeds on (Ozzy granted push/merge/deploy authority on 2026-06-26): design, build, refactor, tests, docs, using Codex, and pushing, opening PRs, and merging to main once the work is gated and verified. Each feature lands on its own branch, gated (lint, unit, build, and e2e or a live browser check), then merged.

What Claude still holds for Ozzy (the gates):
- Spending money, or any payment or licensing integration.
- Publishing public product claims: a live marketing site or public posts go to Ozzy as a draft to approve first (the positioning is Ozzy's, and published claims are hard to retract).
- Credentials or secrets.
- Destructive operations: force-pushing shared branches, history rewrites on main, wiping data.
- The installer's real-human setup test (needs Ozzy and a few non-technical people).

Deploy note: Haven Desk is local-first, so there is no cloud to deploy the app to. Hosting the cockpit publicly would break the privacy promise, and it cannot run without local Ollama and local storage. "Deploy" here means merging to main (done) and, when the positioning is set, building a draft early-access landing page and previewing it for Ozzy before it goes public.

## Where things stand (verified)

Branch `codex/haven-desk-transition`, not pushed. The app is live and works for a technical user with a running stack: rebranded Haven Desk, persona-first nav, a Packs surface that installs validated packs, and pack content that appears in the tools. Trust gaps from the readiness audit are closed (local-only prompt-sync, Open WebUI telemetry off, high-stakes packs gated as ERRORs).

Readiness verdict (see `haven-desk-release-readiness-audit.md`): demo-ready for a technical audience; not closed-alpha ready (the terminal setup blocks non-technical users); not paid-launch ready (no installer, onboarding, or licensing).

## Work queue (Claude drives top-down; gated items wait for Ozzy)

1. First impression for non-technical users: rewrite the first-run card (done), then a persona picker and a dashboard that does not lead with developer tools.
2. One real 10-minute outcome: make the Small Business Ops meeting-notes workflow create actual Task records, not just text. Codex builds, Claude reviews (or the reverse).
3. Deepen the first two packs to the workflow set the monetization plan promises.
4. A one-command or double-click setup wrapper to lower the install wall (the full installer and its human test are an Ozzy gate).
5. Privacy/trust UX surface (a "where is my data" panel) so the local-first promise is visible.

## How to review

- Read the commits on `codex/haven-desk-transition` (conventional messages, one per feature).
- Read `haven-desk-release-readiness-audit.md` for the verdict and the critical path.
- Run the app: `cd cockpit && npm run dev`, open the printed URL (the stack needs native Ollama running).
- To get it on GitHub for remote review, tell Claude "push" and it will open a draft PR.

## Changelog

- 2026-06-26: Shipped the transition (docs + pack validator), live v1 (rebrand, persona nav, Packs surface, install), a 5-lens readiness audit, and trust hardening. 9 commits. Started the first-impression work with the first-run card rewrite.
- 2026-06-26 (cont.): Shipped the value proof. `/tools/meeting-notes` turns pasted notes into real Task records (chatJson extraction, a tested deterministic gate, review-and-edit, then a transactional create; the model runs only on extract). Verified live on gemma4:e4b (pasted notes produced 3 dated, owner-tagged tasks that landed in the Tasks board). Codex-reviewed SHIP-READY; its findings (clearable owner/due chips, owner cap, stale-row clear) fixed.
- 2026-06-26 (cont.): The dashboard now groups tool cards by the persona-first nav sections (Favorites, then Today, Capture, Write, Projects, Packs, Settings) instead of one flat grid, so a non-technical user leads with everyday tools and the professional tools sit in a clearly-labelled section.
- 2026-06-26 (cont.): First-run persona picker. A new (empty-DB) user lands on "what do you want help with first?" with five persona cards (household, small business, student, creative, personal documents) instead of a tool grid; picking saves `Settings.persona` and shows a tailored first step that links to a tool that works today (small business goes to Meeting Notes). The picker shows only when the DB is empty and no persona is set. Verified live: the picker renders for a new user on an empty DB, picking shows the step, and the save persists (PUT 200, value read back from the DB). Schema change: run `npm run db:push` after pulling.
- 2026-06-26 (cont.): Deepened the Small Business Ops pack from 3 to 6 templates (added proposal writer, SOP builder, receipt/invoice organizer) so the content matches its six promised capabilities. Validates clean; install now seeds 6 templates. The installer, payment/licensing, and go-to-market stay Ozzy gates.
- 2026-06-26 (cont.): Quick Actions, the marketable hook (Ozzy's vision: simple, one-click, valuable, for people who don't know how to prompt). A gallery of 13 pre-built one-click AI actions (reply to a message, notes to a to-do list, summarize, plan my week, make this friendlier, write a polite message...) with tiny plain-language forms and written-for-you prompts. Surfaced as a dashboard hero (six deep-linked actions) and a top "Quick Actions" nav item. Verified live on gemma4:e4b: a school invite plus "happy to help but I can't do Wednesdays, ask for another day" produced a polished reply in one click, Copy/Export ready, console clean. Codex-reviewed; the two MED findings (a non-string input value 500, and not aborting the engine when switching actions mid-stream) are fixed. The lib is pure + tested (6 tests). 318 unit / 81 e2e green.
- 2026-06-26 (cont.): Expanded Quick Actions from 12 to 18 actions (added Make this shorter, Explain this simply, Find the action items, Write a social post, Draft an apology, Make a packing list) so the gallery covers more everyday needs. Pure content; the iterating lib test covers the new ones. Gates green.
