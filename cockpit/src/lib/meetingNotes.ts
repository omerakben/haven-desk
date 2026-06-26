// Deterministic gate for the "meeting notes -> tasks" workflow. The model
// (chatJson) returns a loose array of task-ish objects; this turns it into clean,
// reviewable draft tasks: trims titles and drops blanks, dedupes by title, caps
// the count, and resolves a due date from the model's `due` phrase (falling back
// to the title) via the same extractDueDate parser quick-add uses. Pure and
// timezone-safe (the date math is injectable), so it is the unit-tested gate that
// stands between a local 4B model and real Task records.

import { extractDueDate } from "@/lib/quickDates";

export type DraftTask = {
  title: string;
  owner: string | null;
  dueDate: string | null; // ISO calendar day (YYYY-MM-DD), or null
  dueLabel: string | null; // the phrase that matched (e.g. "tomorrow"), for display
};

export type GateResult = { tasks: DraftTask[]; dropped: number };

const MAX_TASKS = 25;

function toArray(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === "object" && Array.isArray((raw as { tasks?: unknown }).tasks)) {
    return (raw as { tasks: unknown[] }).tasks;
  }
  return [];
}

export function gateMeetingTasks(raw: unknown, now: Date = new Date()): GateResult {
  const items = toArray(raw);
  const tasks: DraftTask[] = [];
  const seen = new Set<string>();
  let dropped = 0;

  for (const item of items) {
    const o = item && typeof item === "object" ? (item as Record<string, unknown>) : {};
    const title = typeof o.title === "string" ? o.title.trim() : "";
    if (!title) {
      dropped += 1;
      continue;
    }
    const key = title.toLowerCase();
    if (seen.has(key) || tasks.length >= MAX_TASKS) {
      dropped += 1;
      continue;
    }
    seen.add(key);

    const owner = typeof o.owner === "string" && o.owner.trim() ? o.owner.trim() : null;
    const duePhrase = typeof o.due === "string" && o.due.trim() ? o.due : title;
    const { dueDate, matched } = extractDueDate(duePhrase, now);

    tasks.push({
      title,
      owner,
      dueDate: dueDate ? dueDate.toISOString().slice(0, 10) : null,
      dueLabel: matched,
    });
  }

  return { tasks, dropped };
}
