"use client";

import { useState } from "react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Priority, Task } from "./TasksView";

const PRIORITIES: Priority[] = ["low", "medium", "high"];

/** Stored due date is a date; take its calendar day for an <input type="date">. */
function toDateInput(iso: string | null): string {
  return iso ? iso.slice(0, 10) : "";
}

export function EditTaskDialog({
  task,
  onClose,
  onSaved,
}: {
  task: Task | null;
  onClose: () => void;
  onSaved: (task: Task) => void;
}) {
  return (
    <Dialog open={!!task} onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit task</DialogTitle>
          <DialogDescription>Update title, notes, priority, and due date.</DialogDescription>
        </DialogHeader>
        {/* Keyed so each opened task remounts with fresh initial state (no sync effect). */}
        {task && <EditTaskForm key={task.id} task={task} onClose={onClose} onSaved={onSaved} />}
      </DialogContent>
    </Dialog>
  );
}

function EditTaskForm({
  task,
  onClose,
  onSaved,
}: {
  task: Task;
  onClose: () => void;
  onSaved: (task: Task) => void;
}) {
  const [title, setTitle] = useState(task.title);
  const [notes, setNotes] = useState(task.notes ?? "");
  const [priority, setPriority] = useState<Priority>(task.priority);
  const [due, setDue] = useState(toDateInput(task.dueDate));
  const [saving, setSaving] = useState(false);

  async function save() {
    const t = title.trim();
    if (!t) {
      toast.error("Title can't be empty.");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: t, notes, priority, dueDate: due || null }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      onSaved(data.task as Task);
      toast.success("Task updated");
      onClose();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="edit-title">Title</Label>
          <Input id="edit-title" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="edit-notes">Notes</Label>
          <Textarea
            id="edit-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Optional details…"
            rows={3}
          />
        </div>

        <div className="flex flex-wrap gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="edit-priority">Priority</Label>
            <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
              <SelectTrigger id="edit-priority" className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRIORITIES.map((p) => (
                  <SelectItem key={p} value={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit-due">Due date</Label>
            <Input
              id="edit-due"
              type="date"
              value={due}
              onChange={(e) => setDue(e.target.value)}
              className="w-44"
            />
          </div>
        </div>
      </div>

      <DialogFooter>
        <Button variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={save} disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </Button>
      </DialogFooter>
    </>
  );
}
