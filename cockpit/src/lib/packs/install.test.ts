import { describe, expect, it } from "vitest";

import { buildInstallPlan } from "./install";
import { smallBusinessOpsPack } from "./examples";

describe("buildInstallPlan", () => {
  it("maps a pack's content to upsert specs keyed by slug/sourceKey", () => {
    const plan = buildInstallPlan(smallBusinessOpsPack, null);
    expect(plan.packSlug).toBe("small-business-ops");
    expect(plan.counts).toEqual({ templates: 6, facts: 2, tasks: 2 });
    expect(plan.templates.map((t) => t.slug)).toContain("sbo-meeting-notes-to-tasks");
    expect(plan.facts.map((f) => f.sourceKey)).toContain("sbo-fact-tone");
    expect(plan.tasks.map((t) => t.sourceKey)).toContain("sbo-task-setup-project");
  });

  it("seeds facts as active manual memory and un-trashes on reinstall", () => {
    const plan = buildInstallPlan(smallBusinessOpsPack, null);
    const fact = plan.facts.find((f) => f.sourceKey === "sbo-fact-tone")!;
    expect(fact.create.status).toBe("active");
    expect(fact.create.source).toBe("manual");
    expect(fact.create.sourceKey).toBe("sbo-fact-tone");
    expect(fact.create.value).toMatch(/warm/i);
    // deletedAt:null on both so a reinstall restores a trashed fact.
    expect(fact.create.deletedAt).toBeNull();
    expect(fact.update.deletedAt).toBeNull();
  });

  it("preserves a user's task status on reinstall (update omits status/completedAt)", () => {
    const plan = buildInstallPlan(smallBusinessOpsPack, null);
    const task = plan.tasks[0];
    expect(task.create.status).toBe("todo");
    // Reinstall must not reset a done task back to todo.
    expect("status" in task.update).toBe(false);
    expect("completedAt" in task.update).toBe(false);
  });

  it("un-archives a pack template on reinstall (archived:false on create and update)", () => {
    const plan = buildInstallPlan(smallBusinessOpsPack, null);
    expect(plan.templates[0].create.archived).toBe(false);
    expect(plan.templates[0].update.archived).toBe(false);
  });

  it("applies the target projectId to create and update rows (null = global)", () => {
    const g = buildInstallPlan(smallBusinessOpsPack, null);
    for (const t of g.templates) expect(t.create.projectId).toBeNull();
    for (const f of g.facts) expect(f.create.projectId).toBeNull();
    for (const k of g.tasks) {
      expect(k.create.projectId).toBeNull();
      expect(k.update.projectId).toBeNull();
    }

    const p = buildInstallPlan(smallBusinessOpsPack, "proj-1");
    for (const t of p.templates) expect(t.create.projectId).toBe("proj-1");
    for (const f of p.facts) expect(f.create.projectId).toBe("proj-1");
    for (const k of p.tasks) expect(k.create.projectId).toBe("proj-1");
  });

  it("defaults task status to todo, template kind to prompt, variables to [], pinned to false", () => {
    const pack = {
      ...smallBusinessOpsPack,
      templates: [{ slug: "x-t", kind: "prompt" as const, name: "X", body: "b" }],
      taskSeeds: [{ sourceKey: "x-s", title: "T" }],
      memoryFacts: [{ sourceKey: "x-f", value: "v" }],
    };
    const plan = buildInstallPlan(pack, null);
    expect(plan.tasks[0].create.status).toBe("todo");
    expect(plan.templates[0].create.kind).toBe("prompt");
    expect(plan.templates[0].create.variables).toBe("[]");
    expect(plan.facts[0].create.pinned).toBe(false);
  });

  it("is deterministic (same input yields the same plan)", () => {
    const a = buildInstallPlan(smallBusinessOpsPack, "p");
    const b = buildInstallPlan(smallBusinessOpsPack, "p");
    expect(b).toEqual(a);
  });
});
