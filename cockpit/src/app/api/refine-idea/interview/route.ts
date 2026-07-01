import { assertOllamaReady } from "@/lib/health";
import { getEffectiveConfig } from "@/lib/config";
import { chatJson } from "@/lib/ollama";
import { AHA_INTERVIEW_SCHEMA, AHA_INTERVIEW_SYSTEM } from "@/lib/prompts/aha";
import { gateInterviewQuestions } from "@/lib/aha";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// AHA "Ask" phase: a rough idea -> 3–5 typed leverage questions. Structured
// (chatJson, schema-locked) + the deterministic gateInterviewQuestions gate. No
// memory injection — a fact block on a structured 4B call is the documented perf
// trap, and the interview is about the idea, not the user's saved facts.
export async function POST(req: Request) {
  const { idea } = (await req.json().catch(() => ({}))) as { idea?: string };
  const t = typeof idea === "string" ? idea.trim() : "";
  if (!t) return Response.json({ error: "Type an idea first." }, { status: 400 });
  if (t.length > 8_000) {
    return Response.json({ error: "That idea is a bit long — trim it to the core." }, { status: 413 });
  }

  const notReady = await assertOllamaReady();
  if (notReady) return notReady;

  const cfg = await getEffectiveConfig();
  try {
    const raw = await chatJson(
      [
        { role: "system", content: AHA_INTERVIEW_SYSTEM },
        { role: "user", content: t },
      ],
      AHA_INTERVIEW_SCHEMA,
      { model: cfg.model, baseUrl: cfg.baseUrl, temperature: 0.3 }
    );
    const { questions } = gateInterviewQuestions(raw);
    if (questions.length === 0) {
      return Response.json(
        { error: "Couldn't come up with useful questions — try rephrasing the idea." },
        { status: 422 }
      );
    }
    return Response.json({ questions });
  } catch (e) {
    return Response.json(
      { error: e instanceof Error ? e.message : "Couldn't run the interview." },
      { status: 500 }
    );
  }
}
