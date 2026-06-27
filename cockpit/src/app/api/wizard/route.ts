import { assertOllamaReady } from "@/lib/health";
import { streamTextResponse } from "@/lib/ai/streamRoute";
import { buildWizardSystemPrompt } from "@/lib/wizard";
import type { ChatMessage } from "@/lib/ollama";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_TURNS = 8;

// The Haven Desk guide: a streaming, manual-grounded chat on the light model.
// No memory injection — the wizard is about the app, not the user's facts, and a
// big fact block on the 4B is slow (the documented perf lesson). History lives
// client-side and is POSTed each turn; capped here to bound the small context.
export async function POST(req: Request) {
  const notReady = await assertOllamaReady();
  if (notReady) return notReady;

  const { messages } = (await req.json().catch(() => ({}))) as {
    messages?: { role?: string; content?: string }[];
  };
  const history: ChatMessage[] = (Array.isArray(messages) ? messages : [])
    .filter(
      (m) =>
        m &&
        (m.role === "user" || m.role === "assistant") &&
        typeof m.content === "string" &&
        m.content.trim().length > 0,
    )
    .slice(-MAX_TURNS)
    .map((m) => ({ role: m.role as "user" | "assistant", content: m.content!.trim().slice(0, 4000) }));

  if (history.length === 0 || history[history.length - 1].role !== "user") {
    return Response.json({ error: "Ask the guide a question." }, { status: 400 });
  }

  return streamTextResponse({
    messages: [{ role: "system", content: buildWizardSystemPrompt() }, ...history],
    temperature: 0.25,
    injectMemory: false,
  });
}
