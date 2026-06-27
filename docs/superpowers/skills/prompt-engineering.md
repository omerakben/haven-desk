# Prompt engineering for a local 4B (Haven Desk)

How every everyday flow's prompt is written. The audience is a non-technical user
who cannot rescue a weak prompt by rephrasing, so the prompt carries 100% of the
reliability. Borrowed from `agency-agents/engineering/engineering-prompt-engineer.md`:
*a prompt is a spec; if the model didn't do what you wanted, the spec was ambiguous.*

## The one idea

On a small instruction-tuned model, the biggest reliability lever is **few-shot
rendered as real conversation turns** plus an **explicit output contract**. "Here
is exactly how I respond" (alternating user/assistant turns) beats "here are some
examples" (prose); "Return only the reply, ≤4 sentences, no preamble" beats "be
concise." Proven on `gemma4:e4b`: the same flow goes from a rambling, off-format,
sometimes mis-structured answer to an on-contract one.

## The shape — `PromptSpec` (`src/lib/prompts/spec.ts`)

```
PromptSpec {
  role            "You are X. Your only job is Y."   // role priming
  rules           [explicit constraints]              // "≤4 sentences", never "be concise"
  outputContract  "Return only the reply. No preamble, no quotes."
  examples        [ {input, output}, {input, output} ] // 2 worked pairs
  temperature     // extraction → 0; everyday writing → 0.3–0.4
  omitHouseRules? // opt out of the shared safety block
}
```

`compileSpec(spec, userInput)` renders: `system` (Role + Rules + house rules +
Output) → `user(ex1.input)` → `assistant(ex1.output)` → `user(ex2.input)` →
`assistant(ex2.output)` → `user(userInput)`.

## The recipe (per flow)

1. **Write the output contract first.** What exact shape must come back? (No
   preamble? A Subject line? Three headings? Bullets starting `- `?)
2. **Role + rules.** One or two sentences of role priming; rules that are
   measurable, never vague. Anything the model keeps getting wrong becomes a rule.
3. **Two gold examples.** Reuse the flow's real starter inputs (`BUILTIN_STARTERS`)
   as the example *inputs* — the example input MUST mirror the flow's real
   templated input (its `buildPrompt` output / route user message) so format
   transfer is exact. Author the ideal *output*: short, on-contract, in the
   borrowed voice, using ONLY what the input gives (no invented specifics — the
   few-shot teaches the house rules by example).
4. **House rules** apply automatically (no invented names/numbers/dates; ground or
   leave a clear blank; plain language; don't pose as a professional).
5. **Attach** the spec to the `QuickAction` (or a small route spec module); the
   legacy `system` string stays as a fallback for un-migrated flows.
6. **Prove it.** `node scripts/prompt-bench.mjs` runs baseline vs engineered on a
   FRESH input. Keep the rewrite only if it's at least as good on contract and
   better on quality. (Where the baseline was already engineered, a tie is fine —
   don't regress it.)
7. **Codex review.** A read-only adversarial pass: is the few-shot constraining or
   decorative? is the contract airtight against preamble? what's the failure mode
   for a half-filled form? does any gold output leak an invented specific?
8. **Gate** (`env -u NODE_ENV`: lint, unit, e2e, build) and live-verify on Gemma.

## Borrowing from agency-agents

Each flow borrows voice/constraints from its closest non-technical role agent:
content-creator / social-media-strategist (replies, posts, descriptions),
email-strategist (email), sprint-prioritizer (planning, Must/Should/Can-wait),
support/writing (apologies, polite messages), academic summarization (summaries).
Methodology from the repo's Prompt Engineer agent.

## Where the pieces live

- `src/lib/prompts/spec.ts` — `PromptSpec`, `compileSpec`, `HOUSE_RULES`.
- `src/lib/prompts/gold.ts` — the gold few-shot pairs (one artifact, three jobs:
  in-prompt example, starter chip input, bench reference).
- `src/lib/prompts/email.ts` — the tone/length email spec builder.
- `src/lib/quickActions.ts` — `QuickAction.spec?`; `buildMessages` compiles from it.
- `scripts/prompt-bench.mjs` — the baseline-vs-engineered smoke tool.
