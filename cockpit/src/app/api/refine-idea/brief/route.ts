import { assertOllamaReady } from "@/lib/health";
import { getActiveProjectId } from "@/lib/project";
import { streamTextResponse } from "@/lib/ai/streamRoute";
import { compileSpec } from "@/lib/prompts/spec";
import { AHA_BRIEF_SPEC } from "@/lib/prompts/aha";
import { buildBriefInput, type InterviewAnswer } from "@/lib/aha";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// AHA Align + Critique (+ a light Optimize) phases: idea + interview answers ->
// a streamed refined brief. Memory-injected, anchored on the idea — this is a
// streaming drafting tool, where the user's own facts sharpen the brief (unlike
// the structured interview route, where a fact block would just slow it down).
export async function POST(req: Request) {
  const { idea, answers } = (await req.json().catch(() => ({}))) as {
    idea?: string;
    answers?: InterviewAnswer[];
  };
  const t = typeof idea === "string" ? idea.trim() : "";
  if (!t) return Response.json({ error: "Type an idea first." }, { status: 400 });
  if (t.length > 8_000) {
    return Response.json({ error: "That idea is a bit long — trim it to the core." }, { status: 413 });
  }

  // Normalize the answers defensively (client-supplied): keep only string fields,
  // cap the count so a crafted request can't balloon the prompt.
  const clean: InterviewAnswer[] = Array.isArray(answers)
    ? answers
        .filter((a): a is InterviewAnswer => !!a && typeof a === "object")
        .map((a) => ({
          question: typeof a.question === "string" ? a.question.slice(0, 300) : "",
          type: typeof a.type === "string" ? a.type.slice(0, 20) : "",
          answer: typeof a.answer === "string" ? a.answer.slice(0, 1_000) : "",
        }))
        .slice(0, 8)
    : [];

  const notReady = await assertOllamaReady();
  if (notReady) return notReady;

  const projectId = await getActiveProjectId();
  const messages = compileSpec(AHA_BRIEF_SPEC, buildBriefInput(t, clean));
  return streamTextResponse({
    messages,
    temperature: AHA_BRIEF_SPEC.temperature,
    injectMemory: true,
    memoryProjectId: projectId,
    memoryQuery: t,
  });
}
