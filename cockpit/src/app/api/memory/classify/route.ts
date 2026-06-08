import { assertOllamaReady } from "@/lib/health";
import { getActiveProjectId } from "@/lib/project";
import { classifyUncategorized } from "@/lib/memoryLoop";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Backfill categories on uncategorized facts for the active project + global. */
export async function POST() {
  const notReady = await assertOllamaReady();
  if (notReady) return notReady;
  const projectId = await getActiveProjectId();
  try {
    const { classified } = await classifyUncategorized(projectId);
    return Response.json({ classified });
  } catch (e) {
    return Response.json({ error: e instanceof Error ? e.message : "Classify failed." }, { status: 500 });
  }
}
