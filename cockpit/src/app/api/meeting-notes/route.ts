import { assertOllamaReady } from "@/lib/health";
import { chatJson } from "@/lib/ollama";
import { getEffectiveConfig } from "@/lib/config";
import { getActiveProjectId } from "@/lib/project";
import { prisma } from "@/lib/db";
import { parseDueDateInput } from "@/lib/dates";
import { logActivity } from "@/lib/activity";
import { gateMeetingTasks, type DraftTask } from "@/lib/meetingNotes";

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
    const clean = create.filter((t) => t && typeof t.title === "string" && t.title.trim()).slice(0, 50);
    if (clean.length === 0) {
      return Response.json({ error: "No tasks selected to add." }, { status: 400 });
    }
    const max = await prisma.task.aggregate({ where: { status: "todo" }, _max: { order: true } });
    let order = (max._max.order ?? 0) + 1;
    const creates = clean.map((t) => {
      const dueDate = typeof t.dueDate === "string" && t.dueDate ? parseDueDateInput(t.dueDate) : null;
      return prisma.task.create({
        data: {
          title: t.title.trim().slice(0, 200),
          status: "todo",
          priority: "medium",
          dueDate: dueDate ?? null,
          notes: typeof t.owner === "string" && t.owner.trim() ? `Owner: ${t.owner.trim().slice(0, 120)}` : null,
          order: order++,
          projectId,
        },
      });
    });
    const created = await prisma.$transaction(creates);
    await logActivity({
      entity: "task",
      action: "created",
      summary: `Added ${created.length} tasks from meeting notes`,
      projectId,
    });
    return Response.json({ created: created.length });
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
