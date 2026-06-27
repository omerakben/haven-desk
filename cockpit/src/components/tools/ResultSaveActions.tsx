"use client";

import { useState } from "react";
import { ListPlus, StickyNote, Check } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { DraftTaskReview, type ReviewRow } from "@/components/tasks/DraftTaskReview";
import { deriveNoteTitle } from "@/lib/resultTitle";
import type { QuickAction } from "@/lib/quickActions";
import type { DraftTask } from "@/lib/meetingNotes";

/**
 * Save a Quick Action result: as a note (every result, verbatim — no model
 * re-run) or, on list/plan actions, as real Tasks (extract → review → add).
 * The result text is snapshotted at click time, since a refine may still stream.
 */
export function ResultSaveActions({ text, action }: { text: string; action: QuickAction }) {
  const [savedNote, setSavedNote] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [rows, setRows] = useState<ReviewRow[] | null>(null);
  const [adding, setAdding] = useState(false);

  async function saveNote() {
    const snapshot = text;
    if (!snapshot.trim() || savingNote) return;
    setSavingNote(true);
    try {
      const res = await fetch("/api/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: deriveNoteTitle(snapshot, action.title), content: snapshot }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Couldn't save");
      setSavedNote(true);
      toast.success("Saved as a note", {
        action: { label: "Open", onClick: () => { window.location.href = "/tools/brainstorm"; } },
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't save");
    } finally {
      setSavingNote(false);
    }
  }

  async function extractTasks() {
    const snapshot = text;
    if (!snapshot.trim() || extracting) return;
    setExtracting(true);
    try {
      const res = await fetch("/api/result-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: snapshot }),
      });
      const data = (await res.json().catch(() => ({}))) as { tasks?: DraftTask[]; error?: string };
      if (!res.ok) throw new Error(data.error || "Couldn't read the result");
      const tasks = data.tasks ?? [];
      if (tasks.length === 0) {
        toast.message("No clear to-dos found", { description: "Try “Save as note” to keep this result." });
        return;
      }
      setRows(tasks.map((t) => ({ ...t, keep: true })));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't read the result");
    } finally {
      setExtracting(false);
    }
  }

  async function addTasks() {
    const keep = (rows ?? []).filter((r) => r.keep && r.title.trim());
    if (keep.length === 0 || adding) return;
    setAdding(true);
    try {
      const res = await fetch("/api/result-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ create: keep }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Couldn't add the tasks");
      const n = data.created ?? keep.length;
      setRows(null);
      toast.success(`Added ${n} tasks`, {
        action: { label: "Open Tasks", onClick: () => { window.location.href = "/tools/tasks"; } },
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't add the tasks");
    } finally {
      setAdding(false);
    }
  }

  function update(i: number, patch: Partial<ReviewRow>) {
    setRows((rs) => (rs ? rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)) : rs));
  }

  const keepCount = (rows ?? []).filter((r) => r.keep && r.title.trim()).length;

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <span className="text-xs text-muted-foreground">Save it:</span>
      <Button
        variant="outline"
        size="sm"
        className="h-7 px-2 text-xs"
        onClick={saveNote}
        disabled={!text || savingNote}
      >
        {savedNote ? <Check className="mr-1 h-3.5 w-3.5" /> : <StickyNote className="mr-1 h-3.5 w-3.5" />}
        {savedNote ? "Saved" : "Save as note"}
      </Button>
      {action.canSaveTasks && (
        <Button
          variant="outline"
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={extractTasks}
          disabled={!text || extracting}
        >
          <ListPlus className="mr-1 h-3.5 w-3.5" />
          {extracting ? "Reading…" : "Save as tasks"}
        </Button>
      )}

      <Dialog open={rows !== null} onOpenChange={(o) => !o && setRows(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Review tasks</DialogTitle>
            <DialogDescription>Untick anything you don’t want. Nothing is added until you confirm.</DialogDescription>
          </DialogHeader>
          {rows && <DraftTaskReview rows={rows} onUpdate={update} />}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRows(null)}>
              Cancel
            </Button>
            <Button onClick={addTasks} disabled={adding || keepCount === 0}>
              {adding ? "Adding…" : `Add ${keepCount} tasks`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
