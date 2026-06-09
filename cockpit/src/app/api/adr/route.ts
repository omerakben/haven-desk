import { prisma } from "@/lib/db";
import { getActiveProjectId } from "@/lib/project";
import { logActivity } from "@/lib/activity";
import { deriveAdrTitle, lintAdr, stripOuterFences } from "@/lib/adrLint";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const adrs = await prisma.adr.findMany({ orderBy: { updatedAt: "desc" } }).catch(() => []);
  return Response.json({ adrs });
}

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { note?: string; markdown?: string };
  const markdown = typeof body.markdown === "string" ? stripOuterFences(body.markdown) : "";
  if (!markdown.trim()) {
    return Response.json({ error: "Nothing to save — draft an ADR first." }, { status: 400 });
  }

  const projectId = await getActiveProjectId();
  const lint = lintAdr(markdown);
  const adr = await prisma.adr.create({
    data: {
      title: deriveAdrTitle(markdown),
      note: typeof body.note === "string" && body.note.trim() ? body.note.trim() : null,
      markdown,
      lintOk: lint.ok,
      errors: lint.summary.errors,
      warnings: lint.summary.warnings,
      projectId,
    },
  });
  await logActivity({ entity: "adr", action: "recorded", summary: adr.title, projectId });
  return Response.json({ adr, lint });
}
