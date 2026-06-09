import { assertOllamaReady } from "@/lib/health";
import { chatJson } from "@/lib/ollama";
import { getEffectiveConfig } from "@/lib/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Pull real work IN: turn a raw ticket (Jira/GitHub issue, requirement, note)
// into a clean, QA-ready user story the pipeline can draft from. Suggest-then-
// confirm — this only returns text; the user reviews it before running.
const SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    story: {
      type: "string",
      description: "A single 'As a <role>, I want <goal>, so that <benefit>' user story",
    },
    acceptanceCriteria: { type: "array", items: { type: "string" } },
  },
  required: ["title", "story"],
};

const SYSTEM =
  "Convert a raw ticket (Jira/GitHub issue, requirement, or note) into a clean QA-ready user story. " +
  "Extract a short title, ONE 'As a <role>, I want <goal>, so that <benefit>' story, and a list of acceptance criteria. " +
  "Preserve the domain terms exactly; do not invent requirements that aren't in the source.";

export async function POST(req: Request) {
  const notReady = await assertOllamaReady();
  if (notReady) return notReady;

  const { text } = (await req.json().catch(() => ({}))) as { text?: string };
  if (!text || !text.trim()) return Response.json({ error: "Paste a ticket or requirement." }, { status: 400 });

  const cfg = await getEffectiveConfig();
  try {
    const out = await chatJson<{ title: string; story: string; acceptanceCriteria?: string[] }>(
      [{ role: "system", content: SYSTEM }, { role: "user", content: text.trim() }],
      SCHEMA,
      { model: cfg.model, baseUrl: cfg.baseUrl, temperature: 0.2 }
    );
    const ac = (out.acceptanceCriteria ?? []).map((a) => a.trim()).filter(Boolean);
    const story = ac.length ? `${out.story}\n\nAcceptance criteria:\n${ac.map((a) => `- ${a}`).join("\n")}` : out.story;
    return Response.json({ title: out.title, story });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Couldn't parse the ticket." }, { status: 500 });
  }
}
