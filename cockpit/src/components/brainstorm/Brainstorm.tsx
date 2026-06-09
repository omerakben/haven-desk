"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TemplateRunner } from "@/components/library/TemplateRunner";

export type Technique = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  variables: string;
};

export function Brainstorm({ techniques }: { techniques: Technique[] }) {
  const [active, setActive] = useState<Technique | null>(techniques[0] ?? null);

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold tracking-tight">Brainstorming</h1>
      <p className="mt-1 text-muted-foreground">
        Pick a thinking technique and run it on your topic. Results save as ideas.
      </p>

      {techniques.length === 0 ? (
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
  );
}
