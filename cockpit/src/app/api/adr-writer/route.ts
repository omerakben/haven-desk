import { assertOllamaReady } from "@/lib/health";
import { getActiveProjectId } from "@/lib/project";
import { streamTextResponse } from "@/lib/ai/streamRoute";
import type { ChatMessage } from "@/lib/ollama";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The structure below is exactly what lib/adrLint.ts gates on, so a draft that
// follows it passes; one that drifts gets actionable ERRORs, not vibes.
const SYSTEM = `You write Architecture Decision Records (ADRs) in MADR markdown format.
Turn the user's decision note into a complete ADR with EXACTLY this structure:

# <short title naming the decision>

## Context and Problem Statement
<2-5 sentences: the situation and the problem being decided>

## Decision Drivers
* <force or concern that shaped the decision>
* <another driver>

## Considered Options
* <option 1>
* <option 2>
(list every real alternative — at least two, including the chosen one)

## Decision Outcome
Chosen option: "<option exactly as it appears in Considered Options>", because <justification>.

### Consequences
* Good, because <benefit>
* Bad, because <honest cost or risk — at least one>

## Pros and Cons of the Options
### <option 1>
* Good, because <...>
* Bad, because <...>
(repeat for each option)

Rules: keep the user's vocabulary and facts; do not invent technical details they didn't imply;
if the note doesn't say which option was chosen, pick the one the note leans toward and make the
justification say so. Output ONLY the markdown document — no preamble, no code fences.`;

export async function POST(req: Request) {
  const notReady = await assertOllamaReady();
  if (notReady) return notReady;

  const { note } = (await req.json().catch(() => ({}))) as { note?: string };
  if (!note || typeof note !== "string" || !note.trim()) {
    return Response.json({ error: "Describe the decision to record." }, { status: 400 });
  }

  const projectId = await getActiveProjectId();
  const messages: ChatMessage[] = [
    { role: "system", content: SYSTEM },
    { role: "user", content: note.trim() },
  ];

  return streamTextResponse({
    messages,
    injectMemory: true,
    memoryProjectId: projectId,
    memoryQuery: note.trim(),
  });
}
