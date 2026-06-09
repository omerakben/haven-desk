import { describe, expect, it } from "vitest";

import { deriveAdrTitle, lintAdr, stripOuterFences } from "./adrLint";

const GOOD = `# Use SQLite for local persistence

## Context and Problem Statement
The cockpit needs a zero-ops local store for prompts and tasks on a single machine.

## Decision Drivers
* Zero configuration for colleagues
* Single-user, on-machine privacy

## Considered Options
* SQLite via Prisma
* Postgres in Docker
* JSON files on disk

## Decision Outcome
Chosen option: "SQLite via Prisma", because it is zero-ops and file-based.

### Consequences
* Good, because backups are a single file copy.
* Bad, because concurrent writers are limited.

## Pros and Cons of the Options
### SQLite via Prisma
* Good, because no daemon to run.
* Bad, because no network access.
`;

describe("lintAdr", () => {
  it("passes a complete MADR document", () => {
    const r = lintAdr(GOOD);
    expect(r.ok).toBe(true);
    expect(r.summary.errors).toBe(0);
    expect(r.summary.options).toBe(3);
    expect(r.summary.negativeConsequences).toBe(1);
    expect(r.summary.sections).toContain("Decision Outcome");
  });

  it("errors when a required section is missing", () => {
    const r = lintAdr(GOOD.replace(/## Considered Options[\s\S]*?(?=## Decision Outcome)/, ""));
    expect(r.ok).toBe(false);
    expect(
      r.issues.some(
        (i) => i.severity === "ERROR" && i.message.includes("Missing required section `Considered Options`")
      )
    ).toBe(true);
  });

  it("errors when a required section is empty", () => {
    const doc = GOOD.replace(
      /## Considered Options[\s\S]*?(?=## Decision Outcome)/,
      "## Considered Options\n\n"
    );
    const r = lintAdr(doc);
    expect(r.ok).toBe(false);
    expect(
      r.issues.some((i) => i.severity === "ERROR" && i.message.includes("`Considered Options` is empty"))
    ).toBe(true);
  });

  it("errors on fewer than 2 considered options", () => {
    const doc = GOOD.replace(
      /## Considered Options[\s\S]*?(?=## Decision Outcome)/,
      "## Considered Options\n* SQLite via Prisma\n\n"
    );
    const r = lintAdr(doc);
    expect(r.ok).toBe(false);
    expect(r.issues.some((i) => i.severity === "ERROR" && /Only 1 considered option/.test(i.message))).toBe(
      true
    );
  });

  it("errors when there is no negative consequence", () => {
    const doc = GOOD.replace("* Bad, because concurrent writers are limited.", "* Good, because it is fast.");
    const r = lintAdr(doc);
    expect(r.ok).toBe(false);
    expect(r.issues.some((i) => i.severity === "ERROR" && /No negative consequence/.test(i.message))).toBe(
      true
    );
  });

  it("warns when there is no positive consequence", () => {
    const doc = GOOD.replace("* Good, because backups are a single file copy.", "");
    const r = lintAdr(doc);
    expect(r.ok).toBe(true); // a missing upside is advisory, not a gate
    expect(r.issues.some((i) => i.severity === "WARN" && /No positive consequence/.test(i.message))).toBe(
      true
    );
  });

  it("warns when the chosen option doesn't match a considered one", () => {
    const doc = GOOD.replace(
      'Chosen option: "SQLite via Prisma", because it is zero-ops and file-based.',
      'Chosen option: "MongoDB Atlas", because it is web scale.'
    );
    const r = lintAdr(doc);
    expect(r.issues.some((i) => i.severity === "WARN" && /doesn't match any item/.test(i.message))).toBe(
      true
    );
  });

  it("warns on a missing title and missing decision drivers", () => {
    const doc = GOOD.replace("# Use SQLite for local persistence\n", "").replace(
      /## Decision Drivers[\s\S]*?(?=## Considered Options)/,
      ""
    );
    const r = lintAdr(doc);
    expect(r.issues.some((i) => i.severity === "WARN" && /No `#` title heading/.test(i.message))).toBe(true);
    expect(r.issues.some((i) => i.severity === "WARN" && /No `Decision Drivers`/.test(i.message))).toBe(true);
  });

  it("warns when Decision Outcome lacks an explicit chosen-option line", () => {
    const doc = GOOD.replace(
      'Chosen option: "SQLite via Prisma", because it is zero-ops and file-based.',
      "We went with SQLite."
    );
    const r = lintAdr(doc);
    expect(
      r.issues.some((i) => i.severity === "WARN" && /no explicit `Chosen option:/.test(i.message))
    ).toBe(true);
  });

  it("accepts heading aliases at any level (## Decision → Decision Outcome)", () => {
    const doc = GOOD.replace("## Decision Outcome", "## Decision").replace(
      "## Context and Problem Statement",
      "### Context"
    );
    const r = lintAdr(doc);
    expect(
      r.issues.some((i) => i.severity === "ERROR" && /Missing required section/.test(i.message))
    ).toBe(false);
  });

  it("lints a fence-wrapped document the same as a bare one", () => {
    const r = lintAdr("```markdown\n" + GOOD + "\n```");
    expect(r.ok).toBe(true);
    expect(r.summary.options).toBe(3);
  });
});

describe("stripOuterFences", () => {
  it("unwraps a fully fenced document", () => {
    expect(stripOuterFences("```md\n# Title\nBody\n```")).toBe("# Title\nBody");
  });

  it("leaves an unfenced document untouched", () => {
    expect(stripOuterFences("# Title\nBody")).toBe("# Title\nBody");
  });

  it("does not unwrap when the body contains its own fences", () => {
    const doc = "```\n# Title\n```js\ncode\n```\n```";
    expect(stripOuterFences(doc)).toBe(doc.trim());
  });

  it("leaves internal code blocks in an unwrapped document alone", () => {
    const doc = "# Title\n```js\ncode\n```\nAfter";
    expect(stripOuterFences(doc)).toBe(doc);
  });
});

describe("deriveAdrTitle", () => {
  it("uses the first # heading", () => {
    expect(deriveAdrTitle(GOOD)).toBe("Use SQLite for local persistence");
  });

  it("falls back to the first non-empty line", () => {
    expect(deriveAdrTitle("Some decision note\nmore text")).toBe("Some decision note");
  });

  it("falls back to the default for empty input", () => {
    expect(deriveAdrTitle("   \n  ")).toBe("Untitled decision");
  });

  it("clips long titles", () => {
    const long = "x".repeat(100);
    const t = deriveAdrTitle(`# ${long}`);
    expect(t.length).toBe(78);
    expect(t.endsWith("…")).toBe(true);
  });
});
