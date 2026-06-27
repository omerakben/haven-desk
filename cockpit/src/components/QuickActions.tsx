"use client";

import { useMemo, useState } from "react";
import {
  ArrowLeft,
  Square,
  Search,
  Clock,
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

import { toast } from "sonner";

import { useAiTool } from "@/hooks/useAiTool";
import { usePersisted } from "@/hooks/usePersisted";
import { Button } from "@/components/ui/button";
import { AiOutput } from "@/components/tools/AiOutput";
import { ErrorAlert } from "@/components/ErrorAlert";
import { StarterChips } from "@/components/StarterChips";
import { ResultSaveActions } from "@/components/tools/ResultSaveActions";
import {
  QUICK_ACTIONS,
  QUICK_ACTION_CATEGORIES,
  CATEGORY_ACCENT,
  REFINE_OPTIONS,
  getQuickAction,
  missingInputs,
  searchQuickActions,
  pushRecent,
  recentActions,
  type QuickAction,
} from "@/lib/quickActions";

const RECENTS_KEY = "sk:qa:recents";

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

function ActionCard({ a, onOpen }: { a: QuickAction; onOpen: (a: QuickAction) => void }) {
  const Icon = ICONS[a.icon] ?? Sparkles;
  return (
    <button
      type="button"
      onClick={() => onOpen(a)}
      className="group flex items-start gap-3 rounded-xl border border-border p-4 text-left transition-[border-color,box-shadow] hover:border-primary/40 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
    >
      <span className={"flex h-9 w-9 shrink-0 items-center justify-center rounded-xl " + CATEGORY_ACCENT[a.category]}>
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-medium leading-tight">{a.title}</span>
        <span className="mt-1 block text-xs leading-snug text-muted-foreground">{a.blurb}</span>
      </span>
    </button>
  );
}

export function QuickActions({ initialActionId }: { initialActionId: string | null }) {
  const [active, setActive] = useState<QuickAction | null>(
    initialActionId ? getQuickAction(initialActionId) ?? null : null,
  );
  const [values, setValues] = useState<Record<string, string>>({});
  const [query, setQuery] = useState("");
  const [recentsJson, setRecentsJson] = usePersisted(RECENTS_KEY, "[]");
  const { output, status, error, isRunning, elapsedMs, run, stop, reset, restore } = useAiTool({
    endpoint: "/api/quick-action",
    buildBody: (_input, extra) => extra,
  });
  const secs = Math.round(elapsedMs / 1000);

  const recents = useMemo(() => {
    try {
      const a = JSON.parse(recentsJson);
      return recentActions(Array.isArray(a) ? a : []);
    } catch {
      return [];
    }
  }, [recentsJson]);

  // Remember an action the moment it's run (front of the list, deduped, capped).
  function recordRecent(id: string) {
    let ids: string[] = [];
    try {
      const a = JSON.parse(recentsJson);
      // Coerce to a clean string[] so hand-corrupted storage can't consume cap slots.
      ids = Array.isArray(a) ? a.filter((x): x is string => typeof x === "string") : [];
    } catch {
      ids = [];
    }
    setRecentsJson(JSON.stringify(pushRecent(ids, id)));
  }

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
    const trimmed = query.trim();
    const results = searchQuickActions(query);
    return (
      <div className="max-w-4xl">
        <h1 className="text-2xl font-semibold tracking-tight">Quick actions</h1>
        <p className="mt-1.5 text-[15px] text-muted-foreground">
          One-click help for everyday tasks. Pick one, answer a question or two, and get something you
          can use. Everything runs on this machine.
        </p>

        <div className="relative mt-5">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search actions — e.g. email, list, summarize…"
            aria-label="Search quick actions"
            className="h-10 w-full rounded-lg border border-input bg-card pl-9 pr-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
          />
        </div>

        {trimmed ? (
          results.length > 0 ? (
            <div className="mt-5">
              <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {results.length} {results.length === 1 ? "result" : "results"}
              </h2>
              <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {results.map((a) => (
                  <ActionCard key={a.id} a={a} onOpen={open} />
                ))}
              </div>
            </div>
          ) : (
            <p className="mt-6 text-sm text-muted-foreground">
              No actions match “{trimmed}”. Try a simpler word, or clear the search to browse all{" "}
              {QUICK_ACTIONS.length}.
            </p>
          )
        ) : (
          <div className="mt-6 space-y-7">
            {recents.length > 0 && (
              <section>
                <h2 className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" /> Recently used
                </h2>
                <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {recents.map((a) => (
                    <ActionCard key={a.id} a={a} onOpen={open} />
                  ))}
                </div>
              </section>
            )}
            {QUICK_ACTION_CATEGORIES.map((cat) => (
              <section key={cat.id}>
                <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{cat.label}</h2>
                <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {QUICK_ACTIONS.filter((a) => a.category === cat.id).map((a) => (
                    <ActionCard key={a.id} a={a} onOpen={open} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    );
  }

  const Icon = ICONS[active.icon] ?? Sparkles;
  const missing = missingInputs(active, values);

  async function go() {
    if (!active) return;
    recordRecent(active.id);
    await run("", { actionId: active.id, inputs: values });
  }

  // Tap an example: fill the visible form AND run, passing the inputs straight to
  // run so we don't depend on the just-set (async) state.
  async function runWith(inputs: Record<string, string>) {
    if (!active) return;
    recordRecent(active.id);
    setValues(inputs);
    await run("", { actionId: active.id, inputs });
  }

  // One-tap refine: re-run the model over the current result with a plain tweak.
  // Iterative — the refined text replaces the result, so a second tap refines it.
  // The source IS the current output, so on a failed/stopped refine we restore
  // it: the local 12B can error mid-stream and a draft must never be lost.
  async function refineWith(instruction: string) {
    if (!output) return;
    const prev = output;
    const ok = await run("", { refine: { text: prev, instruction } });
    if (!ok) {
      restore(prev);
      toast.info("Kept your previous draft.");
    }
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
        <span className={"flex h-10 w-10 shrink-0 items-center justify-center rounded-xl " + CATEGORY_ACCENT[active.category]}>
          <Icon className="h-5 w-5" />
        </span>
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">{active.title}</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{active.blurb}</p>
        </div>
      </div>

      <StarterChips
        key={active.id}
        target={active.id}
        fallback={active.examples ?? []}
        current={values}
        onPick={(inputs) => runWith(inputs)}
        editFields={active.inputs.map((i) => ({ name: i.name, label: i.label, type: i.type }))}
        headline="See it instantly — tap one to fill and run:"
      />

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

      {status === "done" && output && (
        <>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">Make it:</span>
            {REFINE_OPTIONS.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => refineWith(r.instruction)}
                disabled={isRunning}
                className="rounded-full border border-border px-2.5 py-1 text-xs transition-colors hover:border-primary/40 hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 disabled:opacity-60"
              >
                {r.label}
              </button>
            ))}
          </div>
          <ResultSaveActions text={output} action={active} />
        </>
      )}
    </div>
  );
}
