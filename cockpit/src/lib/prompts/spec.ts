// The everyday prompt kit. A PromptSpec is a contract for a local 4B: who it is,
// the exact rules, the output shape, and two worked examples. compileSpec renders
// the examples as real conversation turns — the single biggest reliability lever
// on a small instruction-tuned model. See
// docs/superpowers/specs/2026-06-27-everyday-prompt-kit-design.md
import type { ChatMessage } from "@/lib/ollama";

export type FewShot = { input: string; output: string };

export type PromptSpec = {
  /** "You are X. Your only job is Y." */
  role: string;
  /** Explicit constraints — no vague qualifiers ("≤4 sentences", never "be concise"). */
  rules: string[];
  /** Exact output shape, e.g. "Return only the reply. No preamble, no quotes." */
  outputContract: string;
  /** Two worked examples, rendered as user/assistant turns. */
  examples: FewShot[];
  /** Extraction → 0; everyday writing → 0.3–0.4. */
  temperature?: number;
  /** Opt out of the shared safety block when a flow needs a different stance. */
  omitHouseRules?: boolean;
};

// The shared safety block — the safe/private promise, applied to every everyday
// spec. Borrowed from the agency-agents Prompt Engineer (explicit constraints,
// ground-or-ask) and the high-stakes pack guardrails.
export const HOUSE_RULES: string[] = [
  "Use only the details the user gave you. Never invent names, numbers, dates, prices, or facts.",
  "If something needed is missing, write the rest and leave a clearly marked blank like [their name] rather than guessing.",
  "Write in plain, everyday language. Do not act as a lawyer, doctor, or accountant; if asked for that, suggest checking a professional.",
];

export function compileSpec(spec: PromptSpec, userInput: string): ChatMessage[] {
  const rules = spec.omitHouseRules ? spec.rules : [...spec.rules, ...HOUSE_RULES];
  const system = [
    `## Role\n${spec.role}`,
    `## Rules\n${rules.map((r) => `- ${r}`).join("\n")}`,
    `## Output\n${spec.outputContract}`,
  ].join("\n\n");

  const messages: ChatMessage[] = [{ role: "system", content: system }];
  for (const ex of spec.examples) {
    messages.push({ role: "user", content: ex.input });
    messages.push({ role: "assistant", content: ex.output });
  }
  messages.push({ role: "user", content: userInput });
  return messages;
}
