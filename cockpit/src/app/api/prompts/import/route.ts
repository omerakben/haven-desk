import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ImportedPrompt = {
  title?: unknown;
  original?: unknown;
  optimized?: unknown;
  tags?: unknown;
  favorite?: unknown;
};

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as
    | ImportedPrompt[]
    | { prompts?: ImportedPrompt[] }
    | null;
  const list = Array.isArray(body) ? body : Array.isArray(body?.prompts) ? body.prompts : null;
  if (!list) {
    return Response.json(
      { error: "Expected a JSON array of prompts, or { prompts: [...] }." },
      { status: 400 }
    );
  }

  let imported = 0;
  for (const p of list) {
    if (!p || typeof p.title !== "string" || typeof p.original !== "string") continue;
    await prisma.prompt.create({
      data: {
        title: p.title.slice(0, 200),
        original: p.original,
        optimized: typeof p.optimized === "string" ? p.optimized : null,
        tags: typeof p.tags === "string" ? p.tags : null,
        favorite: Boolean(p.favorite),
        source: "import",
      },
    });
    imported++;
  }

  return Response.json({ ok: true, imported });
}
