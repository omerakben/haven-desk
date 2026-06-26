import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/activity";
import { EXAMPLE_PACKS } from "@/lib/packs/examples";
import { validatePackManifest } from "@/lib/packs/manifest";
import { buildInstallPlan } from "@/lib/packs/install";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Install a declarative pack into the workspace. The pack content is keyed by
// globally-unique slug / sourceKey, so install is global (projectId null) in v1:
// the content is available across projects, and re-installing refreshes it in
// place without duplicating. Per-project pack scoping would need composite
// uniques and is a documented future enhancement. The pack is validated first
// (the deterministic gate) so a malformed pack never touches the DB. No model runs.
export async function POST(req: Request) {
  const { slug } = (await req.json().catch(() => ({}))) as { slug?: string };
  if (!slug || typeof slug !== "string") {
    return Response.json({ error: "Missing 'slug'." }, { status: 400 });
  }

  const pack = EXAMPLE_PACKS.find((p) => p.slug === slug);
  if (!pack) {
    return Response.json({ error: `Unknown pack '${slug}'.` }, { status: 404 });
  }

  const validation = validatePackManifest(pack);
  if (!validation.ok) {
    return Response.json({ error: "Pack failed validation.", issues: validation.issues }, { status: 400 });
  }

  const plan = buildInstallPlan(pack, null);

  try {
    await prisma.$transaction([
      ...plan.templates.map((t) =>
        prisma.template.upsert({ where: { slug: t.slug }, create: t.create, update: t.update }),
      ),
      ...plan.facts.map((f) =>
        prisma.memoryFact.upsert({ where: { sourceKey: f.sourceKey }, create: f.create, update: f.update }),
      ),
      ...plan.tasks.map((k) =>
        prisma.task.upsert({ where: { sourceKey: k.sourceKey }, create: k.create, update: k.update }),
      ),
    ]);
  } catch (e) {
    console.error("Pack install failed:", e);
    return Response.json({ error: "Install failed." }, { status: 500 });
  }

  await logActivity({
    entity: "project",
    action: "installed pack",
    summary: `Installed "${pack.name}": ${plan.counts.templates} templates, ${plan.counts.facts} facts, ${plan.counts.tasks} tasks`,
  });

  return Response.json({ ok: true, installed: plan.counts });
}
