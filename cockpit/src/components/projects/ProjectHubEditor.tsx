"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "@/components/ConfirmDialog";

export type EditableProject = {
  id: string;
  name: string;
  description: string | null;
  owuiUrl: string | null;
};

export function ProjectHubEditor({ project }: { project: EditableProject }) {
  const router = useRouter();
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description ?? "");
  const [owuiUrl, setOwuiUrl] = useState(project.owuiUrl ?? "");
  const [confirmOpen, setConfirmOpen] = useState(false);

  async function save() {
    const res = await fetch(`/api/projects/${project.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description, owuiUrl }),
    });
    if (!res.ok) {
      toast.error("Failed to save");
      return;
    }
    toast.success("Saved");
    router.refresh();
  }

  async function del() {
    const res = await fetch(`/api/projects/${project.id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Failed to delete");
      return;
    }
    toast.success("Project deleted (items kept)");
    router.push("/tools/projects");
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">{project.name}</h1>
        <div className="flex gap-2">
          {owuiUrl && (
            <Button variant="outline" size="sm" asChild>
              <a href={owuiUrl} target="_blank" rel="noreferrer">
                <ExternalLink className="mr-1 h-4 w-4" /> Open WebUI knowledge
              </a>
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => setConfirmOpen(true)}>
            <Trash2 className="mr-1 h-4 w-4" /> Delete
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={`Delete "${project.name}"?`}
        description="The project is removed. Its tasks, prompts, ideas, facts, and QA sessions are kept but unlinked from it (set to no project). This can't be undone."
        confirmLabel="Delete project"
        onConfirm={del}
      />

      <div className="mt-4 grid gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="p-name">Name</Label>
          <Input id="p-name" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="p-desc">Description</Label>
          <Textarea
            id="p-desc"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="p-owui">Open WebUI knowledge URL</Label>
          <Input
            id="p-owui"
            value={owuiUrl}
            onChange={(e) => setOwuiUrl(e.target.value)}
            placeholder="http://localhost:3001/workspace/knowledge/…"
          />
          <p className="text-xs text-muted-foreground">
            Paste the link to this project&apos;s Open WebUI knowledge base for one-click RAG.
          </p>
        </div>
        <div>
          <Button onClick={save}>Save</Button>
        </div>
      </div>
    </div>
  );
}
