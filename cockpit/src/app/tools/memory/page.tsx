import { prisma } from "@/lib/db";
import { MemoryManager } from "@/components/memory/MemoryManager";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function MemoryPage() {
  const [rows, projects] = await Promise.all([
    prisma.memoryFact
      .findMany({
        where: { status: { not: "dismissed" } },
        orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
        include: { project: { select: { name: true } } },
      })
      .catch(() => []),
    prisma.project
      .findMany({ where: { archived: false }, orderBy: { name: "asc" }, select: { id: true, name: true } })
      .catch(() => []),
  ]);

  const facts = rows.map((f) => ({
    id: f.id,
    key: f.key,
    value: f.value,
    source: f.source,
    status: f.status,
    pinned: f.pinned,
    projectId: f.projectId,
    projectName: f.project?.name ?? null,
  }));

  return <MemoryManager facts={facts} projects={projects} />;
}
