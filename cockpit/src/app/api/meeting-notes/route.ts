import { assertOllamaReady } from "@/lib/health";
import { chatJson } from "@/lib/ollama";
import { getEffectiveConfig } from "@/lib/config";
import { getActiveProjectId } from "@/lib/project";
import { gateMeetingTasks, type DraftTask } from "@/lib/meetingNotes";
import { createDraftTasks } from "@/lib/tasksFromText";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// chatJson schema: a loose list of action items. The deterministic gate
// (gateMeetingTasks) cleans and dedupes it; the local 4B model is not trusted to
// produce final task records.
const SCHEMA = {
  type: "object",
  properties: {
    tasks: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          owner: { type: "string" },
          due: { type: "string" },
        },
        required: ["title"],
      },
    },
  },
  required: ["tasks"],
};

const SYSTEM =
  "Read these meeting notes and extract the action items as tasks. For each: a short imperative title, " +
  "the owner if a person is clearly named, and a due date phrase if one is stated (for example 'tomorrow', " +
  "'friday', 'in 3 days'). Only include real action items the notes actually contain. Do not invent tasks, " +
  "owners, or dates.";

export async function POST(req: Request) {
  const { notes, create } = (await req.json().catch(() => ({}))) as {
    notes?: string;
    /** Save-after-review: the reviewed task list. Creates real rows, no model call. */
    create?: DraftTask[];
  };

  const projectId = await getActiveProjectId();

  // Save path: create Task rows from the REVIEWED list. The model never runs here.
  if (Array.isArray(create)) {
    const created = await createDraftTasks(create, projectId, "meeting notes");
    if (created === 0) return Response.json({ error: "No tasks selected to add." }, { status: 400 });
    return Response.json({ created });
  }

  // Extract path: model draft + deterministic gate.
  if (!notes || !notes.trim()) {
    return Response.json({ error: "Paste your meeting notes." }, { status: 400 });
  }

  const notReady = await assertOllamaReady();
  if (notReady) return notReady;

  const cfg = await getEffectiveConfig();
  let raw: unknown;
  try {
    raw = await chatJson(
      [
        { role: "system", content: SYSTEM },
        { role: "user", content: notes.trim() },
      ],
      SCHEMA,
      { model: cfg.model, baseUrl: cfg.baseUrl, temperature: 0 }
    );
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Couldn't read the notes." }, { status: 500 });
  }

  return Response.json(gateMeetingTasks(raw));
}
