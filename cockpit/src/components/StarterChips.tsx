"use client";

import { useEffect, useState } from "react";
import { Sparkles, Play, Pencil, X, Plus, RotateCcw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ConfirmDialog";

export type StarterDto = {
  id: string;
  target: string;
  label: string;
  inputs: Record<string, string>;
  builtin: boolean;
};

export type StarterEditField = { name: string; label: string; type?: "text" | "textarea" };

type StarterChipsProps = {
  /** A QuickAction id or "inbox". */
  target: string;
  /** Code built-ins, shown while the live list loads so chips never flash empty. */
  fallback: { label: string; inputs: Record<string, string> }[];
  /** The live form values, for "Save current as starter". */
  current: Record<string, string>;
  /** Fill (and, for the runner, run) — the caller decides. */
  onPick: (inputs: Record<string, string>) => void;
  /** The fields the edit/save dialog renders (the action's inputs, or one text field for inbox). */
  editFields: StarterEditField[];
  /** Header copy, e.g. "See it instantly — tap one to fill and run:". */
  headline: string;
};

/**
 * Editable starter chips (form pre-fills) for a Quick Action or the Smart Inbox.
 * Tapping a chip fills (and runs, on the runner). Manage mode reveals edit/delete
 * per chip plus "Save current as starter" and "Reset to defaults". Built-ins and
 * user starters render identically. While the live list loads it shows the code
 * fallback, so chips never flash empty.
 */
export function StarterChips({ target, fallback, current, onPick, editFields, headline }: StarterChipsProps) {
  const [starters, setStarters] = useState<StarterDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const [manage, setManage] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [editing, setEditing] = useState<StarterDto | null>(null);
  const [resetOpen, setResetOpen] = useState(false);

  // Loading starts true (initial state); on a target change the parent remounts
  // this component (keyed by target), so we never flash a stale target's list.
  // A reloadKey bump refetches in the background and swaps the list in place.
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/starters?target=${encodeURIComponent(target)}`)
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) setStarters(Array.isArray(d.starters) ? (d.starters as StarterDto[]) : []);
      })
      .catch(() => {
        if (!cancelled) setStarters([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [target, reloadKey]);

  const reload = () => setReloadKey((k) => k + 1);
  const canSave = Object.values(current).some((v) => typeof v === "string" && v.trim().length > 0);

  async function mutate(url: string, method: string, body?: unknown): Promise<boolean> {
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Something went wrong");
      return true;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
      return false;
    }
  }

  async function deleteStarter(id: string) {
    if (await mutate(`/api/starters/${id}`, "DELETE")) {
      toast.success("Starter removed");
      reload();
    }
  }

  async function resetStarters() {
    if (await mutate(`/api/starters/reset`, "POST", { target })) {
      toast.success("Starters reset to defaults");
      reload();
    }
  }

  // While the live list loads, render the code fallback so chips never flash empty.
  const useFallback = loading && starters.length === 0;
  const chips: (StarterDto & { fallback?: boolean })[] = useFallback
    ? fallback.map((f, i) => ({ id: `fallback-${i}`, target, label: f.label, inputs: f.inputs, builtin: true, fallback: true }))
    : starters;

  return (
    <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex items-center gap-1.5 text-xs font-medium text-foreground">
          <Sparkles className="h-3.5 w-3.5 text-primary" /> {headline}
        </span>

        {chips.map((s) => (
          <span key={s.id} className="inline-flex items-center">
            <button
              type="button"
              onClick={() => onPick(s.inputs)}
              className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-card px-2.5 py-1 text-xs font-medium text-foreground shadow-sm transition-colors hover:border-primary/50 hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
            >
              <Play className="h-3 w-3 text-primary" /> {s.label}
            </button>
            {manage && !s.fallback && (
              <span className="ml-0.5 flex items-center">
                <button
                  type="button"
                  onClick={() => setEditing(s)}
                  aria-label={`Edit ${s.label}`}
                  title="Edit"
                  className="rounded p-1 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                >
                  <Pencil className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={() => deleteStarter(s.id)}
                  aria-label={`Delete ${s.label}`}
                  title="Delete"
                  className="rounded p-1 text-muted-foreground hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
          </span>
        ))}

        <span className="ml-auto flex items-center gap-1">
          {canSave && (
            <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setSaveOpen(true)}>
              <Plus className="mr-1 h-3.5 w-3.5" /> Save current
            </Button>
          )}
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={() => setManage((m) => !m)}>
            {manage ? "Done" : "Manage"}
          </Button>
        </span>
      </div>

      {manage && (
        <div className="mt-2 flex items-center gap-2 border-t border-primary/15 pt-2">
          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-muted-foreground" onClick={() => setResetOpen(true)}>
            <RotateCcw className="mr-1 h-3.5 w-3.5" /> Reset to defaults
          </Button>
        </div>
      )}

      {saveOpen && (
        <StarterFormDialog
          title="Save current as a starter"
          description="Give this set of answers a short name so you can reuse it."
          target={target}
          editFields={editFields}
          initialLabel=""
          initialInputs={current}
          lockInputs
          onClose={() => setSaveOpen(false)}
          onSaved={() => {
            setSaveOpen(false);
            reload();
          }}
        />
      )}

      {editing && (
        <StarterFormDialog
          key={editing.id}
          title="Edit starter"
          description="Change the name or the answers this starter fills in."
          target={target}
          editFields={editFields}
          initialLabel={editing.label}
          initialInputs={editing.inputs}
          patchId={editing.id}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            reload();
          }}
        />
      )}

      <ConfirmDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        title="Reset starters to defaults?"
        description="This restores the shipped starters here and removes your edits to them. Starters you created yourself are kept."
        confirmLabel="Reset"
        onConfirm={resetStarters}
      />
    </div>
  );
}

/** Shared create/edit dialog: a label plus one field per editField, prefilled. */
function StarterFormDialog({
  title,
  description,
  target,
  editFields,
  initialLabel,
  initialInputs,
  patchId,
  lockInputs,
  onClose,
  onSaved,
}: {
  title: string;
  description: string;
  target: string;
  editFields: StarterEditField[];
  initialLabel: string;
  initialInputs: Record<string, string>;
  patchId?: string;
  lockInputs?: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [label, setLabel] = useState(initialLabel);
  const [inputs, setInputs] = useState<Record<string, string>>(initialInputs);
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!label.trim()) {
      toast.error("Give the starter a name.");
      return;
    }
    setSaving(true);
    try {
      const url = patchId ? `/api/starters/${patchId}` : `/api/starters`;
      const method = patchId ? "PATCH" : "POST";
      const body = patchId ? { label: label.trim(), inputs } : { target, label: label.trim(), inputs };
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Couldn't save the starter");
      toast.success(patchId ? "Starter updated" : "Starter saved");
      onSaved();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't save the starter");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="starter-label">Name</Label>
            <Input
              id="starter-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. School bake sale"
            />
          </div>
          {!lockInputs &&
            editFields.map((f) => (
              <div key={f.name} className="space-y-1.5">
                <Label htmlFor={`starter-${f.name}`}>{f.label}</Label>
                {f.type === "textarea" ? (
                  <Textarea
                    id={`starter-${f.name}`}
                    value={inputs[f.name] ?? ""}
                    onChange={(e) => setInputs((s) => ({ ...s, [f.name]: e.target.value }))}
                    rows={3}
                  />
                ) : (
                  <Input
                    id={`starter-${f.name}`}
                    value={inputs[f.name] ?? ""}
                    onChange={(e) => setInputs((s) => ({ ...s, [f.name]: e.target.value }))}
                  />
                )}
              </div>
            ))}
          {lockInputs && (
            <p className="text-xs text-muted-foreground">Saving the answers you just filled in.</p>
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} disabled={saving}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
