// Server task logic shared by Meeting Notes and "save a result as tasks".
// extractTasksFromText runs a neutral-prompt chatJson and applies the
// deterministic gateMeetingTasks gate; createDraftTasks does the transactional
// Task create + a parameterized activity log. Kept out of lib/meetingNotes.ts so
// that pure module (whose DraftTask type is import-type'd by client components)
// never pulls prisma/chatJson into a client bundle.

import { chatJson } from "@/lib/ollama";
import { prisma } from "@/lib/db";
import { parseDueDateInput } from "@/lib/dates";
import { logActivity } from "@/lib/activity";
import { gateMeetingTasks, type DraftTask, type GateResult } from "@/lib/meetingNotes";

const TASK_SCHEMA = {
  type: "object",
  properties: {
    tasks: {
      type: "array",
      items: {
        type: "object",
        properties: { title: { type: "string" }, owner: { type: "string" }, due: { type: "string" } },
        required: ["title"],
      },
    },
  },
  required: ["tasks"],
} as const;

// Neutral (not "meeting notes"): the result may be a grouped plan, so tell the
// model to ignore section headers and only pull real action items.
const SYSTEM =
  "Read this text and list any action items as tasks. Ignore section headers and grouping. " +
  "For each task: a short imperative title; an owner only if a person is clearly named; a due date " +
  "phrase only if one is stated (for example 'tomorrow', 'friday', 'in 3 days'). Only include real " +
  "to-dos the text actually contains. Do not invent tasks, owners, or dates.";

export async function extractTasksFromText(
  text: string,
  cfg: { model: string; baseUrl: string }
): Promise<GateResult> {
  const raw = await chatJson(
    [
      { role: "system", content: SYSTEM },
      { role: "user", content: text.trim() },
    ],
    TASK_SCHEMA,
    { model: cfg.model, baseUrl: cfg.baseUrl, temperature: 0 }
  );
  return gateMeetingTasks(raw);
}

// Transactional Task create from a reviewed list (no model). source goes into the
// activity summary ("a quick action" / "meeting notes").
export async function createDraftTasks(
  drafts: DraftTask[],
  projectId: string | null,
  source: string
): Promise<number> {
  const clean = drafts.filter((t) => t && typeof t.title === "string" && t.title.trim()).slice(0, 50);
  if (clean.length === 0) return 0;
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
  await logActivity({ entity: "task", action: "created", summary: `Added ${created.length} tasks from ${source}`, projectId });
  return created.length;
}
