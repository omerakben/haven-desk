import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const prompts = await prisma.prompt.findMany({ orderBy: { createdAt: "desc" } });
  const payload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    prompts: prompts.map((p) => ({
      title: p.title,
      original: p.original,
      optimized: p.optimized,
      tags: p.tags,
      favorite: p.favorite,
      source: p.source,
    })),
  };
  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": 'attachment; filename="swiss-knife-prompts.json"',
    },
  });
}
