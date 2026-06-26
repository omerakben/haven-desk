"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { DraftTask } from "@/lib/meetingNotes";

type Row = DraftTask & { keep: boolean };

export default function MeetingNotesPage() {
  const [notes, setNotes] = useState("");
  const [rows, setRows] = useState<Row[] | null>(null);
  const [dropped, setDropped] = useState(0);
  const [busy, setBusy] = useState(false);
  const [added, setAdded] = useState(0);

  async function extract() {
    if (!notes.trim()) return;
    setBusy(true);
    setAdded(0);
    setRows(null);
    try {
      const res = await fetch("/api/meeting-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      const data = (await res.json().catch(() => ({}))) as { tasks?: DraftTask[]; dropped?: number; error?: string };
      if (!res.ok) {
        toast.error(data.error ?? "Couldn't read the notes");
        return;
      }
      setRows((data.tasks ?? []).map((t) => ({ ...t, keep: true })));
      setDropped(data.dropped ?? 0);
    } catch {
      toast.error("Couldn't reach the engine");
    } finally {
      setBusy(false);
    }
  }

  async function add() {
    const keep = (rows ?? []).filter((r) => r.keep && r.title.trim());
    if (keep.length === 0) return;
    setBusy(true);
    try {
      const res = await fetch("/api/meeting-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ create: keep }),
      });
      const data = (await res.json().catch(() => ({}))) as { created?: number; error?: string };
      if (!res.ok) {
        toast.error(data.error ?? "Couldn't add the tasks");
        return;
      }
      setAdded(data.created ?? keep.length);
      setRows(null);
      setNotes("");
      toast.success(`Added ${data.created ?? keep.length} tasks`);
    } catch {
      toast.error("Couldn't add the tasks");
    } finally {
      setBusy(false);
    }
  }

  function update(i: number, patch: Partial<Row>) {
    setRows((rs) => (rs ? rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)) : rs));
  }

  const keepCount = (rows ?? []).filter((r) => r.keep && r.title.trim()).length;

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold tracking-tight">Meeting notes → tasks</h1>
      <p className="mt-1.5 text-[15px] text-muted-foreground">
        Paste rough notes. The local model pulls out the action items; you review and edit, then add them as
        real tasks. Nothing is created until you click Add.
      </p>

      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Paste meeting notes…"
        className="mt-4 h-40 w-full rounded-lg border border-input bg-card p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
      />
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Button onClick={extract} disabled={busy || !notes.trim()}>
          {busy && !rows ? "Reading…" : "Extract tasks"}
        </Button>
        {added > 0 && (
          <span className="text-sm text-[hsl(var(--badge-success-fg))]">
            Added {added} tasks.{" "}
            <Link href="/tools/tasks" className="underline underline-offset-2">
              Open Tasks
            </Link>
          </span>
        )}
      </div>

      {rows && (
        <div className="mt-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Review ({keepCount} selected{dropped > 0 ? `, ${dropped} skipped` : ""})
            </h2>
            <Button size="sm" onClick={add} disabled={busy || keepCount === 0}>
              {busy ? "Adding…" : `Add ${keepCount} tasks`}
            </Button>
          </div>
          {rows.length === 0 ? (
            <p className="mt-3 text-sm text-muted-foreground">
              No action items found. Try notes with clearer to-dos.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {rows.map((r, i) => (
                <li key={i} className="flex items-center gap-2.5 rounded-lg border border-border p-2.5">
                  <input
                    type="checkbox"
                    checked={r.keep}
                    onChange={(e) => update(i, { keep: e.target.checked })}
                    aria-label={`Keep ${r.title}`}
                    className="h-4 w-4 shrink-0 accent-primary"
                  />
                  <input
                    value={r.title}
                    onChange={(e) => update(i, { title: e.target.value })}
                    aria-label="Task title"
                    className="min-w-0 flex-1 bg-transparent text-sm focus-visible:outline-none"
                  />
                  {r.owner && (
                    <button
                      type="button"
                      onClick={() => update(i, { owner: null })}
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
                      onClick={() => update(i, { dueDate: null, dueLabel: null })}
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
          )}
        </div>
      )}
    </div>
  );
}
