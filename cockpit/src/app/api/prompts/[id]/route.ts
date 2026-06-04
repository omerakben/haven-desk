import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as {
    title?: string;
    tags?: string;
    favorite?: boolean;
    optimized?: string;
  };

  const data: Record<string, unknown> = {};
  if (typeof body.title === "string") data.title = body.title.trim();
  if (typeof body.tags === "string") data.tags = body.tags.trim() || null;
  if (typeof body.favorite === "boolean") data.favorite = body.favorite;
  if (typeof body.optimized === "string") data.optimized = body.optimized;

  if (Object.keys(data).length === 0) {
    return Response.json({ error: "Nothing to update." }, { status: 400 });
  }

  try {
    const prompt = await prisma.prompt.update({ where: { id }, data });
    return Response.json({ ok: true, prompt });
  } catch {
    return Response.json({ error: "Prompt not found." }, { status: 404 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    await prisma.prompt.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: "Prompt not found." }, { status: 404 });
  }
}
