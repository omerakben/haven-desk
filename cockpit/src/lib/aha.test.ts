import { describe, expect, it } from "vitest";

import {
  AHA_QUESTION_TYPES,
  AHA_TYPE_LABELS,
  buildBriefInput,
  gateInterviewQuestions,
  type InterviewAnswer,
} from "./aha";

describe("gateInterviewQuestions", () => {
  it("keeps well-formed questions with their type and why", () => {
    const { questions, issues } = gateInterviewQuestions({
      questions: [
        { text: "Who is this for?", type: "scope", why: "changes the whole design" },
        { text: "How do you know they want it?", type: "evidence", why: "avoids building the wrong thing" },
        { text: "What could go wrong?", type: "risk", why: "surfaces the real failure mode" },
      ],
    });
    expect(questions).toHaveLength(3);
    expect(questions[0]).toEqual({ text: "Who is this for?", type: "scope", why: "changes the whole design" });
    expect(issues).toHaveLength(0);
  });

  it("clamps to at most five questions", () => {
    const many = Array.from({ length: 9 }, (_, i) => ({ text: `Q${i}`, type: "scope", why: "w" }));
    const { questions } = gateInterviewQuestions({ questions: many });
    expect(questions).toHaveLength(5);
  });

  it("coerces an unknown type to scope and reports it", () => {
    const { questions, issues } = gateInterviewQuestions({
      questions: [
        { text: "Q1", type: "vibes", why: "w" },
        { text: "Q2", type: "scope", why: "w" },
        { text: "Q3", type: "risk", why: "w" },
      ],
    });
    expect(questions[0].type).toBe("scope");
    expect(issues.some((i) => i.includes("vibes"))).toBe(true);
  });

  it("drops blank and duplicate questions", () => {
    const { questions } = gateInterviewQuestions({
      questions: [
        { text: "  ", type: "scope", why: "" },
        { text: "Same question", type: "scope", why: "" },
        { text: "same question", type: "risk", why: "" }, // dupe (case-insensitive)
        { text: "Another", type: "evidence", why: "" },
      ],
    });
    expect(questions.map((q) => q.text)).toEqual(["Same question", "Another"]);
  });

  it("flags a too-short usable set", () => {
    const { questions, issues } = gateInterviewQuestions({
      questions: [{ text: "Only one", type: "scope", why: "" }],
    });
    expect(questions).toHaveLength(1);
    expect(issues.some((i) => i.includes("usable"))).toBe(true);
  });

  it("handles junk input without throwing", () => {
    expect(gateInterviewQuestions(null).questions).toEqual([]);
    expect(gateInterviewQuestions({}).questions).toEqual([]);
    expect(gateInterviewQuestions({ questions: "nope" }).questions).toEqual([]);
    expect(gateInterviewQuestions({ questions: [1, "x", null] }).questions).toEqual([]);
  });

  it("has a plain-language label for every question type", () => {
    for (const t of AHA_QUESTION_TYPES) {
      expect(AHA_TYPE_LABELS[t]).toBeTruthy();
    }
  });
});

describe("buildBriefInput", () => {
  const answered: InterviewAnswer[] = [
    { question: "Who is this for?", type: "scope", answer: "My block." },
    { question: "How will they sign up?", type: "evidence", answer: "" },
    { question: "Who writes it?", type: "risk", answer: "Me." },
  ];

  it("includes the idea, answered questions, and skipped ones separately", () => {
    const out = buildBriefInput("A street newsletter", answered);
    expect(out).toContain("IDEA:\nA street newsletter");
    expect(out).toContain("WHAT I CLARIFIED:");
    expect(out).toContain("(scope) Who is this for?");
    expect(out).toContain("My block.");
    expect(out).toContain("STILL OPEN (I skipped these):");
    expect(out).toContain("(evidence) How will they sign up?");
    // The skipped question's blank answer must not leak into the clarified block.
    expect(out).not.toContain("How will they sign up?\n  ->");
  });

  it("omits both sections when there are no answers (quick pass)", () => {
    const out = buildBriefInput("A street newsletter", []);
    expect(out).toBe("IDEA:\nA street newsletter");
    expect(out).not.toContain("WHAT I CLARIFIED");
    expect(out).not.toContain("STILL OPEN");
  });

  it("trims the idea", () => {
    expect(buildBriefInput("  padded  ", [])).toBe("IDEA:\npadded");
  });

  it("does not throw on a malformed answer object", () => {
    // A caller shouldn't be able to, but the pure function stays robust anyway.
    const junk = [{ question: 1, type: null, answer: undefined }] as unknown as InterviewAnswer[];
    expect(() => buildBriefInput("idea", junk)).not.toThrow();
    expect(buildBriefInput("idea", junk)).toContain("IDEA:\nidea");
  });
});
