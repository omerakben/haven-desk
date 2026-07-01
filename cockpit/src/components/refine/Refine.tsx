"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Square, RotateCcw, StickyNote, Check } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Markdown } from "@/components/Markdown";
import { ExtractTasksButton } from "@/components/tools/ExtractTasksButton";
import { StarterChips } from "@/components/StarterChips";
import { useRefineChat } from "@/hooks/useRefineChat";
import { REFINE_MODES, DEFAULT_MODE, type RefineModeId } from "@/lib/refine";
import { REFINE_TARGET, INBOX_FIELD, builtinStartersFor } from "@/lib/quickActions";
import { deriveNoteTitle } from "@/lib/resultTitle";
import { cn } from "@/lib/utils";

// Clicking a lens mid-discussion sends this as the next turn, so switching lens
// is one click that does something — the AHA pipeline (ask → align → critique →
// sharpen) made non-linear. The history already carries the idea + answers.
const LENS_TURN: Record<RefineModeId, string> = {
  interview: "Interview me about this — ask the questions that matter most.",
  align: "Reflect back what you understand about the idea so far.",
  critique: "Critique the idea as it stands now.",
  sharpen: "Sharpen this into a clear, usable brief.",
};

// Save one assistant answer as a note (an Idea), verbatim — no model re-run.
function SaveAnswer({ text }: { text: string }) {
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const busy = useRef(false);

  async function save() {
    const snapshot = text;
    if (!snapshot.trim() || saved || busy.current) return;
    busy.current = true;
    setSaving(true);
    try {
      const res = await fetch("/api/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: deriveNoteTitle(snapshot, "Refined idea"), content: snapshot }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Couldn't save");
      setSaved(true);
      toast.success("Saved as a note", {
        action: { label: "Open", onClick: () => (window.location.href = "/tools/notes") },
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't save");
    } finally {
      busy.current = false;
      setSaving(false);
    }
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <span className="text-xs text-muted-foreground">Save it:</span>
      <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={save} disabled={saving || saved}>
        {saved ? <Check className="mr-1 h-3.5 w-3.5" /> : <StickyNote className="mr-1 h-3.5 w-3.5" />}
        {saved ? "Saved" : "Save as note"}
      </Button>
      <ExtractTasksButton text={text} label="Turn into tasks" />
    </div>
  );
}

export function Refine() {
  const [mode, setMode] = useState<RefineModeId>(DEFAULT_MODE);
  const [input, setInput] = useState("");
  const { messages, streaming, error, elapsedMs, send, stop, reset } = useRefineChat();
  const secs = Math.round(elapsedMs / 1000);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Pin to the latest line. During streaming use an instant scroll — a smooth
    // scroll restarts its animation on every token and visibly stutters.
    bottomRef.current?.scrollIntoView({ behavior: streaming ? "auto" : "smooth", block: "end" });
  }, [messages, streaming]);

  const started = messages.length > 0;

  function submit(text: string) {
    const q = text.trim();
    if (!q || streaming) return;
    setInput("");
    send(q, mode);
  }

  // Pick a lens. Before any idea exists it just selects; once a discussion is
  // going, it also runs that lens over what's been said.
  function pickLens(next: RefineModeId) {
    setMode(next);
    if (started && !streaming) send(LENS_TURN[next], next);
  }

  const lastAssistant = (() => {
    for (let i = messages.length - 1; i >= 0; i--) if (messages[i].role === "assistant") return i;
    return -1;
  })();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Refine</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Talk an idea through. Refine interviews you, reflects it back, stress-tests it, and sharpens it into a
          clear brief — like a product manager at your side. Everything stays on your machine.
        </p>
      </div>

      {/* The four AHA lenses. Highlight the active one. */}
      <div className="flex flex-wrap gap-2">
        {REFINE_MODES.map((m) => {
          const active = m.id === mode;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => pickLens(m.id)}
              disabled={streaming}
              title={m.blurb}
              aria-pressed={active}
              className={cn(
                "rounded-full border px-3 py-1 text-sm transition-colors disabled:opacity-50",
                active
                  ? "border-primary bg-primary/10 font-medium text-foreground"
                  : "border-border text-muted-foreground hover:border-primary/45 hover:bg-primary/5",
              )}
            >
              {m.label}
            </button>
          );
        })}
      </div>

      {/* Transcript */}
      {started && (
        <div className="space-y-4 rounded-xl border border-border bg-card/40 p-4">
          {messages.map((m, i) =>
            m.role === "user" ? (
              <div className="ml-auto max-w-[85%] whitespace-pre-wrap break-words rounded-lg bg-primary/10 px-3 py-2 text-sm" key={i}>
                {m.content}
              </div>
            ) : (
              <div key={i} className="max-w-[95%] text-sm">
                {m.content ? (
                  <Markdown>{m.content}</Markdown>
                ) : streaming && i === messages.length - 1 ? (
                  <span className="text-muted-foreground">Thinking… {secs}s</span>
                ) : null}
                {m.content && i === lastAssistant && !streaming && <SaveAnswer text={m.content} />}
              </div>
            ),
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div ref={bottomRef} />
        </div>
      )}

      {/* Empty-state examples — editable starters (create/edit/delete/reset). */}
      {!started && (
        <StarterChips
          target={REFINE_TARGET}
          fallback={builtinStartersFor(REFINE_TARGET)}
          current={{ [INBOX_FIELD]: input }}
          onPick={(inputs) => setInput(inputs[INBOX_FIELD] ?? "")}
          editFields={[{ name: INBOX_FIELD, label: "Idea", type: "textarea" }]}
          headline="Not sure where to start? Tap one:"
        />
      )}

      {/* Composer */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(input);
        }}
        className="space-y-2"
      >
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
              e.preventDefault();
              submit(input);
            }
          }}
          placeholder={started ? "Answer, or add more…" : "Share an idea — a sentence is plenty."}
          rows={started ? 2 : 3}
          disabled={streaming}
          aria-label="Your idea"
        />
        <div className="flex items-center gap-2">
          {streaming ? (
            <Button type="button" variant="secondary" onClick={stop}>
              <Square className="mr-1.5 h-4 w-4" /> Stop
            </Button>
          ) : (
            <Button type="submit" disabled={!input.trim()}>
              <Send className="mr-1.5 h-4 w-4" /> {started ? "Send" : "Start"}
            </Button>
          )}
          {started && !streaming && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                reset();
                setInput("");
                setMode(DEFAULT_MODE);
              }}
            >
              <RotateCcw className="mr-1.5 h-4 w-4" /> New idea
            </Button>
          )}
          <span className="ml-auto text-xs text-muted-foreground">⌘/Ctrl+Enter to send</span>
        </div>
      </form>
    </div>
  );
}
