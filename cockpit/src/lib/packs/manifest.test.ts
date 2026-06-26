import { describe, expect, it } from "vitest";

import {
  defaultPermissions,
  validatePackManifest,
  type PluginManifest,
} from "./manifest";
import { qaProductOpsPack, smallBusinessOpsPack } from "./examples";

// A known-good L0 manifest. Each test clones this and breaks exactly one rule,
// the way adrLint.test.ts feeds one malformed ADR per assertion.
function validManifest(): PluginManifest {
  return {
    slug: "demo-pack",
    name: "Demo Pack",
    version: "1.0.0",
    description: "A demo pack used by the validator tests.",
    audience: "small-business",
    industry: "general",
    maturity: "L0",
    capabilities: ["Do a useful thing"],
    requiredModels: ["gemma4:e4b"],
    templates: [],
    memoryFacts: [],
    taskSeeds: [],
    knowledgeSources: [],
    gates: [],
    routes: [],
    mcpTools: [],
    permissions: defaultPermissions(),
    setupChecks: [],
  };
}

const errorsOf = (r: ReturnType<typeof validatePackManifest>) =>
  r.issues.filter((i) => i.severity === "ERROR");
const warningsOf = (r: ReturnType<typeof validatePackManifest>) =>
  r.issues.filter((i) => i.severity === "WARN");
const errorField = (r: ReturnType<typeof validatePackManifest>, field: string) =>
  r.issues.some((i) => i.severity === "ERROR" && i.field.includes(field));
const warnField = (r: ReturnType<typeof validatePackManifest>, field: string) =>
  r.issues.some((i) => i.severity === "WARN" && i.field.includes(field));

describe("validatePackManifest — happy path", () => {
  it("passes a minimal valid L0 manifest", () => {
    const r = validatePackManifest(validManifest());
    expect(r.ok).toBe(true);
    expect(errorsOf(r)).toHaveLength(0);
  });

  it("returns the result shape (issues, summary, ok)", () => {
    const r = validatePackManifest(validManifest());
    expect(Array.isArray(r.issues)).toBe(true);
    expect(r.summary.errors).toBe(errorsOf(r).length);
    expect(r.summary.warnings).toBe(warningsOf(r).length);
    expect(r.ok).toBe(r.summary.errors === 0);
  });
});

describe("validatePackManifest — input robustness", () => {
  it("rejects a non-object input", () => {
    expect(validatePackManifest(null).ok).toBe(false);
    expect(validatePackManifest("nope").ok).toBe(false);
    expect(validatePackManifest(42).ok).toBe(false);
  });
});

describe("validatePackManifest — identity", () => {
  it("rejects a missing slug", () => {
    const m = validManifest();
    // @ts-expect-error intentionally invalid
    delete m.slug;
    expect(errorField(validatePackManifest(m), "slug")).toBe(true);
  });

  it("rejects a non-kebab-case slug", () => {
    for (const bad of ["Demo Pack", "demo_pack", "Demo-Pack", "demo--pack", "-demo"]) {
      const m = validManifest();
      m.slug = bad;
      expect(errorField(validatePackManifest(m), "slug")).toBe(true);
    }
  });

  it("rejects a missing name", () => {
    const m = validManifest();
    m.name = "";
    expect(errorField(validatePackManifest(m), "name")).toBe(true);
  });

  it("rejects a non-semver version", () => {
    for (const bad of ["1.0", "v1", "abc", "1"]) {
      const m = validManifest();
      m.version = bad;
      expect(errorField(validatePackManifest(m), "version")).toBe(true);
    }
  });

  it("accepts a semver version with a prerelease tag", () => {
    const m = validManifest();
    m.version = "1.2.0-beta.1";
    expect(errorField(validatePackManifest(m), "version")).toBe(false);
  });

  it("rejects an empty description", () => {
    const m = validManifest();
    m.description = "   ";
    expect(errorField(validatePackManifest(m), "description")).toBe(true);
  });

  it("rejects an empty industry", () => {
    const m = validManifest();
    m.industry = "";
    expect(errorField(validatePackManifest(m), "industry")).toBe(true);
  });

  it("rejects an unknown audience", () => {
    const m = validManifest();
    // @ts-expect-error intentionally invalid
    m.audience = "wizards";
    expect(errorField(validatePackManifest(m), "audience")).toBe(true);
  });

  it("rejects an unknown maturity", () => {
    const m = validManifest();
    // @ts-expect-error intentionally invalid
    m.maturity = "L9";
    expect(errorField(validatePackManifest(m), "maturity")).toBe(true);
  });
});

describe("validatePackManifest — content arrays", () => {
  it("rejects empty capabilities", () => {
    const m = validManifest();
    m.capabilities = [];
    expect(errorField(validatePackManifest(m), "capabilities")).toBe(true);
  });

  it("rejects empty requiredModels", () => {
    const m = validManifest();
    m.requiredModels = [];
    expect(errorField(validatePackManifest(m), "requiredModels")).toBe(true);
  });

  it("rejects a blank requiredModels entry", () => {
    const m = validManifest();
    m.requiredModels = ["gemma4:e4b", "  "];
    expect(errorField(validatePackManifest(m), "requiredModels")).toBe(true);
  });

  it("rejects duplicate template slugs", () => {
    const m = validManifest();
    m.templates = [
      { slug: "t-a", kind: "prompt", name: "A", body: "x" },
      { slug: "t-a", kind: "prompt", name: "A2", body: "y" },
    ];
    expect(errorField(validatePackManifest(m), "templates")).toBe(true);
  });

  it("rejects duplicate fact sourceKeys", () => {
    const m = validManifest();
    m.memoryFacts = [
      { sourceKey: "f-1", value: "one" },
      { sourceKey: "f-1", value: "two" },
    ];
    expect(errorField(validatePackManifest(m), "memoryFacts")).toBe(true);
  });

  it("rejects duplicate task seed sourceKeys", () => {
    const m = validManifest();
    m.taskSeeds = [
      { sourceKey: "s-1", title: "one" },
      { sourceKey: "s-1", title: "two" },
    ];
    expect(errorField(validatePackManifest(m), "taskSeeds")).toBe(true);
  });

  it("rejects a template missing a required sub-field", () => {
    const m = validManifest();
    m.templates = [{ slug: "t-a", kind: "prompt", name: "A", body: "" }];
    expect(errorField(validatePackManifest(m), "templates")).toBe(true);
  });

  it("rejects a fact missing value", () => {
    const m = validManifest();
    m.memoryFacts = [{ sourceKey: "f-1", value: "" }];
    expect(errorField(validatePackManifest(m), "memoryFacts")).toBe(true);
  });

  it("rejects a task missing title", () => {
    const m = validManifest();
    m.taskSeeds = [{ sourceKey: "s-1", title: "" }];
    expect(errorField(validatePackManifest(m), "taskSeeds")).toBe(true);
  });

  it("rejects a knowledge source with neither path nor owuiUrl", () => {
    const m = validManifest();
    m.knowledgeSources = [{ label: "Docs" }];
    expect(errorField(validatePackManifest(m), "knowledgeSources")).toBe(true);
  });

  it("accepts a knowledge source with a path or an owuiUrl", () => {
    const withPath = validManifest();
    withPath.knowledgeSources = [{ label: "Docs", path: "./docs" }];
    expect(errorField(validatePackManifest(withPath), "knowledgeSources")).toBe(false);

    const withUrl = validManifest();
    withUrl.knowledgeSources = [{ label: "KB", owuiUrl: "http://localhost:4142/x" }];
    expect(errorField(validatePackManifest(withUrl), "knowledgeSources")).toBe(false);
  });
});

describe("validatePackManifest — local-first permission invariants", () => {
  it.each(["network", "externalSend", "runtimeCode", "autonomous"] as const)(
    "rejects permissions.%s = true in v1",
    (perm) => {
      const m = validManifest();
      m.permissions = { ...defaultPermissions(), [perm]: true };
      expect(errorField(validatePackManifest(m), perm)).toBe(true);
    },
  );

  it("allows readsLocalFiles = true", () => {
    const m = validManifest();
    m.maturity = "L1";
    m.permissions = { ...defaultPermissions(), readsLocalFiles: true };
    expect(errorsOf(validatePackManifest(m))).toHaveLength(0);
  });
});

describe("validatePackManifest — maturity coherence", () => {
  it("rejects routes at L0 (content only)", () => {
    const m = validManifest();
    m.routes = ["/tools/x"];
    expect(errorField(validatePackManifest(m), "routes")).toBe(true);
  });

  it("rejects mcpTools at L0 (content only)", () => {
    const m = validManifest();
    m.mcpTools = ["read.project"];
    expect(errorField(validatePackManifest(m), "mcpTools")).toBe(true);
  });

  it("rejects mcpProposeWrites below L2", () => {
    const m = validManifest();
    m.maturity = "L1";
    m.routes = ["/tools/x"];
    m.permissions = { ...defaultPermissions(), mcpProposeWrites: true };
    expect(errorField(validatePackManifest(m), "mcpProposeWrites")).toBe(true);
  });

  it("allows mcpProposeWrites at L2", () => {
    const m = validManifest();
    m.maturity = "L2";
    m.mcpTools = ["propose.task"];
    m.permissions = { ...defaultPermissions(), mcpProposeWrites: true };
    expect(errorField(validatePackManifest(m), "mcpProposeWrites")).toBe(false);
  });

  it("warns when L2/L3 declares no mcpTools", () => {
    const m = validManifest();
    m.maturity = "L2";
    m.mcpTools = [];
    expect(warnField(validatePackManifest(m), "mcpTools")).toBe(true);
  });

  it("warns when a route does not start with /", () => {
    const m = validManifest();
    m.maturity = "L1";
    m.routes = ["tools/x"];
    expect(warnField(validatePackManifest(m), "routes")).toBe(true);
  });
});

describe("validatePackManifest — high-stakes guardrails (hard gate)", () => {
  it("blocks a high-stakes industry running above L1", () => {
    const m = validManifest();
    m.industry = "legal admin";
    m.maturity = "L2";
    m.mcpTools = ["read.docs"];
    m.setupChecks = ["Stays read-only and human-approved; not legal advice."];
    const r = validatePackManifest(m);
    expect(errorField(r, "maturity")).toBe(true);
    expect(r.ok).toBe(false);
  });

  it("blocks a high-stakes industry with no guardrail note in setupChecks", () => {
    const m = validManifest();
    m.industry = "tax preparation";
    m.setupChecks = [];
    const r = validatePackManifest(m);
    expect(errorField(r, "setupChecks")).toBe(true);
    expect(r.ok).toBe(false);
  });

  it("passes a high-stakes industry that declares a guardrail note at L0/L1", () => {
    const m = validManifest();
    m.industry = "tax preparation";
    m.setupChecks = ["Read-only prep and checklists only; not tax advice; user reviews every draft."];
    const r = validatePackManifest(m);
    expect(errorField(r, "setupChecks")).toBe(false);
    expect(r.ok).toBe(true);
  });
});

describe("example packs validate clean", () => {
  it("Small Business Ops pack passes with zero errors", () => {
    const r = validatePackManifest(smallBusinessOpsPack);
    expect(r.ok).toBe(true);
    expect(errorsOf(r)).toHaveLength(0);
  });

  it("QA and Product Ops pack passes with zero errors", () => {
    const r = validatePackManifest(qaProductOpsPack);
    expect(r.ok).toBe(true);
    expect(errorsOf(r)).toHaveLength(0);
  });
});
