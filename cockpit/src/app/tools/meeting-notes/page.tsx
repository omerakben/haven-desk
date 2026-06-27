"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { StarterChips } from "@/components/StarterChips";
import { MEETING_TARGET, INBOX_FIELD } from "@/lib/quickActions";
import type { DraftTask } from "@/lib/meetingNotes";
import { DraftTaskReview, type ReviewRow } from "@/components/tasks/DraftTaskReview";

export default function MeetingNotesPage() {
  const [notes, setNotes] = useState("");
  const [rows, setRows] = useState<ReviewRow[] | null>(null);
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

  function update(i: number, patch: Partial<ReviewRow>) {
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

      <div className="mt-4">
        <StarterChips
          target={MEETING_TARGET}
          fallback={[]}
          current={{ [INBOX_FIELD]: notes }}
          onPick={(inputs) => setNotes(inputs[INBOX_FIELD] ?? "")}
          editFields={[{ name: INBOX_FIELD, label: "Notes", type: "textarea" }]}
          headline="No notes handy? Try a sample:"
        />
      </div>

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
            <DraftTaskReview rows={rows} onUpdate={update} />
          )}
        </div>
      )}
    </div>
  );
}
