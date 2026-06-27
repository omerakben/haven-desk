import { describe, expect, it } from "vitest";

import { QUICK_ACTION_ICONS } from "./quickActionIcons";
import {
  QUICK_ACTIONS,
  getQuickAction,
  missingInputs,
  buildMessages,
  getFeaturedDemo,
  searchQuickActions,
  pushRecent,
  recentActions,
  RECENTS_CAP,
  REFINE_OPTIONS,
  getRefineOption,
  buildRefineMessages,
  getHeroIds,
  HERO_IDS_BY_PERSONA,
  DEFAULT_HERO_IDS,
  TEXT_STARTER_TARGETS,
} from "./quickActions";

describe("quickActions", () => {
  it("getHeroIds maps every persona to 6 REAL actions; default otherwise (catches a typo'd id)", () => {
    const ids = new Set(QUICK_ACTIONS.map((a) => a.id));
    const check = (list: string[], label: string) => {
      expect(list, `${label} should have 6 heroes`).toHaveLength(6);
      for (const h of list) expect(ids.has(h), `${label}: '${h}' is not a real action`).toBe(true);
    };
    check(DEFAULT_HERO_IDS, "default");
    for (const [persona, list] of Object.entries(HERO_IDS_BY_PERSONA)) check(list, persona);
    // null / unknown / "skipped" fall back to the default; a known persona differs.
    expect(getHeroIds(null)).toEqual(DEFAULT_HERO_IDS);
    expect(getHeroIds("skipped")).toEqual(DEFAULT_HERO_IDS);
    expect(getHeroIds("household")).toEqual(HERO_IDS_BY_PERSONA.household);
    expect(getHeroIds("small-business")).not.toEqual(DEFAULT_HERO_IDS);
  });

  it("every action's icon is in the shared QUICK_ACTION_ICONS map (gallery + dashboard render the real icon)", () => {
    for (const a of QUICK_ACTIONS) {
      expect(QUICK_ACTION_ICONS[a.icon], `action '${a.id}' icon '${a.icon}' is not mapped`).toBeTruthy();
    }
  });

  it("no single-text starter target collides with a real action id (validateStarter would shadow it)", () => {
    const actionIds = new Set(QUICK_ACTIONS.map((a) => a.id));
    for (const target of TEXT_STARTER_TARGETS) {
      expect(actionIds.has(target), `target '${target}' must not also be an action id`).toBe(false);
    }
  });

  it("every action has a unique id, at least one input, and a system prompt", () => {
    const ids = new Set<string>();
    for (const a of QUICK_ACTIONS) {
      expect(a.id).toBeTruthy();
      expect(ids.has(a.id), `duplicate id ${a.id}`).toBe(false);
      ids.add(a.id);
      expect(a.inputs.length).toBeGreaterThan(0);
      expect(a.system.trim().length).toBeGreaterThan(0);
      expect(a.title.trim().length).toBeGreaterThan(0);
    }
  });

  it("getQuickAction finds by id and returns undefined for unknown", () => {
    expect(getQuickAction("summarize")?.title).toBe("Summarize this");
    expect(getQuickAction("does-not-exist")).toBeUndefined();
  });

  it("missingInputs lists required-but-empty inputs and ignores optional ones", () => {
    const a = getQuickAction("meal-plan")!; // preferences required, days optional
    expect(missingInputs(a, {})).toContain("Any preferences or restrictions?");
    expect(missingInputs(a, {})).not.toContain("How many days?");
    expect(missingInputs(a, { preferences: "vegetarian" })).toEqual([]);
    expect(missingInputs(a, { preferences: "   " })).not.toEqual([]); // whitespace is empty
  });

  it("treats non-string input values as empty and never throws", () => {
    const a = getQuickAction("summarize")!;
    const bad = { text: 123 as unknown as string };
    expect(missingInputs(a, bad)).toContain("Paste the text");
    expect(() => buildMessages(a, bad)).not.toThrow();
  });

  it("canSaveTasks is set on exactly the list/plan actions", () => {
    const flagged = QUICK_ACTIONS.filter((a) => a.canSaveTasks).map((a) => a.id).sort();
    expect(flagged).toEqual(["find-action-items", "notes-to-list", "plan-week", "study-plan"]);
  });

  it("buildMessages returns a system message then a user message embedding the inputs", () => {
    const a = getQuickAction("summarize")!;
    const msgs = buildMessages(a, { text: "a distinctive phrase to find" });
    expect(msgs).toHaveLength(2);
    expect(msgs[0].role).toBe("system");
    expect(msgs[1].role).toBe("user");
    expect(msgs[1].content).toContain("a distinctive phrase to find");
  });

  it("every action's buildPrompt produces non-empty text for filled inputs", () => {
    for (const a of QUICK_ACTIONS) {
      const filled = Object.fromEntries(a.inputs.map((i) => [i.name, "sample value"]));
      expect(a.buildPrompt(filled).trim().length, `${a.id} prompt empty`).toBeGreaterThan(0);
    }
  });

  it("every action has at least one example", () => {
    for (const a of QUICK_ACTIONS) {
      expect(a.examples?.length ?? 0, `${a.id} has no example`).toBeGreaterThan(0);
    }
  });

  it("every example has a label and fills its action's required inputs", () => {
    for (const a of QUICK_ACTIONS) {
      for (const ex of a.examples ?? []) {
        expect(ex.label.trim().length, `${a.id} example label empty`).toBeGreaterThan(0);
        expect(missingInputs(a, ex.inputs), `${a.id} example "${ex.label}" is missing inputs`).toEqual([]);
      }
    }
  });

  it("the featured demo resolves to a real action and a valid example", () => {
    const f = getFeaturedDemo();
    expect(f).not.toBeNull();
    expect(f!.action.id).toBeTruthy();
    expect(missingInputs(f!.action, f!.example.inputs)).toEqual([]);
  });

  it("searchQuickActions returns everything for an empty query and filters on a term", () => {
    expect(searchQuickActions("")).toHaveLength(QUICK_ACTIONS.length);
    expect(searchQuickActions("   ")).toHaveLength(QUICK_ACTIONS.length);
    const replies = searchQuickActions("reply");
    expect(replies.length).toBeGreaterThan(0);
    expect(replies.every((a) => `${a.title} ${a.blurb}`.toLowerCase().includes("reply"))).toBe(true);
    expect(searchQuickActions("zzzz-no-such-thing")).toEqual([]);
  });

  it("searchQuickActions matches across hyphen/space (the 'thank you' → 'thank-you' case)", () => {
    const hits = searchQuickActions("thank you");
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.some((a) => a.id === "thank-you-note")).toBe(true);
    // and the reverse: hyphenated query against spaced text
    expect(searchQuickActions("to-do").some((a) => a.id === "notes-to-list")).toBe(true);
  });

  it("searchQuickActions also matches the category label", () => {
    // "plan" is a category label; at least the meal/week planners should surface.
    expect(searchQuickActions("plan").length).toBeGreaterThan(0);
  });

  it("pushRecent puts the id first, de-dupes, and caps the list", () => {
    expect(pushRecent([], "a")).toEqual(["a"]);
    expect(pushRecent(["a", "b"], "b")).toEqual(["b", "a"]); // moves to front, no dup
    expect(pushRecent(["a", "b"], "c")).toEqual(["c", "a", "b"]);
    const many = Array.from({ length: RECENTS_CAP }, (_, i) => `x${i}`);
    expect(pushRecent(many, "new")).toHaveLength(RECENTS_CAP);
    expect(pushRecent(many, "new")[0]).toBe("new");
  });

  it("recentActions resolves ids to actions and drops unknown ones", () => {
    const ids = ["summarize", "does-not-exist", "meal-plan"];
    const acts = recentActions(ids);
    expect(acts.map((a) => a.id)).toEqual(["summarize", "meal-plan"]);
  });

  it("refine options each have a unique id, a label, and a non-empty instruction", () => {
    const ids = new Set<string>();
    for (const r of REFINE_OPTIONS) {
      expect(r.id).toBeTruthy();
      expect(ids.has(r.id), `duplicate refine id ${r.id}`).toBe(false);
      ids.add(r.id);
      expect(r.label.trim().length).toBeGreaterThan(0);
      expect(r.instruction.trim().length).toBeGreaterThan(0);
    }
    expect(getRefineOption("shorter")?.label).toBe("Shorter");
    expect(getRefineOption("nope")).toBeUndefined();
  });

  it("buildRefineMessages embeds the text and the instruction", () => {
    const msgs = buildRefineMessages("a draft to revise", "Make it shorter.");
    expect(msgs).toHaveLength(2);
    expect(msgs[0].role).toBe("system");
    expect(msgs[1].role).toBe("user");
    expect(msgs[1].content).toContain("a draft to revise");
    expect(msgs[1].content).toContain("Make it shorter.");
  });
});
