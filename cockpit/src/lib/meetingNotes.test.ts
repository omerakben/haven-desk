import { describe, expect, it } from "vitest";

import { gateMeetingTasks } from "./meetingNotes";

// Tuesday June 9, 2026, 21:30 local (mirrors quickDates.test.ts so the UTC-noon
// due dates are timezone-robust).
const NOW = new Date(2026, 5, 9, 21, 30);

describe("gateMeetingTasks", () => {
  it("keeps non-empty trimmed titles and drops blanks", () => {
    const r = gateMeetingTasks({ tasks: [{ title: "  Email the vendor " }, { title: "" }, { title: "   " }] }, NOW);
    expect(r.tasks.map((t) => t.title)).toEqual(["Email the vendor"]);
    expect(r.dropped).toBe(2);
  });

  it("dedupes by case-insensitive title", () => {
    const r = gateMeetingTasks({ tasks: [{ title: "Call Sam" }, { title: "call sam" }] }, NOW);
    expect(r.tasks).toHaveLength(1);
    expect(r.dropped).toBe(1);
  });

  it("extracts a due date from the due field", () => {
    const r = gateMeetingTasks({ tasks: [{ title: "Send invoice", due: "tomorrow" }] }, NOW);
    expect(r.tasks[0].dueDate).toBe("2026-06-10");
    expect(r.tasks[0].dueLabel).toBe("tomorrow");
  });

  it("falls back to extracting a due date from the title", () => {
    const r = gateMeetingTasks({ tasks: [{ title: "Follow up in 3 days" }] }, NOW);
    expect(r.tasks[0].dueDate).toBe("2026-06-12");
  });

  it("leaves dueDate null when no date phrase is present", () => {
    const r = gateMeetingTasks({ tasks: [{ title: "Fix the login bug" }] }, NOW);
    expect(r.tasks[0].dueDate).toBeNull();
    expect(r.tasks[0].dueLabel).toBeNull();
  });

  it("keeps an owner trimmed, or null", () => {
    const r = gateMeetingTasks({ tasks: [{ title: "X", owner: "  Dana " }, { title: "Y" }] }, NOW);
    expect(r.tasks[0].owner).toBe("Dana");
    expect(r.tasks[1].owner).toBeNull();
  });

  it("accepts a bare array as well as { tasks: [...] }", () => {
    expect(gateMeetingTasks([{ title: "A" }], NOW).tasks).toHaveLength(1);
  });

  it("caps the list at 25 and counts the overflow as dropped", () => {
    const many = Array.from({ length: 30 }, (_, i) => ({ title: `Task ${i}` }));
    const r = gateMeetingTasks({ tasks: many }, NOW);
    expect(r.tasks).toHaveLength(25);
    expect(r.dropped).toBe(5);
  });

  it("returns an empty list on garbage input", () => {
    expect(gateMeetingTasks(null, NOW).tasks).toEqual([]);
    expect(gateMeetingTasks({}, NOW).tasks).toEqual([]);
    expect(gateMeetingTasks("nope", NOW).tasks).toEqual([]);
  });
});
