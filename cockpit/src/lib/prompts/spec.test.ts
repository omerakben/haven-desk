import { describe, it, expect } from "vitest";
import { compileSpec, HOUSE_RULES, type PromptSpec } from "./spec";

const base: PromptSpec = {
  role: "You are a careful assistant.",
  rules: ["Keep it short.", "Use plain words."],
  outputContract: "Return only the answer.",
  examples: [
    { input: "say hi", output: "Hi." },
    { input: "say bye", output: "Bye." },
  ],
};

describe("compileSpec", () => {
  it("emits system, then each example as a user/assistant turn, then the real user input", () => {
    const msgs = compileSpec(base, "say hello");
    expect(msgs.map((m) => m.role)).toEqual([
      "system",
      "user",
      "assistant",
      "user",
      "assistant",
      "user",
    ]);
    expect(msgs[1]).toEqual({ role: "user", content: "say hi" });
    expect(msgs[2]).toEqual({ role: "assistant", content: "Hi." });
    expect(msgs[5]).toEqual({ role: "user", content: "say hello" });
  });

  it("the system message carries role, every rule, the house rules, and the contract", () => {
    const sys = compileSpec(base, "x")[0].content;
    expect(sys).toContain("You are a careful assistant.");
    expect(sys).toContain("Keep it short.");
    expect(sys).toContain("Use plain words.");
    expect(sys).toContain(HOUSE_RULES[0]);
    expect(sys).toContain("Return only the answer.");
  });

  it("omitHouseRules drops the shared block", () => {
    const sys = compileSpec({ ...base, omitHouseRules: true }, "x")[0].content;
    expect(sys).not.toContain(HOUSE_RULES[0]);
  });

  it("no examples → just system + the real user turn", () => {
    const msgs = compileSpec({ ...base, examples: [] }, "only me");
    expect(msgs.map((m) => m.role)).toEqual(["system", "user"]);
    expect(msgs[1].content).toBe("only me");
  });
});
