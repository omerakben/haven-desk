"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MessageCircleQuestion, X, Send, Square } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Markdown } from "@/components/Markdown";
import { useWizardChat } from "@/hooks/useWizardChat";
import { suggestTools } from "@/lib/wizard";
import { StarterChips } from "@/components/StarterChips";
import { WIZARD_TARGET, INBOX_FIELD, builtinStartersFor } from "@/lib/quickActions";

// "Open ___" chips below an answer. suggestTools only ever returns real nav
// items, so a hallucinated tool name in the prose can never produce a chip.
function ToolChips({ text }: { text: string }) {
  const tools = suggestTools(text);
  if (tools.length === 0) return null;
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      {tools.map((t) => {
        const Icon = t.icon;
        return (
          <Link
            key={t.href}
            href={t.href}
            className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-card px-2 py-0.5 text-xs font-medium text-foreground transition-colors hover:border-primary/50 hover:bg-primary/10"
          >
            <Icon className="h-3 w-3 text-primary" /> Open {t.label}
          </Link>
        );
      })}
    </div>
  );
}

// A floating, NON-MODAL help bubble. Non-modal on purpose: the user reads an
// answer, clicks a tool chip, and navigates with the page still interactive.
export function HelpWizard() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const { messages, streaming, error, elapsedMs, send, stop } = useWizardChat();
  const secs = Math.round(elapsedMs / 1000);

  // Escape closes the panel. Non-modal by design (no focus trap), so this is a
  // convenience for keyboard users, not a modal dismissal.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  function submit(text: string) {
    const q = text.trim();
    if (!q) return;
    setInput("");
    send(q);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close the Haven Desk guide" : "Open the Haven Desk guide"}
        className="fixed bottom-4 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
      >
        {open ? <X className="h-5 w-5" /> : <MessageCircleQuestion className="h-6 w-6" />}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Haven Desk guide"
          className="fixed bottom-20 right-4 z-40 flex h-[min(70vh,560px)] w-[min(380px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
        >
          <div className="border-b border-border p-3">
            <div className="text-sm font-semibold">Haven Desk guide</div>
            <p className="text-xs text-muted-foreground">Ask how anything works — it runs locally.</p>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto p-3">
            {messages.length === 0 ? (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Hi! I can explain any tool and point you to it. Try:</p>
                <StarterChips
                  target={WIZARD_TARGET}
                  fallback={builtinStartersFor(WIZARD_TARGET)}
                  current={{ [INBOX_FIELD]: input }}
                  onPick={(inputs) => submit(inputs[INBOX_FIELD] ?? "")}
                  editFields={[{ name: INBOX_FIELD, label: "Question", type: "textarea" }]}
                  headline="Ask about any tool:"
                />
              </div>
            ) : (
              messages.map((m, i) =>
                m.role === "user" ? (
                  <div key={i} className="ml-auto max-w-[85%] rounded-lg bg-primary/10 px-3 py-2 text-sm">
                    {m.content}
                  </div>
                ) : (
                  <div key={i} className="max-w-[92%] text-sm">
                    {m.content ? (
                      <Markdown>{m.content}</Markdown>
                    ) : streaming && i === messages.length - 1 ? (
                      <span className="text-muted-foreground">Thinking… {secs}s</span>
                    ) : null}
                    {m.content && !(streaming && i === messages.length - 1) && <ToolChips text={m.content} />}
                  </div>
                ),
              )
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              submit(input);
            }}
            className="flex gap-2 border-t border-border p-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask the guide…"
              aria-label="Ask the Haven Desk guide"
              disabled={streaming}
              className="h-9 flex-1 rounded-lg border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
            />
            {streaming ? (
              <Button type="button" variant="ghost" size="icon" onClick={stop} aria-label="Stop">
                <Square className="h-4 w-4" />
              </Button>
            ) : (
              <Button type="submit" size="icon" disabled={!input.trim()} aria-label="Send">
                <Send className="h-4 w-4" />
              </Button>
            )}
          </form>
        </div>
      )}
    </>
  );
}
