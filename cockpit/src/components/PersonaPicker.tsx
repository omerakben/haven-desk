"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Home, Briefcase, GraduationCap, Palette, FileText, type LucideIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Persona = {
  key: string;
  label: string;
  blurb: string;
  icon: LucideIcon;
  step: { label: string; href: string };
};

// First-run orientation. Each persona points to a real tool that works today, so
// the first action produces something (no dead ends). The pick is saved to
// Settings.persona so the onboarding does not reappear.
const PERSONAS: Persona[] = [
  { key: "household", label: "Household & family", blurb: "School emails, appointments, bills, and family to-dos.", icon: Home, step: { label: "Open Smart Inbox", href: "/tools/inbox" } },
  { key: "small-business", label: "Small business", blurb: "Proposals, follow-ups, meeting notes, and SOPs.", icon: Briefcase, step: { label: "Turn meeting notes into tasks", href: "/tools/meeting-notes" } },
  { key: "student", label: "Student or learner", blurb: "Notes, study plans, assignments, and exam prep.", icon: GraduationCap, step: { label: "Brainstorm a study plan", href: "/tools/brainstorm" } },
  { key: "creative", label: "Creative work", blurb: "Briefs, drafts, repurposing, and client tone.", icon: Palette, step: { label: "Draft a brief", href: "/tools/brainstorm" } },
  { key: "personal-admin", label: "Personal documents", blurb: "Insurance, forms, deadlines, and letters.", icon: FileText, step: { label: "Drop a note in Smart Inbox", href: "/tools/inbox" } },
];

export function PersonaPicker() {
  const router = useRouter();
  const [picked, setPicked] = useState<Persona | null>(null);
  const [busy, setBusy] = useState(false);

  async function save(persona: string) {
    try {
      await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ persona }),
      });
    } catch {
      // Saving the persona is best-effort; the user still gets oriented.
    }
  }

  async function choose(p: Persona) {
    setBusy(true);
    await save(p.key);
    setPicked(p);
    setBusy(false);
  }

  async function skip() {
    setBusy(true);
    await save("skipped");
    router.refresh();
  }

  if (picked) {
    return (
      <Card className="mt-6">
        <CardContent className="p-5">
          <h2 className="font-semibold">You&apos;re set for {picked.label.toLowerCase()}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Here&apos;s a good first step. Everything you do stays on this machine.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <Button asChild>
              <Link href={picked.step.href}>{picked.step.label}</Link>
            </Button>
            <Link href="/tools/packs" className="text-sm text-muted-foreground underline underline-offset-2">
              Browse packs
            </Link>
            <button
              type="button"
              onClick={() => router.refresh()}
              className="text-sm text-muted-foreground underline underline-offset-2"
            >
              Explore the dashboard
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-6 border-dashed">
      <CardContent className="p-5">
        <h2 className="font-semibold">Welcome to Haven Desk</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Private AI for the work of daily life. What do you want help with first?
        </p>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {PERSONAS.map((p) => {
            const Icon = p.icon;
            return (
              <button
                key={p.key}
                type="button"
                onClick={() => choose(p)}
                disabled={busy}
                className="group flex items-start gap-3 rounded-xl border border-border p-4 text-left transition-[border-color,box-shadow] hover:border-primary/40 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 disabled:opacity-60"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-[18px] w-[18px]" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium leading-tight">{p.label}</span>
                  <span className="mt-1 block text-xs leading-snug text-muted-foreground">{p.blurb}</span>
                </span>
              </button>
            );
          })}
        </div>
        <button
          type="button"
          onClick={skip}
          disabled={busy}
          className="mt-4 text-sm text-muted-foreground underline underline-offset-2 disabled:opacity-60"
        >
          Skip, just let me explore
        </button>
      </CardContent>
    </Card>
  );
}
