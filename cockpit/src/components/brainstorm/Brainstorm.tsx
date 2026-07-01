"use client";

import { useRef, useState } from "react";
import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TemplateRunner } from "@/components/library/TemplateRunner";
import { IdeaRefiner } from "@/components/brainstorm/IdeaRefiner";
import { cn } from "@/lib/utils";

export type Technique = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  variables: string;
};

type Mode = "refine" | "techniques";

const MODES = [
  { id: "refine", label: "Refine an idea" },
  { id: "techniques", label: "Thinking techniques" },
] as const;

export function Brainstorm({ techniques }: { techniques: Technique[] }) {
  const [active, setActive] = useState<Technique | null>(techniques[0] ?? null);
  // "Refine an idea" (the AHA interview) is the headline; the classic technique
  // picker moves behind a tab.
  const [mode, setMode] = useState<Mode>("refine");
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Roving-tabindex keyboard support for the ARIA tablist (arrows/Home/End).
  function onTabKeyDown(e: React.KeyboardEvent, i: number) {
    let next = i;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (i + 1) % MODES.length;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") next = (i - 1 + MODES.length) % MODES.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = MODES.length - 1;
    else return;
    e.preventDefault();
    setMode(MODES[next].id);
    tabRefs.current[next]?.focus();
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold tracking-tight">Brainstorming</h1>
      <p className="mt-1 text-muted-foreground">
        {mode === "refine"
          ? "Talk an idea through — it interviews you, then writes an honest brief."
          : "Pick a thinking technique and run it on your topic. Results save as ideas."}
      </p>

      <div role="tablist" aria-label="Brainstorming modes" className="mt-4 inline-flex rounded-lg border border-border p-0.5">
        {MODES.map((t, i) => (
          <button
            key={t.id}
            ref={(el) => {
              tabRefs.current[i] = el;
            }}
            type="button"
            role="tab"
            id={`brainstorm-tab-${t.id}`}
            aria-selected={mode === t.id}
            aria-controls="brainstorm-panel"
            tabIndex={mode === t.id ? 0 : -1}
            onClick={() => setMode(t.id)}
            onKeyDown={(e) => onTabKeyDown(e, i)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              mode === t.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div id="brainstorm-panel" role="tabpanel" aria-labelledby={`brainstorm-tab-${mode}`} tabIndex={0} className="focus:outline-none">
      {mode === "refine" ? (
        <div className="mt-6">
          <IdeaRefiner />
        </div>
      ) : techniques.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">
          No techniques found. Run <code>npm run db:seed</code> to load the builtins.
        </p>
      ) : (
        <>
          <div className="mt-6 flex flex-wrap gap-2">
            {techniques.map((t) => (
              <Button
                key={t.id}
                variant={active?.id === t.id ? "default" : "outline"}
                size="sm"
                onClick={() => setActive(t)}
              >
                {t.name}
              </Button>
            ))}
          </div>

          {active && (
            <Card className="mt-6">
              <CardHeader className="py-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Sparkles className="h-4 w-4" /> {active.name}
                  {active.category && <Badge variant="outline">{active.category}</Badge>}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {active.description && (
                  <p className="mb-4 text-sm text-muted-foreground">{active.description}</p>
                )}
                {/* key resets the runner's inputs/output when the technique changes */}
                <TemplateRunner key={active.id} template={active} savedLabel="Saved as idea" />
              </CardContent>
            </Card>
          )}
        </>
      )}
      </div>
    </div>
  );
}
