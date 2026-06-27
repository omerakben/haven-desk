import { describe, expect, it } from "vitest";

import { BUILTIN_STARTERS, INBOX_TARGET, IMAGE_TARGET, EMAIL_TARGET, MEETING_TARGET, INBOX_FIELD } from "./quickActions";
import { buildStarterSeedPlan, parseInputs, validateStarter } from "./starters";

describe("starters", () => {
  it("buildStarterSeedPlan produces one row per builtin with unique keys, JSON inputs, ascending order", () => {
    const plan = buildStarterSeedPlan(BUILTIN_STARTERS);
    expect(plan).toHaveLength(BUILTIN_STARTERS.length);
    const keys = new Set(plan.map((r) => r.sourceKey));
    expect(keys.size).toBe(plan.length); // all unique
    expect(plan.every((r) => r.builtin === true)).toBe(true);
    expect(plan.every((r) => typeof r.inputs === "string" && JSON.parse(r.inputs))).toBeTruthy();
    expect(plan.map((r) => r.order)).toEqual(plan.map((_, i) => i)); // 0..n-1
  });

  it("parseInputs accepts a flat string map and rejects anything else", () => {
    expect(parseInputs('{"a":"b"}')).toEqual({ a: "b" });
    expect(parseInputs("not json")).toBeNull();
    expect(parseInputs("[1,2]")).toBeNull();
    expect(parseInputs('{"a":1}')).toBeNull(); // non-string value
  });

  it("validateStarter requires a known target", () => {
    expect(validateStarter("no-such-action", "X", { a: "b" }).ok).toBe(false);
  });

  it("validateStarter requires an action starter to fill the action's required inputs", () => {
    // reply-to-message requires `message` and `intent`.
    expect(validateStarter("reply-to-message", "X", { message: "hi" }).ok).toBe(false);
    expect(validateStarter("reply-to-message", "X", { message: "hi", intent: "yes" }).ok).toBe(true);
  });

  it("validateStarter requires non-empty text for an inbox starter", () => {
    expect(validateStarter(INBOX_TARGET, "X", { [INBOX_FIELD]: "" }).ok).toBe(false);
    expect(validateStarter(INBOX_TARGET, "X", { [INBOX_FIELD]: "a note" }).ok).toBe(true);
  });

  it("validateStarter treats image/email/meeting starters like inbox (non-empty text)", () => {
    for (const target of [IMAGE_TARGET, EMAIL_TARGET, MEETING_TARGET]) {
      expect(validateStarter(target, "X", { [INBOX_FIELD]: "" }).ok, `${target} empty`).toBe(false);
      expect(validateStarter(target, "X", { [INBOX_FIELD]: "some text" }).ok, `${target} filled`).toBe(true);
    }
  });

  it("every built-in starter passes validation (no unrunnable seed)", () => {
    for (const s of BUILTIN_STARTERS) {
      expect(validateStarter(s.target, s.label, s.inputs), `${s.key} invalid`).toEqual({ ok: true });
    }
  });

  it("validateStarter caps label length and inputs size", () => {
    expect(validateStarter(INBOX_TARGET, "x".repeat(101), { [INBOX_FIELD]: "a" }).ok).toBe(false);
    const big = "x".repeat(9000);
    expect(validateStarter(INBOX_TARGET, "X", { [INBOX_FIELD]: big }).ok).toBe(false);
  });

  it("validateStarter rejects an empty label", () => {
    expect(validateStarter(INBOX_TARGET, "   ", { [INBOX_FIELD]: "a" }).ok).toBe(false);
  });
});
