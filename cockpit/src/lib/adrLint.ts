// Dependency-free MADR (Markdown Architectural Decision Record) linter.
// Mirrors the gherkinLint pattern: pure functions, ERROR = gate, WARN = advisory.
// The gate encodes what makes an ADR a *decision record* rather than a memo:
// real context, at least two considered options, an explicit outcome, and at
// least one honestly-stated negative consequence.

export type AdrSeverity = "ERROR" | "WARN";
export type AdrIssue = { severity: AdrSeverity; line: number; message: string };
export type AdrLintResult = {
  issues: AdrIssue[];
  summary: {
    errors: number;
    warnings: number;
    options: number;
    negativeConsequences: number;
    sections: string[];
  };
  ok: boolean;
};

// Canonical MADR sections we track, with the aliases models/humans actually use.
// Headings match case-insensitively at any heading level (MADR nests
// "Consequences" as an h3 under "Decision Outcome").
const SECTION_ALIASES: Record<string, string[]> = {
  "Context and Problem Statement": ["context and problem statement", "context"],
  "Decision Drivers": ["decision drivers", "drivers"],
  "Considered Options": ["considered options", "options considered", "alternatives"],
  "Decision Outcome": ["decision outcome", "decision", "outcome"],
  Consequences: ["consequences", "positive and negative consequences"],
  "Pros and Cons of the Options": ["pros and cons of the options", "pros and cons"],
};

const REQUIRED_SECTIONS = [
  "Context and Problem Statement",
  "Considered Options",
  "Decision Outcome",
  "Consequences",
];

const HEADING = /^(#{1,6})\s+(.+?)\s*$/;
const LIST_ITEM = /^\s*(?:[-*+]|\d+[.)])\s+(.*)$/;
const NEGATIVE_ITEM = /^(?:\*\*)?(bad|negative|con|risk|cost|downside|trade[- ]?off)\b/i;
const POSITIVE_ITEM = /^(?:\*\*)?(good|positive|pro|benefit)\b/i;
const CHOSEN = /chosen option:?\s*(.*)/i;

type Section = { canonical: string; line: number; lines: { line: number; text: string }[] };

/**
 * If the entire document is wrapped in a single fence pair (```...```), unwrap
 * it. Unlike a global fence strip, this never touches code blocks *inside* the
 * document.
 */
export function stripOuterFences(text: string): string {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length >= 2 && /^```[\w-]*\s*$/.test(lines[0]) && /^```\s*$/.test(lines[lines.length - 1])) {
    const inner = lines.slice(1, -1);
    // Only unwrap when the inner body has no other fence lines (a true wrapper).
    if (!inner.some((l) => /^```/.test(l.trim()))) return inner.join("\n").trim();
  }
  return text.trim();
}

function canonicalSection(heading: string): string | null {
  const normalized = heading.toLowerCase().replace(/[*_`:]/g, "").trim();
  for (const [canonical, aliases] of Object.entries(SECTION_ALIASES)) {
    if (aliases.includes(normalized)) return canonical;
  }
  return null;
}

function parseAdr(text: string) {
  const lines = text.split(/\r?\n/);
  const sections = new Map<string, Section>();
  let title: { line: number; text: string } | null = null;
  let current: Section | null = null;

  lines.forEach((raw, idx) => {
    const line = idx + 1;
    const m = HEADING.exec(raw);
    if (m) {
      const [, hashes, headingText] = m;
      if (hashes.length === 1 && !title) title = { line, text: headingText };
      const canonical = canonicalSection(headingText);
      // Any heading ends the current section; only tracked ones open a new one.
      current = null;
      if (canonical && !sections.has(canonical)) {
        current = { canonical, line, lines: [] };
        sections.set(canonical, current);
      }
      return;
    }
    if (current && raw.trim()) current.lines.push({ line, text: raw });
  });

  return { title: title as { line: number; text: string } | null, sections };
}

function listItems(section: Section): { line: number; text: string }[] {
  const items: { line: number; text: string }[] = [];
  for (const l of section.lines) {
    const m = LIST_ITEM.exec(l.text);
    if (m) items.push({ line: l.line, text: m[1].trim() });
  }
  return items;
}

/** Normalize an option label for chosen-vs-considered comparison. */
function normalizeOption(s: string): string {
  return s
    .toLowerCase()
    .replace(/["'“”‘’`]/g, "")
    .replace(/[^a-z0-9 ]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function lintAdr(text: string): AdrLintResult {
  const doc = stripOuterFences(text);
  const { title, sections } = parseAdr(doc);
  const issues: AdrIssue[] = [];

  if (!title) {
    issues.push({ severity: "WARN", line: 1, message: "No `#` title heading — name the decision." });
  }

  for (const name of REQUIRED_SECTIONS) {
    const section = sections.get(name);
    if (!section) {
      issues.push({ severity: "ERROR", line: 1, message: `Missing required section \`${name}\`.` });
    } else if (section.lines.length === 0) {
      issues.push({ severity: "ERROR", line: section.line, message: `Section \`${name}\` is empty.` });
    }
  }
  if (!sections.has("Decision Drivers")) {
    issues.push({
      severity: "WARN",
      line: 1,
      message: "No `Decision Drivers` section — what forces/concerns shaped this decision?",
    });
  }

  // Considered options: a decision record needs real alternatives.
  const optionsSection = sections.get("Considered Options");
  const options = optionsSection ? listItems(optionsSection) : [];
  if (optionsSection && optionsSection.lines.length > 0 && options.length < 2) {
    issues.push({
      severity: "ERROR",
      line: optionsSection.line,
      message: `Only ${options.length} considered option${options.length === 1 ? "" : "s"} — a decision record needs at least 2 real alternatives.`,
    });
  }

  // Decision outcome: an explicit "Chosen option:" that matches a considered one.
  const outcome = sections.get("Decision Outcome");
  let chosenRaw: string | null = null;
  if (outcome) {
    for (const l of outcome.lines) {
      const m = CHOSEN.exec(l.text);
      if (m) {
        chosenRaw = m[1];
        break;
      }
    }
    if (outcome.lines.length > 0 && !chosenRaw) {
      issues.push({
        severity: "WARN",
        line: outcome.line,
        message: 'Decision Outcome has no explicit `Chosen option: "..."` line.',
      });
    }
    if (chosenRaw && options.length >= 2) {
      // The chosen line usually reads: Chosen option: "X", because ...
      const chosenLabel = normalizeOption(chosenRaw.split(/,|because/i)[0]);
      const match = options.some((o) => {
        const opt = normalizeOption(o.text.split(/[—–:,]| because /i)[0]);
        return opt && chosenLabel && (opt.includes(chosenLabel) || chosenLabel.includes(opt));
      });
      if (!match) {
        issues.push({
          severity: "WARN",
          line: outcome.line,
          message: `Chosen option "${chosenRaw.split(/,|because/i)[0].trim()}" doesn't match any item under Considered Options.`,
        });
      }
    }
  }

  // Consequences: at least one honest negative is the heart of the gate — an
  // ADR with only upside hasn't actually weighed the decision.
  const consequences = sections.get("Consequences");
  let negatives = 0;
  let positives = 0;
  if (consequences) {
    for (const item of listItems(consequences)) {
      if (NEGATIVE_ITEM.test(item.text)) negatives += 1;
      else if (POSITIVE_ITEM.test(item.text)) positives += 1;
    }
    if (consequences.lines.length > 0 && negatives === 0) {
      issues.push({
        severity: "ERROR",
        line: consequences.line,
        message: 'No negative consequence (e.g. `* Bad, because …`) — every real decision has a downside; state it.',
      });
    }
    if (consequences.lines.length > 0 && positives === 0) {
      issues.push({
        severity: "WARN",
        line: consequences.line,
        message: "No positive consequence (`* Good, because …`) — state what this buys you.",
      });
    }
  }

  const errors = issues.filter((i) => i.severity === "ERROR").length;
  const warnings = issues.filter((i) => i.severity === "WARN").length;
  issues.sort((a, b) => a.line - b.line || (a.severity === b.severity ? 0 : a.severity === "ERROR" ? -1 : 1));

  return {
    issues,
    summary: {
      errors,
      warnings,
      options: options.length,
      negativeConsequences: negatives,
      sections: [...sections.keys()],
    },
    ok: errors === 0,
  };
}

/** First `#` heading as the ADR title, else the first non-empty line, clipped. */
export function deriveAdrTitle(markdown: string, fallback = "Untitled decision"): string {
  const doc = stripOuterFences(markdown);
  for (const raw of doc.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const m = /^#\s+(.+)$/.exec(line);
    const text = (m ? m[1] : line).trim();
    if (text) return text.length > 80 ? text.slice(0, 77) + "…" : text;
  }
  return fallback;
}
