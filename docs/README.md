# Haven Desk docs

Date: 2026-06-26

This folder holds the Haven Desk transition package for the Swiss Knife repo. Haven Desk is the public product direction: a local-first private AI daily runner for non-technical users and small businesses. Swiss Knife stays the repo and internal codename. Nothing here changes the local-first rule, the repo name, the ports, or the scripts.

Tagline: Private AI for the work of daily life.

## Read in this order

If you are new to the transition, read top to bottom. If you are implementing, jump to the backlog.

1. [Product narrative](haven-desk-product-narrative.md). What Haven Desk is and is not, the five personas, the local-first trust promise, and competitive positioning. Start here for the story.
2. [2027 business plan](haven-desk-2027-business-plan.md). Commercial strategy, 2027 market thesis, target segments, product roadmap, monetization model, and go-to-market plan.
3. [Small business early-access campaign](haven-desk-small-business-early-access-campaign.md). Draft pitch, offer, landing-page copy, outreach messages, demo script, objections, and pilot validation metrics for the first buyer wedge.
4. [Engineering roadmap](haven-desk-engineering-roadmap.md). Staged milestones M0 to M11 with goals, dependencies, acceptance checks, and guardrails.
5. [Persona-first UX and information architecture](haven-desk-ux-information-architecture.md). Current navigation versus the target (Today, Capture, Write, Documents, Projects, Packs, Settings), the route mapping, and the first-run onboarding flow.
6. [Plugin and pack spec](haven-desk-plugin-pack-spec.md). The `PluginManifest` contract, the L0 to L3 maturity ladder, the permission model, the validation rules, and the first pack definitions. Pairs with the shipped code.
7. [Monetization plan](haven-desk-monetization-plan.md). Free, Pro, solo business, team license, paid packs, and setup/support offers, with pricing labeled as assumptions to validate.
8. [Implementation backlog](haven-desk-implementation-backlog.md). Issue-ready tasks grouped by milestone, each with scope, files, acceptance, a verify command, and a size.

## Strategy source docs

These three came first and hold the deeper analysis the package above is built on.

- [Strategy report](haven-desk-strategy-report.md). The full market, persona, positioning, pack, and monetization analysis.
- [A-to-Z roadmap](haven-desk-a-to-z-roadmap.md). Stage A to Z transition guidance.
- [Clean-context prompt](haven-desk-clean-context-prompt.md). A prompt to continue the transition from a fresh agent session.

## Shipped in this session (2026-06-26)

- The `PluginManifest` type and a pure, dependency-free validator: `cockpit/src/lib/packs/manifest.ts`.
- Two reference packs that double as validator fixtures: `cockpit/src/lib/packs/examples.ts` (Small Business Ops at L0, QA and Product Ops at L1).
- The validator contract as 39 unit tests: `cockpit/src/lib/packs/manifest.test.ts`.

The validator runs with `npm run test:unit` from `cockpit/`. It encodes the local-first invariants as gates: a pack cannot declare external network, external sending, runtime code, or unattended action and still pass.

## What is intentionally still a plan

The navigation reorganization, first-run onboarding, the pack seed loader, the Documents surface, the privacy UX, the local MCP server, the approval-queue automation, and the installer are specified in the roadmap and backlog but not yet built. Each is a separate, test-gated change.
