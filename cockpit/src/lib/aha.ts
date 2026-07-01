// The AHA framework (Aligned Human-AI), adapted for Haven Desk's idea refinement.
// AHA is Ask -> Align -> Critique -> Optimize -> Handoff. For a personal idea tool
// we use the front of that pipeline — the part that turns a rough idea into a
// sharp one:
//   Ask      — 3–5 typed leverage questions (the "interview me")
//   Align    — what you're assuming / what's still unknown
//   Critique — a premortem: where it could go wrong (the edge cases)
//   + Next steps (a light Optimize: concrete actions, not an agent prompt)
// Handoff / Debrief are agent-to-agent plumbing and out of scope for a human
// idea tool. Faithful to github.com/omerakben/aha (skills/ask-me, align-me,
// critique-this). This module is pure (no prisma, no model) so it can gate the
// model's output deterministically and be unit-tested.

// The six AHA "Ask" question types. A leverage question is tagged with one so the
// user can see what kind of decision it forces.
export const AHA_QUESTION_TYPES = [
  "scope",
  "evidence",
  "risk",
  "output",
  "tool",
  "approval",
] as const;

export type AhaQuestionType = (typeof AHA_QUESTION_TYPES)[number];

const TYPE_SET = new Set<string>(AHA_QUESTION_TYPES);

// Plain-language chips for the UI (the raw AHA type names are jargon for a
// non-technical user). Order matches AHA_QUESTION_TYPES.
export const AHA_TYPE_LABELS: Record<AhaQuestionType, string> = {
  scope: "Who / where",
  evidence: "Proof",
  risk: "Risk",
  output: "The result",
  tool: "How",
  approval: "Who decides",
};

export type InterviewQuestion = {
  text: string;
  type: AhaQuestionType;
  /** One line: why this question changes the plan. */
  why: string;
};

export type InterviewAnswer = {
  question: string;
  type: string;
  answer: string;
};

const MIN_QUESTIONS = 3;
const MAX_QUESTIONS = 5;

/**
 * Deterministic gate over the model's Ask-phase output. Coerces to a clean list:
 * trims, drops blanks and duplicates, clamps to at most MAX_QUESTIONS, and maps
 * an unrecognized `type` to "scope" (a real leverage question with a bad label
 * is still worth asking — don't discard it). The AHA rule "two different answers
 * must lead to two different plans" can't be checked mechanically, so it lives in
 * the prompt; this gate only enforces shape and reports what it had to fix.
 */
export function gateInterviewQuestions(raw: unknown): {
  questions: InterviewQuestion[];
  issues: string[];
} {
  const issues: string[] = [];
  const list =
    raw && typeof raw === "object" && Array.isArray((raw as { questions?: unknown }).questions)
      ? (raw as { questions: unknown[] }).questions
      : [];
  if (list.length === 0) issues.push("no questions returned");

  const seen = new Set<string>();
  const questions: InterviewQuestion[] = [];
  for (const item of list) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const text = typeof o.text === "string" ? o.text.trim() : "";
    if (!text) continue;
    const key = text.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    const rawType = typeof o.type === "string" ? o.type.trim().toLowerCase() : "";
    const type = (TYPE_SET.has(rawType) ? rawType : "scope") as AhaQuestionType;
    if (rawType && !TYPE_SET.has(rawType)) issues.push(`unknown type "${rawType}" -> scope`);

    const why = typeof o.why === "string" ? o.why.trim() : "";
    questions.push({ text: text.slice(0, 300), type, why: why.slice(0, 200) });
    if (questions.length >= MAX_QUESTIONS) break;
  }
  if (questions.length > 0 && questions.length < MIN_QUESTIONS) {
    issues.push(`only ${questions.length} usable question(s)`);
  }
  return { questions, issues };
}

/**
 * Assemble the user turn for the brief (Align + Critique + Next steps) from the
 * raw idea and the interview answers. Answered questions become "what you
 * clarified"; skipped ones are passed through as "still open" so the model folds
 * them into the Align phase's "still unknown" section rather than inventing an
 * answer. Pure and order-stable so the few-shot examples mirror the runtime input
 * exactly (see lib/prompts/aha.ts).
 */
export function buildBriefInput(idea: string, answers: InterviewAnswer[]): string {
  const parts = [`IDEA:\n${idea.trim()}`];

  // Coerce defensively so the pure function is robust on its own — a malformed
  // answer object (non-string field) can never throw here.
  const norm = (answers ?? [])
    .filter((a): a is InterviewAnswer => !!a && typeof a === "object")
    .map((a) => ({
      question: typeof a.question === "string" ? a.question.trim() : "",
      type: typeof a.type === "string" ? a.type : "",
      answer: typeof a.answer === "string" ? a.answer.trim() : "",
    }));

  const answered = norm.filter((a) => a.answer);
  if (answered.length > 0) {
    const qa = answered.map((a) => `- (${a.type}) ${a.question}\n  -> ${a.answer}`).join("\n");
    parts.push(`WHAT I CLARIFIED:\n${qa}`);
  }

  const skipped = norm.filter((a) => !a.answer);
  if (skipped.length > 0) {
    const qs = skipped.map((a) => `- (${a.type}) ${a.question}`).join("\n");
    parts.push(`STILL OPEN (I skipped these):\n${qs}`);
  }

  return parts.join("\n\n");
}
