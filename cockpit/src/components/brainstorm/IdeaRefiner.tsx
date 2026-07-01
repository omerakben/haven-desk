"use client";

import { useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  MessagesSquare,
  RotateCcw,
  Sparkles,
  StickyNote,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { VoiceTextarea } from "@/components/tools/VoiceTextarea";
import { AiOutput } from "@/components/tools/AiOutput";
import { RefineRow } from "@/components/tools/RefineRow";
import { ErrorAlert } from "@/components/ErrorAlert";
import { ExtractTasksButton } from "@/components/tools/ExtractTasksButton";
import { useAiTool } from "@/hooks/useAiTool";
import { deriveNoteTitle } from "@/lib/resultTitle";
import { AHA_TYPE_LABELS, type AhaQuestionType, type InterviewAnswer, type InterviewQuestion } from "@/lib/aha";

type Phase = "idea" | "questions" | "brief";

/**
 * Refine a rough idea with the AHA framework: an "interview me" pass (3–5 typed
 * leverage questions) then a candid brief (what you're assuming, what's still
 * unknown, where it could go wrong, the one thing that matters, next steps). The
 * brief is saveable as a note or turnable into tasks. A "Quick pass" skips the
 * interview for the low-friction path. See lib/aha.ts / lib/prompts/aha.ts.
 */
export function IdeaRefiner() {
  const [phase, setPhase] = useState<Phase>("idea");
  const [idea, setIdea] = useState("");
  const [questions, setQuestions] = useState<InterviewQuestion[] | null>(null);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [interviewError, setInterviewError] = useState<string | null>(null);
  const [savedNote, setSavedNote] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const saveBusy = useRef(false);

  // The brief streams via the shared kit. Values are passed through `extra` at
  // call time so the body always reflects the current idea + answers.
  const brief = useAiTool({
    endpoint: "/api/refine-idea/brief",
    buildBody: (_input, extra) => ({
      idea: (extra?.idea as string) ?? "",
      answers: (extra?.answers as InterviewAnswer[]) ?? [],
    }),
  });

  function answerList(): InterviewAnswer[] {
    return (questions ?? []).map((q, i) => ({
      question: q.text,
      type: q.type,
      answer: (answers[i] ?? "").trim(),
    }));
  }

  async function runInterview() {
    const t = idea.trim();
    if (!t || loadingQuestions) return;
    setInterviewError(null);
    setLoadingQuestions(true);
    try {
      const res = await fetch("/api/refine-idea/interview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea: t }),
      });
      const data = (await res.json().catch(() => ({}))) as { questions?: InterviewQuestion[]; error?: string };
      if (!res.ok) throw new Error(data.error || "Couldn't start the interview");
      setQuestions(data.questions ?? []);
      setAnswers({});
      setPhase("questions");
    } catch (e) {
      setInterviewError(e instanceof Error ? e.message : "Couldn't start the interview");
    } finally {
      setLoadingQuestions(false);
    }
  }

  async function buildBrief(withAnswers: InterviewAnswer[]) {
    const t = idea.trim();
    if (!t) return;
    setSavedNote(false);
    setPhase("brief");
    await brief.run("", { idea: t, answers: withAnswers });
  }

  async function saveNote() {
    const snapshot = brief.output;
    if (!snapshot.trim() || savedNote || saveBusy.current) return;
    saveBusy.current = true;
    setSavingNote(true);
    try {
      const res = await fetch("/api/ideas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: deriveNoteTitle(snapshot, "Refined idea"), content: snapshot }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Couldn't save");
      setSavedNote(true);
      toast.success("Saved as a note", {
        action: { label: "Open", onClick: () => { window.location.href = "/tools/notes"; } },
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't save");
    } finally {
      saveBusy.current = false;
      setSavingNote(false);
    }
  }

  function startOver() {
    brief.reset();
    setIdea("");
    setQuestions(null);
    setAnswers({});
    setInterviewError(null);
    setSavedNote(false);
    setPhase("idea");
  }

  // ---- idea phase ----------------------------------------------------------
  if (phase === "idea") {
    return (
      <div>
        <VoiceTextarea
          rows={4}
          value={idea}
          placeholder="Describe your idea in a sentence or two — the rougher the better."
          onValueChange={setIdea}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && idea.trim() && !loadingQuestions) {
              e.preventDefault();
              runInterview();
            }
          }}
          disabled={loadingQuestions}
        />
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Button onClick={runInterview} disabled={!idea.trim() || loadingQuestions}>
            <MessagesSquare className="mr-1.5 h-4 w-4" />
            {loadingQuestions ? "Thinking of the right questions…" : "Interview me"}
          </Button>
          <Button
            variant="ghost"
            onClick={() => buildBrief([])}
            disabled={!idea.trim() || loadingQuestions}
            title="Skip the questions and go straight to a brief"
          >
            <Sparkles className="mr-1.5 h-4 w-4" /> Quick pass
          </Button>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          A product-manager interview asks the few questions that most change the idea, then writes an honest brief —
          assumptions, unknowns, where it could go wrong, and what to do next.
        </p>
        {interviewError && <ErrorAlert className="mt-4" title="Couldn't start" message={interviewError} />}
      </div>
    );
  }

  // ---- questions phase -----------------------------------------------------
  if (phase === "questions") {
    const qs = questions ?? [];
    return (
      <div>
        <button
          type="button"
          onClick={() => setPhase("idea")}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Edit the idea
        </button>
        <p className="mt-3 rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">{idea.trim()}</p>

        <h2 className="mt-5 text-lg font-medium">A few questions to sharpen it</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Answer what you can — skip anything you&apos;re not sure about. Blanks become open questions in the brief.
        </p>

        <div className="mt-4 space-y-3">
          {qs.map((q, i) => (
            <Card key={i}>
              <CardContent className="pt-4">
                <div className="flex items-start gap-2">
                  <Badge variant="outline" className="mt-0.5 shrink-0">
                    {AHA_TYPE_LABELS[q.type as AhaQuestionType] ?? q.type}
                  </Badge>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{q.text}</p>
                    {q.why && <p className="mt-0.5 text-xs text-muted-foreground">{q.why}</p>}
                  </div>
                </div>
                <Textarea
                  className="mt-3"
                  rows={2}
                  value={answers[i] ?? ""}
                  placeholder="Your answer (optional)…"
                  onChange={(e) => setAnswers((a) => ({ ...a, [i]: e.target.value }))}
                />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Button onClick={() => buildBrief(answerList())}>
            <Sparkles className="mr-1.5 h-4 w-4" /> Build the brief
          </Button>
          <Button variant="ghost" onClick={() => setPhase("idea")}>
            Back
          </Button>
        </div>
      </div>
    );
  }

  // ---- brief phase ---------------------------------------------------------
  return (
    <div>
      <p className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm">{idea.trim()}</p>

      <AiOutput output={brief.output} status={brief.status} label="Refined brief" />

      {brief.error && (
        <div className="mt-4">
          <ErrorAlert title="Couldn't build the brief" message={brief.error} />
          <Button className="mt-3" variant="outline" onClick={() => buildBrief(answerList())}>
            <RotateCcw className="mr-1.5 h-4 w-4" /> Try again
          </Button>
        </div>
      )}

      {brief.status === "done" && brief.output && (
        <>
          <div className="mt-3">
            <RefineRow
              onRefine={(instruction) => {
                setSavedNote(false);
                brief.refine(instruction);
              }}
              busy={brief.isRunning}
            />
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">Keep it:</span>
            <Button
              variant="outline"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={saveNote}
              disabled={savingNote || savedNote || !brief.output}
            >
              {savedNote ? <Check className="mr-1 h-3.5 w-3.5" /> : <StickyNote className="mr-1 h-3.5 w-3.5" />}
              {savedNote ? "Saved" : "Save as note"}
            </Button>
            <ExtractTasksButton text={brief.output} label="Turn into tasks" />
          </div>
        </>
      )}

      <div className="mt-5 flex flex-wrap items-center gap-2">
        {questions && questions.length > 0 && (
          <Button variant="ghost" size="sm" onClick={() => setPhase("questions")} disabled={brief.isRunning}>
            <ArrowLeft className="mr-1.5 h-4 w-4" /> Adjust answers
          </Button>
        )}
        <Button variant="ghost" size="sm" onClick={startOver} disabled={brief.isRunning}>
          <RotateCcw className="mr-1.5 h-4 w-4" /> Start over
        </Button>
      </div>
    </div>
  );
}
