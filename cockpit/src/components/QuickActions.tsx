"use client";

import { useState } from "react";
import {
  ArrowLeft,
  Square,
  Reply,
  Mail,
  Heart,
  ListChecks,
  FileText,
  ListFilter,
  CalendarDays,
  Utensils,
  GraduationCap,
  Smile,
  Briefcase,
  SpellCheck,
  Scissors,
  Lightbulb,
  CheckSquare,
  Megaphone,
  MessageSquareHeart,
  Luggage,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

import { useAiTool } from "@/hooks/useAiTool";
import { Button } from "@/components/ui/button";
import { AiOutput } from "@/components/tools/AiOutput";
import { ErrorAlert } from "@/components/ErrorAlert";
import {
  QUICK_ACTIONS,
  QUICK_ACTION_CATEGORIES,
  getQuickAction,
  missingInputs,
  type QuickAction,
} from "@/lib/quickActions";

const ICONS: Record<string, LucideIcon> = {
  Reply,
  Mail,
  Heart,
  ListChecks,
  FileText,
  ListFilter,
  CalendarDays,
  Utensils,
  GraduationCap,
  Smile,
  Briefcase,
  SpellCheck,
  Scissors,
  Lightbulb,
  CheckSquare,
  Megaphone,
  MessageSquareHeart,
  Luggage,
};

export function QuickActions({ initialActionId }: { initialActionId: string | null }) {
  const [active, setActive] = useState<QuickAction | null>(
    initialActionId ? getQuickAction(initialActionId) ?? null : null,
  );
  const [values, setValues] = useState<Record<string, string>>({});
  const { output, status, error, isRunning, elapsedMs, run, stop, reset } = useAiTool({
    endpoint: "/api/quick-action",
    buildBody: (_input, extra) => extra,
  });
  const secs = Math.round(elapsedMs / 1000);

  function open(a: QuickAction) {
    stop(); // abort any in-flight run before switching actions
    setActive(a);
    setValues({});
    reset();
  }
  function back() {
    stop();
    setActive(null);
    setValues({});
    reset();
  }

  if (!active) {
    return (
      <div className="max-w-4xl">
        <h1 className="text-2xl font-semibold tracking-tight">Quick actions</h1>
        <p className="mt-1.5 text-[15px] text-muted-foreground">
          One-click help for everyday tasks. Pick one, answer a question or two, and get something you
          can use. Everything runs on this machine.
        </p>
        <div className="mt-6 space-y-7">
          {QUICK_ACTION_CATEGORIES.map((cat) => (
            <section key={cat.id}>
              <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{cat.label}</h2>
              <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {QUICK_ACTIONS.filter((a) => a.category === cat.id).map((a) => {
                  const Icon = ICONS[a.icon] ?? Sparkles;
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => open(a)}
                      className="group flex items-start gap-3 rounded-xl border border-border p-4 text-left transition-[border-color,box-shadow] hover:border-primary/40 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
                    >
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Icon className="h-[18px] w-[18px]" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-medium leading-tight">{a.title}</span>
                        <span className="mt-1 block text-xs leading-snug text-muted-foreground">{a.blurb}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>
    );
  }

  const Icon = ICONS[active.icon] ?? Sparkles;
  const missing = missingInputs(active, values);

  async function go() {
    if (!active) return;
    await run("", { actionId: active.id, inputs: values });
  }

  return (
    <div className="max-w-3xl">
      <button
        type="button"
        onClick={back}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> All actions
      </button>

      <div className="mt-3 flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">{active.title}</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{active.blurb}</p>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {active.inputs.map((inp) => (
          <div key={inp.name}>
            <label htmlFor={`qa-${inp.name}`} className="text-sm font-medium">
              {inp.label}
              {inp.optional && <span className="ml-1 text-xs font-normal text-muted-foreground">(optional)</span>}
            </label>
            {inp.type === "textarea" ? (
              <textarea
                id={`qa-${inp.name}`}
                value={values[inp.name] ?? ""}
                onChange={(e) => setValues((s) => ({ ...s, [inp.name]: e.target.value }))}
                placeholder={inp.placeholder}
                disabled={isRunning}
                className="mt-1.5 h-28 w-full rounded-lg border border-input bg-card p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
              />
            ) : (
              <input
                id={`qa-${inp.name}`}
                value={values[inp.name] ?? ""}
                onChange={(e) => setValues((s) => ({ ...s, [inp.name]: e.target.value }))}
                placeholder={inp.placeholder}
                disabled={isRunning}
                className="mt-1.5 h-10 w-full rounded-lg border border-input bg-card px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
              />
            )}
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button onClick={go} disabled={isRunning || missing.length > 0}>
          {isRunning ? `Working… ${secs}s` : "Go"}
        </Button>
        {isRunning && (
          <Button variant="ghost" onClick={stop}>
            <Square className="mr-1 h-4 w-4" /> Stop
          </Button>
        )}
      </div>

      {error && <ErrorAlert className="mt-4" title="Couldn't run that" message={error} />}
      <AiOutput output={output} status={status} label="Result" />
    </div>
  );
}
