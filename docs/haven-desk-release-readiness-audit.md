```yaml
mission_id: 2026-06-26-haven-desk-readiness-audit
agent: claude
status: verified-ready
risk: low
next_owner: ozzy
verification: "five agency-agent lenses + repo evidence"
files_changed: []
links: []
```

# Haven Desk release-readiness synthesis

Five specialist lenses (PM, persona walkthrough, testing reality, marketing, legal/trust) audited the `codex/haven-desk-transition` branch on 2026-06-26. I re-verified every load-bearing claim against the repo. The lenses converge almost completely; where they differ, the difference is the audience they assume, not the facts.

## 1. Honest verdict

Haven Desk is a genuinely good local-first tool with a defensible privacy story and a clean pack architecture, and it is **demo-ready today for a technical audience**. It is **not closed-alpha ready for the stated mass-market personas** (household operator, small business owner, student) and it is **not paid-launch ready** for anyone. The single fact that dominates everything: no non-technical person can install it. Setup is `git clone` + Docker Desktop + native Ollama (with a documented brew formula-vs-cask trap) + a multi-GB model pull + `./swiss up` in a terminal, and the first-run card still tells the user to run `./swiss doctor` (verified in `cockpit/src/app/page.tsx` line 60). There is no installer, no onboarding, no license check, and no payment path anywhere in `cockpit/src` (grep for license/paywall/stripe/InstalledPack returns nothing). You CAN start marketing now, but only one honest kind: technical early access aimed at QA engineers and developers, on the privacy and local-inference story. You cannot market to non-technical users or use the phrase "private by default" until two concrete code gaps close.

The one place the lenses split: the legal lens called closed alpha "ready" — but only for technical users on the QA wedge. Against the stated non-technical personas, closed alpha is not ready, and that is the call I am making.

## 2. Readiness table

| Stage | Ready? | One-line why |
|---|---|---|
| Demo (technical audience, stack pre-running) | Yes | ~20 tools, pack install, QA pipeline all work live on local Ollama; verified this session. |
| Closed alpha (non-technical target persona) | No | Terminal-only setup eliminates the target user at step 0; no onboarding, no persona content depth, no household pack. |
| Paid launch / marketing to mass market | No | Zero installer, zero license/payment code, two privacy gaps that contradict the marketing claim. |
| Marketing right now | Partial | Technical early-access positioning is honest and shippable; mass-market positioning is a false promise until the installer exists. |

## 3. Critical path to a closed alpha

The smallest set that lets a real non-technical user reach a real saved outcome. Ranked. Facts cite the repo; the human-test and installer items are assumptions about scope.

1. **Simplified one-command / double-click setup (not the full GUI installer).** Effort: L. Produce a `.command` (macOS) and `.cmd` (Windows) that runs `./swiss setup && ./swiss up`, pulls the model, opens `:4141`, and prints English error states. Write the installer spec (T-32, S, doc-only) first; the `swiss doctor` llama-server probe logic already encodes the failure modes. This is the absolute binary blocker — it does not degrade, it eliminates.
2. **Run 3-5 non-technical humans through the current setup, observed.** Effort: S (time, not code). The observed failure modes define what the setup script must handle. Do this before writing setup-script code, not after.
3. **First-run persona picker + guided first action (T-08/T-10).** Effort: M. No `/onboarding` route exists (verified). Add a persona selection stored in `Settings`, then route each persona to one concrete tool. Does not depend on the installer.
4. **Rewrite the first-run card copy.** Effort: S (under 30 min, zero risk). Remove `./swiss doctor`, "global space", and "Prompt Optimizer" as first stop from `cockpit/src/app/page.tsx` lines 57-91. Highest ROI change in the codebase.
5. **Filter the dashboard grid by persona (T-07).** Effort: S. `DashboardToolGrid.tsx` renders all 19 tools flat; QA Pipeline and API Contract sit at equal weight to Email Writer. The `group: "packs"` data already exists in `nav.tsx` — hide packs-group tools behind a collapsed "Developer and QA tools" disclosure.
6. **Build the Household Secretary pack manifest.** Effort: M. `EXAMPLE_PACKS` (examples.ts line 150) has only SBO + QA; persona 1 in the narrative has zero content. The capability spec is in the monetization plan; the `PluginManifest` pattern is proven. Content work, no engineering.
7. **Make the SBO meeting-notes pitch real (T-15).** Effort: M. The `sbo-meeting-notes-to-tasks` template (examples.ts line 33) is a plain prose prompt — it outputs text, not Task records. Wire it to `chatJson` + a gate (each item needs a non-empty `action`) + `POST /api/tasks`. This is the difference between a demo and the headline pitch.
8. **Post-install "what's next" guidance on the Packs page.** Effort: S. After install the button just says "Installed"; the user has no path to the templates (Prompt Library) or seeded tasks (Tasks).
9. **Push the branch and open a draft PR.** Effort: S. Branch is 6 commits ahead of `origin/main` and unpushed (verified). No CI has run on any Haven Desk commit; a disk failure loses the work.

## 4. Additional path to a paid launch

Everything above, plus:

1. **Full GUI installer (T-33 macOS .pkg/.dmg, T-34 Windows .exe/.msi).** Effort: XL. The simplified script unblocks alpha; a signed installer is required for paid mass-market trust.
2. **Local license mechanism.** Effort: M. No license code exists. The monetization plan's design is sound and privacy-aligned: a static local license file checked at startup with `crypto.timingSafeEqual` (reuse the `lib/captureAuth.ts` pattern), 30-day offline grace, keys sold via email/Gumroad. Do NOT put Stripe in the cockpit — that breaks the local-first promise. Gate at minimum voice/transcribe, multiple projects, and learn-from-activity.
3. **Pack content depth.** Effort: M. SBO ships 3 of 6 promised capabilities (proposal-writer, SOP-builder, receipt-memo missing). Three templates cannot earn a second month of a $29 subscription. Calibrate each on a live `gemma4:e4b` run.
4. **Two privacy fixes before any "private" marketing.** Both S, can land in one commit:
   - Add `ANONYMIZED_TELEMETRY=False` to the `open-webui` service in `docker-compose.yml` (verified absent, lines 16-19). Open WebUI sends usage telemetry by default; without this the "private by default" claim is false.
   - Add `isLocalEngineUrl()` validation to `OWUI_BASE` in `cockpit/src/app/api/prompts/sync/route.ts` (verified raw env at line 6). The settings route already guards engine URL; the sync route does not, so a misconfigured `OWUI_BASE_URL` would POST all saved prompts off-machine.
5. **Promote high-stakes pack guardrails from WARN to ERROR** in `cockpit/src/lib/packs/manifest.ts` before authoring any legal/medical/finance pack. Tort/UPL exposure if a paid pack drafts legal letters with only a warning, not a mandatory disclaimer.
6. **InstalledPack model** in `prisma/schema.prisma`. Effort: S. Install state is currently derived by counting rows (packs/page.tsx); this breaks once packs overlap content.
7. **Public landing page + waitlist.** Effort: S. No website, no signup, zero willingness-to-pay signal exists.

## 5. What we can honestly market right now

Claims we CAN make (all verified true against the repo):
- "Local AI workflow desk — runs on your machine, no cloud LLM calls." The cockpit talks only to native Ollama; the local-only architecture is real.
- "Built for QA and product teams who can't paste internal specs into cloud AI." QA Pipeline, Gherkin Lint, Rubric Designer, Eval Cases, Code Review, ADR Writer, API Contract all work end-to-end today. This is the only persona that can self-install.
- "Currently in technical preview; one-click installer coming for non-technical users." Honest about the current state.
- The deterministic-gate engineering pattern (gherkinLint, lintAdr, openapiLint, validateManifest are real and shipped) is a credible technical-content marketing angle with zero infrastructure cost.

Claims we must NOT make:
- "Private by default." Open WebUI telemetry is on until `ANONYMIZED_TELEMETRY=False` ships. Use "local inference / no cloud AI calls" instead, which is verifiably true.
- "For household operators / students / non-technical users." They cannot install it. This creates support debt and a false promise until the installer exists.
- "The first local AI product non-technical users can run." The product narrative's category claim; currently false.
- Any pricing or tier language. There is no enforcement, so any paid tier is vaporware today.

## 6. Top 3 to build next, in order

1. **Simplified setup script + observed human test (T-32 spec, then the `.command`/`.cmd`).** It is first because it is the only true binary blocker — every other feature is unreachable by the target user without it, and the human test defines its requirements. Building tool 20 converts zero users who cannot get through setup.
2. **First-run card copy rewrite + persona picker (T-08) + dashboard grid filter (T-07).** Second because it is the cheapest high-ROI bundle (one S change plus two small-to-medium ones), it does not depend on the installer, and it immediately fixes the "this is a developer tool" first impression for the technical alpha users you can reach today.
3. **Make the SBO meeting-notes pitch real (T-15) + Household Secretary pack.** Third because once a user can install and orient, they need one finished 10-minute outcome to justify the product. T-15 turns the headline pitch from text-about-tasks into real Task records, and the household pack gives persona 1 something to install at all.

Facts vs assumptions: every code-level claim above is verified against the repo this session. The effort sizes, the human-test scope, and the "installer is a week of scripting vs months of GUI work" distinction are reasoned estimates, not measured facts.