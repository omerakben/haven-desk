import { assertOllamaReady } from "@/lib/health";
import { streamTextResponse } from "@/lib/ai/streamRoute";
import { getQuickAction, missingInputs, buildMessages, buildRefineMessages } from "@/lib/quickActions";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Run a pre-built quick action. The action id + its written-for-you prompt come
// from the shared lib, so the client can only pick a known action and fill its
// inputs; there is no free-form prompt to validate. Streams the draft for review.
// A `refine` payload re-runs the model over a prior result with a plain-language
// tweak (Shorter / Friendlier / …), so iterating needs no re-typing.
export async function POST(req: Request) {
  const { actionId, inputs, refine } = (await req.json().catch(() => ({}))) as {
    actionId?: string;
    inputs?: Record<string, string>;
    refine?: { text?: string; instruction?: string };
  };

  if (refine && typeof refine === "object") {
    const text = typeof refine.text === "string" ? refine.text.trim() : "";
    const instruction = typeof refine.instruction === "string" ? refine.instruction.trim() : "";
    if (!text || !instruction) {
      return Response.json({ error: "Nothing to refine." }, { status: 400 });
    }
    const notReady = await assertOllamaReady();
    if (notReady) return notReady;
    return streamTextResponse({ messages: buildRefineMessages(text, instruction) });
  }

  const action = typeof actionId === "string" ? getQuickAction(actionId) : undefined;
  if (!action) return Response.json({ error: "Unknown action." }, { status: 400 });

  const vals = inputs && typeof inputs === "object" ? inputs : {};
  const missing = missingInputs(action, vals);
  if (missing.length > 0) {
    return Response.json({ error: `Please fill in: ${missing.join(", ")}.` }, { status: 400 });
  }

  const notReady = await assertOllamaReady();
  if (notReady) return notReady;

  return streamTextResponse({ messages: buildMessages(action, vals) });
}
