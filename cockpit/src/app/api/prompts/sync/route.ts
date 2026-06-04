import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const OWUI_BASE = process.env.OWUI_BASE_URL || "http://localhost:3001";

/**
 * One-way push of saved prompts into Open WebUI's prompt library. Needs an
 * Open WebUI API key (Settings → Open WebUI sync). Duplicates (already-synced
 * commands) are counted as skipped.
 */
export async function POST() {
  const s = await prisma.settings.findUnique({ where: { id: "singleton" } }).catch(() => null);
  const key = s?.owuiApiKey;
  if (!key) {
    return Response.json(
      { error: "Set your Open WebUI API key in Settings to sync." },
      { status: 400 }
    );
  }

  const prompts = await prisma.prompt.findMany({ orderBy: { createdAt: "desc" }, take: 200 });
  let synced = 0;
  let skipped = 0;

  for (const p of prompts) {
    const content = p.optimized || p.original;
    const command = `/sk-${p.id.slice(-8)}`;
    try {
      const res = await fetch(`${OWUI_BASE}/api/v1/prompts/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify({ command, title: p.title.slice(0, 100), content }),
      });
      if (res.ok) synced++;
      else skipped++;
    } catch {
      skipped++;
    }
  }

  return Response.json({ ok: true, synced, skipped, total: prompts.length });
}
