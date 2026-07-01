import { describe, expect, it } from "vitest";

import { AHA_QUESTION_TYPES, buildBriefInput } from "@/lib/aha";
import {
  AHA_BRIEF_EXAMPLES,
  AHA_BRIEF_SPEC,
  AHA_INTERVIEW_SCHEMA,
  AHA_INTERVIEW_SYSTEM,
} from "./aha";
import { compileSpec } from "./spec";

describe("AHA interview prompt", () => {
  it("schema enum is exactly the AHA question types", () => {
    const enumVals = (AHA_INTERVIEW_SCHEMA.properties.questions.items.properties.type as { enum: string[] }).enum;
    expect([...enumVals].sort()).toEqual([...AHA_QUESTION_TYPES].sort());
  });

  it("system prompt encodes the leverage + no-solving rules", () => {
    expect(AHA_INTERVIEW_SYSTEM).toMatch(/3 to 5/);
    expect(AHA_INTERVIEW_SYSTEM).toMatch(/two different answers/i);
    expect(AHA_INTERVIEW_SYSTEM).toMatch(/do not solve|do not answer/i);
    for (const t of AHA_QUESTION_TYPES) expect(AHA_INTERVIEW_SYSTEM).toContain(t);
  });
});

describe("AHA brief prompt", () => {
  it("has two few-shot examples whose input mirrors buildBriefInput by construction", () => {
    expect(AHA_BRIEF_EXAMPLES).toHaveLength(2);
    for (const ex of AHA_BRIEF_EXAMPLES) {
      expect(ex.input.startsWith("IDEA:\n")).toBe(true);
      // The output demonstrates the full six-section contract.
      expect(ex.output).toContain("## The idea in one line");
      expect(ex.output).toContain("## Where it could go wrong");
      expect(ex.output).toContain("## Next steps");
    }
  });

  it("compiles to a system turn plus alternating few-shot turns", () => {
    const messages = compileSpec(AHA_BRIEF_SPEC, buildBriefInput("test idea", []));
    expect(messages[0].role).toBe("system");
    // system + (2 examples * 2 turns) + final user = 6 messages
    expect(messages).toHaveLength(6);
    expect(messages[messages.length - 1]).toEqual({ role: "user", content: "IDEA:\ntest idea" });
    expect(messages[0].content).toContain("## The one thing that matters most");
  });
});
