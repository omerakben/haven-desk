// Pure helpers for user-editable starters: the deterministic seed plan for the
// shipped standards and the write-time validation gate. No I/O — the routes do
// the prisma upserts. See docs/superpowers/specs/2026-06-26-user-crud-starters-design.md.

import { BuiltinStarter, getQuickAction, missingInputs, INBOX_TARGET, INBOX_FIELD } from "./quickActions";

export const MAX_LABEL = 100;
export const MAX_INPUTS_BYTES = 8192;

export type StarterSeedRow = {
  sourceKey: string;
  target: string;
  label: string;
  inputs: string; // JSON
  builtin: true;
  order: number;
};

/** Deterministic create-only seed rows for the shipped standards. Pure. */
export function buildStarterSeedPlan(builtins: BuiltinStarter[]): StarterSeedRow[] {
  return builtins.map((b, i) => ({
    sourceKey: b.key,
    target: b.target,
    label: b.label,
    inputs: JSON.stringify(b.inputs),
    builtin: true,
    order: i,
  }));
}

/** Parse a stored inputs JSON string into a flat string map, or null if malformed. */
export function parseInputs(raw: string): Record<string, string> | null {
  let v: unknown;
  try {
    v = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!v || typeof v !== "object" || Array.isArray(v)) return null;
  const out: Record<string, string> = {};
  for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
    if (typeof val !== "string") return null;
    out[k] = val;
  }
  return out;
}

export type StarterValidation = { ok: boolean; error?: string };

/**
 * Gate a starter write: known target, label/size caps, and a runnable payload.
 * An action starter must fill the action's required inputs (the same invariant
 * the built-in test enforces) so a chip that fills also runs; an inbox starter
 * just needs non-empty text.
 */
export function validateStarter(target: string, label: string, inputs: Record<string, string>): StarterValidation {
  if (!label || !label.trim()) return { ok: false, error: "A starter needs a label." };
  if (label.length > MAX_LABEL) return { ok: false, error: "That label is too long." };
  if (JSON.stringify(inputs).length > MAX_INPUTS_BYTES) return { ok: false, error: "That starter is too long." };

  if (target === INBOX_TARGET) {
    const text = inputs[INBOX_FIELD];
    if (typeof text !== "string" || !text.trim()) return { ok: false, error: "An Inbox starter needs some text." };
    return { ok: true };
  }

  const action = getQuickAction(target);
  if (!action) return { ok: false, error: "Unknown action." };
  const missing = missingInputs(action, inputs);
  if (missing.length > 0) return { ok: false, error: `This starter doesn't fill: ${missing.join(", ")}.` };
  return { ok: true };
}
