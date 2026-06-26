// Declarative plugin/pack contract for Haven Desk (the monetizable transition of
// Swiss Knife). A pack is data, not code: it carries templates, memory facts,
// task seeds, prompts, knowledge links, and the deterministic gates and routes it
// relies on. v1 is this TypeScript type plus the pure validator below. No
// marketplace, no arbitrary runtime code.
//
// The validator mirrors the house lint pattern (see adrLint.ts / gherkinLint.ts):
// pure functions, ERROR = a gate that blocks install, WARN = advisory. It encodes
// the project's hard constraints as ERRORs so a pack can never declare its way
// around local-first: no external network, no sending, no code execution, no
// unattended action in v1. Seeding stays idempotent because the seed loader keys
// on the same sourceKey / slug columns the schema already enforces as unique.

export type PackMaturity = "L0" | "L1" | "L2" | "L3";
export type PackAudience =
  | "household"
  | "student"
  | "small-business"
  | "creative"
  | "personal-admin"
  | "professional";

export const PACK_MATURITIES: PackMaturity[] = ["L0", "L1", "L2", "L3"];
export const PACK_AUDIENCES: PackAudience[] = [
  "household",
  "student",
  "small-business",
  "creative",
  "personal-admin",
  "professional",
];

// High-stakes industries must stay read-only, cited, draft/checklist, and
// human-approved. Matched as a substring against a lowercased industry string.
export const HIGH_STAKES_INDUSTRY_KEYWORDS = [
  "legal",
  "medical",
  "health",
  "finance",
  "financial",
  "tax",
  "immigration",
];

export type PackTemplate = {
  slug: string;
  kind: "prompt" | "technique";
  name: string;
  body: string;
  description?: string;
  category?: string;
  variables?: string; // JSON string, matches Template.variables
};

export type PackFact = {
  sourceKey: string;
  value: string;
  key?: string;
  category?: string;
  pinned?: boolean;
};

export type PackTask = {
  sourceKey: string;
  title: string;
  status?: "todo" | "doing" | "done";
  module?: string;
  notes?: string;
};

export type PackKnowledge = {
  label: string;
  path?: string; // local path, relative to the project
  owuiUrl?: string; // deep-link to an Open WebUI knowledge base
};

// Default-deny. Anything not explicitly granted is off. The four "must stay
// false in v1" flags are the local-first invariants; the validator errors if a
// pack sets them.
export type PackPermissions = {
  readsLocalFiles: boolean; // L1+ may read local files for a workflow
  network: boolean; // external network — must be false in v1
  externalSend: boolean; // send data out (email/post/upload) — must be false in v1
  mcpProposeWrites: boolean; // MCP proposal-only writes to a review queue — L2+
  runtimeCode: boolean; // arbitrary code execution — must be false in v1
  autonomous: boolean; // unattended action without review — must be false in v1
};

export type PluginManifest = {
  slug: string;
  name: string;
  version: string;
  description: string;
  audience: PackAudience;
  industry: string;
  maturity: PackMaturity;
  capabilities: string[];
  requiredModels: string[];
  templates: PackTemplate[];
  memoryFacts: PackFact[];
  taskSeeds: PackTask[];
  knowledgeSources: PackKnowledge[];
  gates: string[];
  routes: string[];
  mcpTools: string[];
  permissions: PackPermissions;
  setupChecks: string[];
};

export type PackSeverity = "ERROR" | "WARN";
export type PackIssue = { severity: PackSeverity; field: string; message: string };
export type PackValidationResult = {
  issues: PackIssue[];
  summary: {
    errors: number;
    warnings: number;
    maturity: string | null;
    templates: number;
    memoryFacts: number;
    taskSeeds: number;
  };
  ok: boolean;
};

/** All-false permission set. Use as the base for every manifest. */
export function defaultPermissions(): PackPermissions {
  return {
    readsLocalFiles: false,
    network: false,
    externalSend: false,
    mcpProposeWrites: false,
    runtimeCode: false,
    autonomous: false,
  };
}

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SEMVER_RE = /^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)*$/;
const GUARDRAIL_HINTS = [
  "read-only",
  "read only",
  "review",
  "approved",
  "checklist",
  "draft",
  "cited",
  "no advice",
  "not legal",
  "not medical",
  "not tax",
  "not financial",
];

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
function asArray(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}
function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}
function levelRank(m: string | undefined): number {
  return m ? PACK_MATURITIES.indexOf(m as PackMaturity) : -1;
}

/**
 * Validate a plugin/pack manifest. Pure and dependency-free: no model call, no
 * I/O. ERROR issues block install (ok === false); WARN issues advise.
 */
export function validatePackManifest(input: unknown): PackValidationResult {
  const issues: PackIssue[] = [];
  const err = (field: string, message: string) => issues.push({ severity: "ERROR", field, message });
  const warn = (field: string, message: string) => issues.push({ severity: "WARN", field, message });

  if (!isObject(input)) {
    return {
      issues: [{ severity: "ERROR", field: "manifest", message: "Manifest must be an object." }],
      summary: { errors: 1, warnings: 0, maturity: null, templates: 0, memoryFacts: 0, taskSeeds: 0 },
      ok: false,
    };
  }
  const m = input;

  // Identity.
  if (!isNonEmptyString(m.slug)) err("slug", "`slug` is required.");
  else if (!SLUG_RE.test(m.slug)) err("slug", `\`slug\` "${m.slug}" must be kebab-case (a-z, 0-9, single hyphens).`);
  if (!isNonEmptyString(m.name)) err("name", "`name` is required.");
  if (!isNonEmptyString(m.version)) err("version", "`version` is required.");
  else if (!SEMVER_RE.test(m.version)) err("version", `\`version\` "${m.version}" is not semver (major.minor.patch).`);
  if (!isNonEmptyString(m.description)) err("description", "`description` is required.");
  if (!isNonEmptyString(m.industry)) err("industry", "`industry` is required.");
  if (!PACK_AUDIENCES.includes(m.audience as PackAudience))
    err("audience", `\`audience\` must be one of: ${PACK_AUDIENCES.join(", ")}.`);
  const maturity = PACK_MATURITIES.includes(m.maturity as PackMaturity) ? (m.maturity as PackMaturity) : null;
  if (!maturity) err("maturity", `\`maturity\` must be one of: ${PACK_MATURITIES.join(", ")}.`);

  // Capabilities and models.
  const capabilities = asArray(m.capabilities);
  if (capabilities.length === 0) err("capabilities", "A pack must declare at least one capability.");
  const requiredModels = asArray(m.requiredModels);
  if (requiredModels.length === 0) err("requiredModels", "`requiredModels` must list at least one model.");
  else if (!requiredModels.every(isNonEmptyString)) err("requiredModels", "Every `requiredModels` entry must be a non-empty string.");

  // Templates (unique slug + required sub-fields).
  const templates = asArray(m.templates);
  const tSlugs = new Set<string>();
  templates.forEach((raw, i) => {
    const t = isObject(raw) ? raw : {};
    if (!isNonEmptyString(t.slug) || !isNonEmptyString(t.name) || !isNonEmptyString(t.body))
      err(`templates[${i}]`, "Each template needs a non-empty slug, name, and body.");
    if (isNonEmptyString(t.slug)) {
      if (tSlugs.has(t.slug)) err(`templates[${i}].slug`, `Duplicate template slug "${t.slug}".`);
      tSlugs.add(t.slug);
    }
  });

  // Memory facts (unique sourceKey + value).
  const memoryFacts = asArray(m.memoryFacts);
  const fKeys = new Set<string>();
  memoryFacts.forEach((raw, i) => {
    const f = isObject(raw) ? raw : {};
    if (!isNonEmptyString(f.sourceKey) || !isNonEmptyString(f.value))
      err(`memoryFacts[${i}]`, "Each memory fact needs a non-empty sourceKey and value.");
    if (isNonEmptyString(f.sourceKey)) {
      if (fKeys.has(f.sourceKey)) err(`memoryFacts[${i}].sourceKey`, `Duplicate fact sourceKey "${f.sourceKey}".`);
      fKeys.add(f.sourceKey);
    }
  });

  // Task seeds (unique sourceKey + title).
  const taskSeeds = asArray(m.taskSeeds);
  const sKeys = new Set<string>();
  taskSeeds.forEach((raw, i) => {
    const s = isObject(raw) ? raw : {};
    if (!isNonEmptyString(s.sourceKey) || !isNonEmptyString(s.title))
      err(`taskSeeds[${i}]`, "Each task seed needs a non-empty sourceKey and title.");
    if (isNonEmptyString(s.sourceKey)) {
      if (sKeys.has(s.sourceKey)) err(`taskSeeds[${i}].sourceKey`, `Duplicate task seed sourceKey "${s.sourceKey}".`);
      sKeys.add(s.sourceKey);
    }
  });

  // Knowledge sources (each needs a path or an owuiUrl).
  asArray(m.knowledgeSources).forEach((raw, i) => {
    const k = isObject(raw) ? raw : {};
    if (!isNonEmptyString(k.path) && !isNonEmptyString(k.owuiUrl))
      err(`knowledgeSources[${i}]`, "Each knowledge source needs a `path` or an `owuiUrl`.");
  });

  // Permissions: default-deny, with the v1 local-first invariants as gates.
  const perms = isObject(m.permissions) ? m.permissions : {};
  for (const flag of ["network", "externalSend", "runtimeCode", "autonomous"] as const) {
    if (perms[flag] === true)
      err(`permissions.${flag}`, `\`permissions.${flag}\` must be false in v1 (local-first, no unattended/external action).`);
  }
  const routes = asArray(m.routes);
  const mcpTools = asArray(m.mcpTools);
  if (perms.mcpProposeWrites === true && levelRank(maturity ?? undefined) < levelRank("L2"))
    err("permissions.mcpProposeWrites", "`mcpProposeWrites` requires maturity L2 or higher.");

  // Maturity coherence.
  if (maturity === "L0") {
    if (routes.length > 0) err("routes", "L0 packs are content only and cannot declare routes.");
    if (mcpTools.length > 0) err("mcpTools", "L0 packs are content only and cannot declare mcpTools.");
  }
  if (maturity && levelRank(maturity) >= levelRank("L2") && mcpTools.length === 0)
    warn("mcpTools", `Maturity ${maturity} declares no mcpTools; an MCP-level pack usually exposes at least one.`);
  routes.forEach((r, i) => {
    if (typeof r !== "string" || !r.startsWith("/")) warn(`routes[${i}]`, `Route "${String(r)}" should start with "/".`);
  });

  // High-stakes guardrails.
  const industry = typeof m.industry === "string" ? m.industry.toLowerCase() : "";
  const isHighStakes = HIGH_STAKES_INDUSTRY_KEYWORDS.some((k) => industry.includes(k));
  // High-stakes is a hard gate, not advice: legal/medical/finance/tax/immigration
  // packs carry liability, so they must stay declarative/reviewed (L0/L1) and must
  // state a guardrail in setupChecks, or they fail to install.
  if (isHighStakes) {
    if (maturity && levelRank(maturity) > levelRank("L1"))
      err("maturity", `High-stakes industry "${m.industry}" must stay at L0/L1 (declarative, reviewed), not ${maturity}.`);
    const setupChecks = asArray(m.setupChecks).filter(isNonEmptyString).join(" ").toLowerCase();
    if (!GUARDRAIL_HINTS.some((h) => setupChecks.includes(h)))
      err("setupChecks", `High-stakes industry "${m.industry}" must declare a guardrail note in setupChecks (read-only, reviewed, not advice).`);
  }

  const errors = issues.filter((i) => i.severity === "ERROR").length;
  const warnings = issues.filter((i) => i.severity === "WARN").length;
  return {
    issues,
    summary: {
      errors,
      warnings,
      maturity,
      templates: templates.length,
      memoryFacts: memoryFacts.length,
      taskSeeds: taskSeeds.length,
    },
    ok: errors === 0,
  };
}
