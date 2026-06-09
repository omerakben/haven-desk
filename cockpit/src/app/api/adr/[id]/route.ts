import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db";
import { deriveAdrTitle, lintAdr, stripOuterFences } from "@/lib/adrLint";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STATUSES = ["proposed", "accepted", "rejected", "deprecated", "superseded"];

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as { status?: string; markdown?: string };

  const data: Record<string, unknown> = {};
  if (typeof body.status === "string" && STATUSES.includes(body.status)) data.status = body.status;
  if (typeof body.markdown === "string" && body.markdown.trim()) {
    const markdown = stripOuterFences(body.markdown);
    const lint = lintAdr(markdown);
    data.markdown = markdown;
    data.title = deriveAdrTitle(markdown);
    data.lintOk = lint.ok;
    data.errors = lint.summary.errors;
    data.warnings = lint.summary.warnings;
  }
  if (Object.keys(data).length === 0) {
    return Response.json({ error: "Nothing to update." }, { status: 400 });
  }

  try {
    const adr = await prisma.adr.update({ where: { id }, data });
    return Response.json({ adr });
  } catch {
    return Response.json({ error: "ADR not found." }, { status: 404 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await prisma.adr.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch (e) {
    // Already gone = idempotent success; anything else is a real failure.
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
      return Response.json({ ok: true });
    }
    return Response.json({ error: "Couldn't delete the ADR." }, { status: 500 });
  }
}
