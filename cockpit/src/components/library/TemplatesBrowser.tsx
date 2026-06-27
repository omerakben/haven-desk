"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Search, Play, Package, Plus, Pencil, Copy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { TemplateRunDialog } from "@/components/library/TemplateRunDialog";
import { groupTemplates } from "@/lib/templateGroups";

export type BrowseTemplate = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  builtin: boolean;
  favorite: boolean;
  variables: string;
};

export function TemplatesBrowser({ templates, initialRunId }: { templates: BrowseTemplate[]; initialRunId?: string | null }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  // Deep-link (?run=<id> from ⌘K): open the dialog from initial state (no effect)
  // for the given id, from the already-fetched list. The page keys this component
  // by `run`, so re-navigating to a different ?run= remounts and reopens.
  const [running, setRunning] = useState<BrowseTemplate | null>(
    () => (initialRunId ? templates.find((x) => x.id === initialRunId) ?? null : null),
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return templates;
    return templates.filter((t) => `${t.name} ${t.description ?? ""} ${t.category ?? ""}`.toLowerCase().includes(q));
  }, [query, templates]);

  const groups = useMemo(() => groupTemplates(filtered), [filtered]);

  if (templates.length === 0) {
    return (
      <div className="max-w-3xl">
        <h1 className="text-2xl font-semibold tracking-tight">Templates</h1>
        <Card className="mt-6">
          <CardContent className="flex flex-col items-start gap-3 p-6">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Package className="h-[18px] w-[18px]" />
            </span>
            <div>
              <div className="font-medium">No templates yet</div>
              <p className="mt-1 text-sm text-muted-foreground">
                Install a pack to get ready-made templates like a proposal writer or an SOP builder.
              </p>
            </div>
            <Button asChild size="sm">
              <Link href="/tools/packs">Browse packs</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-start justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Templates</h1>
        <Button asChild size="sm" variant="outline" className="shrink-0">
          <Link href="/tools/prompt-library?new=template">
            <Plus className="mr-1 h-4 w-4" /> New template
          </Link>
        </Button>
      </div>
      <p className="mt-1.5 text-[15px] text-muted-foreground">
        Pick a ready-made template, fill the blanks, and run it. Manage or create your own in the{" "}
        <Link
          href="/tools/prompt-library"
          className="font-medium text-foreground underline underline-offset-2 hover:text-primary"
        >
          Prompt Library
        </Link>
        .
      </p>

      <div className="relative mt-5">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search templates — proposal, email, SOP…"
          aria-label="Search templates"
          className="h-10 w-full rounded-lg border border-input bg-card pl-9 pr-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
        />
      </div>

      {groups.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">No templates match “{query.trim()}”.</p>
      ) : (
        <div className="mt-6 space-y-7">
          {groups.map((g) => (
            <section key={g.label}>
              <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{g.label}</h2>
              <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {g.templates.map((t) => (
                  <Card key={t.id} className="h-full">
                    <CardContent className="flex h-full flex-col gap-2 p-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="truncate text-sm font-medium">{t.name}</span>
                          {t.category && (
                            <Badge variant="outline" className="shrink-0 text-[10px]">
                              {t.category}
                            </Badge>
                          )}
                        </div>
                        {t.description && (
                          <p className="mt-1 line-clamp-2 text-xs leading-snug text-muted-foreground">{t.description}</p>
                        )}
                      </div>
                      <div className="mt-auto flex items-center gap-1.5 pt-1">
                        <Button size="sm" variant="outline" className="h-7 px-2 text-xs" onClick={() => setRunning(t)}>
                          <Play className="mr-1 h-3.5 w-3.5" /> Use
                        </Button>
                        {/* Custom templates edit in place; shipped built-ins are
                            read-only, so they fork into a custom copy ("Customize").
                            Both deep-link to the Prompt Library with the right dialog. */}
                        <Button asChild size="sm" variant="ghost" className="h-7 px-2 text-xs text-muted-foreground">
                          {t.builtin ? (
                            <Link href={`/tools/prompt-library?duplicate=${t.id}`}>
                              <Copy className="mr-1 h-3.5 w-3.5" /> Customize
                            </Link>
                          ) : (
                            <Link href={`/tools/prompt-library?edit=${t.id}`}>
                              <Pencil className="mr-1 h-3.5 w-3.5" /> Edit
                            </Link>
                          )}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <TemplateRunDialog
        template={running}
        open={running !== null}
        onOpenChange={(o) => {
          if (o) return;
          setRunning(null);
          // Arrived via ?run=: clear the param on close so re-selecting the SAME
          // template from ⌘K is a real none→id transition that remounts + reopens.
          if (initialRunId) router.replace("/tools/templates", { scroll: false });
        }}
        savedLabel="Saved to library"
      />
    </div>
  );
}
