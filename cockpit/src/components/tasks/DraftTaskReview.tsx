"use client";

import { X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { DraftTask } from "@/lib/meetingNotes";

export type ReviewRow = DraftTask & { keep: boolean };

/**
 * The keep/edit row list for reviewed draft tasks. Shared by Meeting Notes and
 * the runner's "Save as tasks". Assumes rows.length > 0 (callers handle empty).
 */
export function DraftTaskReview({
  rows,
  onUpdate,
}: {
  rows: ReviewRow[];
  onUpdate: (i: number, patch: Partial<ReviewRow>) => void;
}) {
  return (
    <ul className="mt-3 space-y-2">
      {rows.map((r, i) => (
        <li key={i} className="flex items-center gap-2.5 rounded-lg border border-border p-2.5">
          <input
            type="checkbox"
            checked={r.keep}
            onChange={(e) => onUpdate(i, { keep: e.target.checked })}
            aria-label={`Keep ${r.title}`}
            className="h-4 w-4 shrink-0 accent-primary"
          />
          <input
            value={r.title}
            onChange={(e) => onUpdate(i, { title: e.target.value })}
            aria-label="Task title"
            className="min-w-0 flex-1 bg-transparent text-sm focus-visible:outline-none"
          />
          {r.owner && (
            <button
              type="button"
              onClick={() => onUpdate(i, { owner: null })}
              aria-label={`Clear owner ${r.owner}`}
              title="Clear owner"
              className="shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
            >
              <Badge variant="outline" className="gap-1 text-[10px]">
                {r.owner}
                <X className="h-2.5 w-2.5" />
              </Badge>
            </button>
          )}
          {r.dueLabel && (
            <button
              type="button"
              onClick={() => onUpdate(i, { dueDate: null, dueLabel: null })}
              aria-label={`Clear due date ${r.dueLabel}`}
              title="Clear due date"
              className="shrink-0 rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
            >
              <Badge variant="secondary" className="gap-1 text-[10px]">
                due {r.dueLabel}
                <X className="h-2.5 w-2.5" />
              </Badge>
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
