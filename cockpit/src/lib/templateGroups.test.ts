import { describe, expect, it } from "vitest";

import { groupTemplates, PROMPT_TEMPLATE_WHERE } from "./templateGroups";

const t = (name: string, category: string | null, builtin = false, favorite = false) => ({ name, category, builtin, favorite });

describe("templateGroups", () => {
  it("PROMPT_TEMPLATE_WHERE excludes techniques and archived", () => {
    expect(PROMPT_TEMPLATE_WHERE).toEqual({ kind: "prompt", archived: false });
  });

  it("groups by title-cased category, categories sorted alpha", () => {
    const groups = groupTemplates([t("A", "proposal"), t("B", "email"), t("C", "proposal")]);
    expect(groups.map((g) => g.label)).toEqual(["Email", "Proposal"]);
    expect(groups.find((g) => g.label === "Proposal")!.templates.map((x) => x.name)).toEqual(["A", "C"]);
  });

  it("buckets null/blank category by source, after the categories", () => {
    const groups = groupTemplates([t("U", null, false), t("Z", "proposal"), t("Bi", "  ", true)]);
    expect(groups.map((g) => g.label)).toEqual(["Proposal", "Built-in", "Your templates"]);
  });

  it("sorts favorites first within a group, then by name", () => {
    const groups = groupTemplates([t("b", "x"), t("a", "x"), t("c", "x", false, true)]);
    expect(groups[0].templates.map((x) => x.name)).toEqual(["c", "a", "b"]);
  });

  it("normalizes category case/words into one group", () => {
    const groups = groupTemplates([t("A", "EMAIL"), t("B", "email"), t("C", "sales proposals")]);
    expect(groups.map((g) => g.label)).toEqual(["Email", "Sales Proposals"]);
    expect(groups.find((g) => g.label === "Email")!.templates.map((x) => x.name)).toEqual(["A", "B"]);
  });
});
