"use client";

import { useMemo, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { Copy, Star, Pencil, Trash2, Download, Upload, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TemplateRunner } from "@/components/library/TemplateRunner";

export type LibPrompt = {
  id: string;
  title: string;
  original: string;
  optimized: string | null;
  tags: string | null;
  favorite: boolean;
  source: string;
};

export type LibTemplate = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  variables: string;
};

function tagList(tags: string | null): string[] {
  return (tags ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

export function PromptLibrary({
  prompts,
  templates,
}: {
  prompts: LibPrompt[];
  templates: LibTemplate[];
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<LibPrompt | null>(null);
  const [useTemplate, setUseTemplate] = useState<LibTemplate | null>(null);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return prompts;
    return prompts.filter((p) =>
      [p.title, p.original, p.optimized ?? "", p.tags ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(needle)
    );
  }, [q, prompts]);

  async function patch(id: string, data: Record<string, unknown>) {
    const res = await fetch(`/api/prompts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      toast.error("Update failed");
      return false;
    }
    router.refresh();
    return true;
  }

  async function remove(id: string) {
    const res = await fetch(`/api/prompts/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Delete failed");
      return;
    }
    toast.success("Deleted");
    router.refresh();
  }

  async function onImportFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const json = JSON.parse(await file.text());
      const res = await fetch("/api/prompts/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(json),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Import failed");
      toast.success(`Imported ${data.imported} prompt(s)`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Import failed");
    } finally {
      e.target.value = "";
    }
  }

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-semibold">Prompt Library</h1>
      <p className="mt-1 text-muted-foreground">
        Saved prompts and reusable variable templates.
      </p>

      <Tabs defaultValue="prompts" className="mt-6">
        <TabsList>
          <TabsTrigger value="prompts">Saved prompts ({prompts.length})</TabsTrigger>
          <TabsTrigger value="templates">Templates ({templates.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="prompts" className="mt-4">
          <div className="flex flex-wrap items-center gap-2">
            <Input
              placeholder="Search prompts…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="max-w-xs"
            />
            <div className="flex-1" />
            <Button variant="outline" size="sm" asChild>
              <a href="/api/prompts/export" download>
                <Download className="mr-1 h-4 w-4" /> Export
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <label className="cursor-pointer">
                <Upload className="mr-1 h-4 w-4" /> Import
                <input
                  type="file"
                  accept="application/json"
                  className="hidden"
                  onChange={onImportFile}
                />
              </label>
            </Button>
          </div>

          {filtered.length === 0 ? (
            <p className="mt-6 text-sm text-muted-foreground">
              {prompts.length === 0
                ? "No saved prompts yet. Optimize one, or run a template."
                : "No matches."}
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {filtered.map((p) => (
                <Card key={p.id}>
                  <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 py-3">
                    <CardTitle className="text-base">{p.title}</CardTitle>
                    <div className="flex shrink-0 gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        aria-label="Toggle favorite"
                        onClick={() => patch(p.id, { favorite: !p.favorite })}
                      >
                        <Star
                          className={
                            "h-4 w-4 " + (p.favorite ? "fill-yellow-400 text-yellow-400" : "")
                          }
                        />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        aria-label="Copy"
                        onClick={() => {
                          navigator.clipboard.writeText(p.optimized || p.original);
                          toast.success("Copied");
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        aria-label="Edit"
                        onClick={() => setEditing(p)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        aria-label="Delete"
                        onClick={() => remove(p.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <p className="line-clamp-3 whitespace-pre-wrap text-sm text-muted-foreground">
                      {p.optimized || p.original}
                    </p>
                    {tagList(p.tags).length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {tagList(p.tags).map((t) => (
                          <Badge key={t} variant="secondary">
                            {t}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="templates" className="mt-4">
          {templates.length === 0 ? (
            <p className="text-sm text-muted-foreground">No templates.</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {templates.map((t) => (
                <Card key={t.id}>
                  <CardHeader className="py-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      {t.name}
                      {t.category && <Badge variant="outline">{t.category}</Badge>}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {t.description && (
                      <p className="text-sm text-muted-foreground">{t.description}</p>
                    )}
                    <Button size="sm" variant="secondary" onClick={() => setUseTemplate(t)}>
                      <Sparkles className="mr-1 h-4 w-4" /> Use
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit prompt</DialogTitle>
            <DialogDescription>Update the title and tags.</DialogDescription>
          </DialogHeader>
          {editing && (
            <EditForm
              prompt={editing}
              onSave={async (title, tags) => {
                const ok = await patch(editing.id, { title, tags });
                if (ok) {
                  toast.success("Saved");
                  setEditing(null);
                }
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!useTemplate} onOpenChange={(o) => !o && setUseTemplate(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{useTemplate?.name}</DialogTitle>
            {useTemplate?.description && (
              <DialogDescription>{useTemplate.description}</DialogDescription>
            )}
          </DialogHeader>
          {useTemplate && (
            <TemplateRunner template={useTemplate} savedLabel="Saved to library" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EditForm({
  prompt,
  onSave,
}: {
  prompt: LibPrompt;
  onSave: (title: string, tags: string) => void;
}) {
  const [title, setTitle] = useState(prompt.title);
  const [tags, setTags] = useState(prompt.tags ?? "");
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="edit-title">Title</Label>
        <Input id="edit-title" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="edit-tags">Tags (comma-separated)</Label>
        <Input
          id="edit-tags"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="email, draft"
        />
      </div>
      <DialogFooter>
        <Button onClick={() => onSave(title.trim(), tags.trim())} disabled={!title.trim()}>
          Save
        </Button>
      </DialogFooter>
    </div>
  );
}
