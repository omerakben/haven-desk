"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pin, Trash2, Check, X, Sparkles, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type Fact = {
  id: string;
  key: string | null;
  value: string;
  source: string;
  status: string;
  pinned: boolean;
  projectId: string | null;
  projectName: string | null;
};

const ALL = "__all__";
const NONE = "__none__";

export function MemoryManager({
  facts,
  projects,
}: {
  facts: Fact[];
  projects: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [key, setKey] = useState("");
  const [value, setValue] = useState("");
  const [suggestOpen, setSuggestOpen] = useState(false);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [filterProject, setFilterProject] = useState(ALL);

  const inFilter = (f: Fact) =>
    filterProject === ALL ||
    (filterProject === NONE ? f.projectId === null : f.projectId === filterProject);
  const pending = facts.filter((f) => f.status === "pending" && inFilter(f));
  const active = facts.filter((f) => f.status === "active" && inFilter(f));

  async function add() {
    if (!value.trim()) return;
    const res = await fetch("/api/memory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value }),
    });
    if (!res.ok) {
      toast.error("Failed to add");
      return;
    }
    setKey("");
    setValue("");
    router.refresh();
  }

  async function patch(id: string, data: Record<string, unknown>) {
    const res = await fetch(`/api/memory/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      toast.error("Failed");
      return;
    }
    router.refresh();
  }

  async function remove(id: string) {
    const res = await fetch(`/api/memory/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Failed");
      return;
    }
    router.refresh();
  }

  async function suggest() {
    if (!text.trim()) return;
    setBusy(true);
    try {
      const res = await fetch("/api/memory/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      toast.success(`Suggested ${data.facts.length} fact(s) to review`);
      setText("");
      setSuggestOpen(false);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold">🧠 Memory</h1>
      <p className="mt-1 text-muted-foreground">
        Facts about you and your work. Active facts are woven into the email, brainstorming, and
        task tools.
      </p>

      <div className="mt-6 flex flex-wrap gap-2">
        <Input
          value={key}
          onChange={(e) => setKey(e.target.value)}
          placeholder="Key (optional)"
          className="max-w-[160px]"
        />
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Add a fact…"
          className="max-w-md"
          onKeyDown={(e) => {
            if (e.key === "Enter") add();
          }}
        />
        <Button onClick={add} disabled={!value.trim()}>
          <Plus className="mr-1 h-4 w-4" /> Add
        </Button>
        <Button variant="outline" onClick={() => setSuggestOpen(true)}>
          <Sparkles className="mr-1 h-4 w-4" /> Suggest from text
        </Button>
      </div>

      {projects.length > 0 && (
        <div className="mt-4 flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Project</span>
          <Select value={filterProject} onValueChange={setFilterProject}>
            <SelectTrigger className="h-8 w-48" aria-label="Filter by project">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>All projects</SelectItem>
              <SelectItem value={NONE}>No project</SelectItem>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {pending.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-medium text-muted-foreground">Suggested — review</h2>
          <div className="mt-2 space-y-2">
            {pending.map((f) => (
              <Card key={f.id}>
                <CardContent className="flex items-center gap-3 py-3">
                  <Badge variant="secondary" className="text-[10px]">
                    ai
                  </Badge>
                  <span className="flex-1 text-sm">{f.value}</span>
                  {f.projectName && (
                    <Badge variant="outline" className="text-[10px]">
                      {f.projectName}
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    aria-label="Accept fact"
                    onClick={() => patch(f.id, { status: "active" })}
                  >
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    aria-label="Dismiss fact"
                    onClick={() => remove(f.id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-sm font-medium text-muted-foreground">Active facts ({active.length})</h2>
        {active.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No facts yet. Add one or suggest from text.</p>
        ) : (
          <div className="mt-2 space-y-2">
            {active.map((f) => (
              <Card key={f.id}>
                <CardContent className="flex items-center gap-3 py-3">
                  {f.key && (
                    <Badge variant="outline" className="text-[10px]">
                      {f.key}
                    </Badge>
                  )}
                  <span className="flex-1 text-sm">{f.value}</span>
                  {f.projectName && (
                    <Badge variant="outline" className="text-[10px]">
                      {f.projectName}
                    </Badge>
                  )}
                  <Badge variant="secondary" className="text-[10px]">
                    {f.source}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className={"h-7 w-7 " + (f.pinned ? "text-yellow-500" : "")}
                    aria-label="Pin fact"
                    onClick={() => patch(f.id, { pinned: !f.pinned })}
                  >
                    <Pin className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    aria-label="Delete fact"
                    onClick={() => remove(f.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={suggestOpen} onOpenChange={setSuggestOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Suggest facts from text</DialogTitle>
            <DialogDescription>
              Gemma extracts durable facts; you review and accept them.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            rows={6}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Paste notes, an email, a bio…"
            disabled={busy}
          />
          <DialogFooter>
            <Button onClick={suggest} disabled={busy || !text.trim()}>
              {busy ? "Extracting…" : "Suggest"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
