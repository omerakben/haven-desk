"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Relatable starter names across personas (small business / individual / home /
// professional) so a first-timer sees what a "project" is for, not a blank box.
const EXAMPLE_PROJECTS = ["Acme Bakery", "Side hustle", "Home renovation", "Q3 marketing"];

export type ProjectCounts = {
  prompts: number;
  tasks: number;
  ideas: number;
  emails: number;
  facts: number;
};
export type ProjectRow = {
  id: string;
  name: string;
  description: string | null;
  counts: ProjectCounts;
};

export function ProjectsList({ projects }: { projects: ProjectRow[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function fillExample(example: string) {
    setName(example);
    inputRef.current?.focus();
  }

  async function create() {
    if (!name.trim()) return;
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) {
      toast.error("Failed to create");
      return;
    }
    setName("");
    router.refresh();
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
      <p className="mt-1 text-muted-foreground">
        Group prompts, tasks, ideas, drafts, and memory by project. Pick the active project in the
        sidebar so new work is filed automatically.
      </p>

      <div className="mt-6 flex gap-2">
        <Input
          ref={inputRef}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New project name…"
          className="max-w-md"
          onKeyDown={(e) => {
            if (e.key === "Enter") create();
          }}
        />
        <Button onClick={create} disabled={!name.trim()}>
          <Plus className="mr-1 h-4 w-4" /> Create
        </Button>
      </div>

      {projects.length === 0 ? (
        <div className="mt-6 rounded-lg border border-dashed border-border p-5">
          <p className="text-sm text-muted-foreground">
            No projects yet — and that&apos;s fine. Without one, everything lives in your global
            space. Create a project when you want to keep a client, a side hustle, or a big effort
            on its own — with its own tasks, notes, drafts, and memory.
          </p>
          <p className="mt-3 text-xs font-medium text-muted-foreground">Start with an example:</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {EXAMPLE_PROJECTS.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => fillExample(ex)}
                className="rounded-full border border-border px-3 py-1 text-sm transition-colors hover:border-primary/40 hover:bg-accent/60"
              >
                {ex}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {projects.map((p) => (
            <Link key={p.id} href={`/tools/projects/${p.id}`}>
              <Card className="h-full transition-shadow hover:shadow-sm">
                <CardHeader className="py-3">
                  <CardTitle className="text-base">{p.name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  {p.description && <p className="line-clamp-2">{p.description}</p>}
                  <p className="text-xs">
                    {p.counts.prompts} prompts · {p.counts.tasks} tasks · {p.counts.ideas} ideas ·{" "}
                    {p.counts.emails} drafts · {p.counts.facts} facts
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
