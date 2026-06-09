import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function ActivityPage() {
  const logs = await prisma.activityLog
    .findMany({ orderBy: { createdAt: "desc" }, take: 100 })
    .catch(() => []);

  const projectIds = [...new Set(logs.map((l) => l.projectId).filter(Boolean))] as string[];
  const projects = projectIds.length
    ? await prisma.project
        .findMany({ where: { id: { in: projectIds } }, select: { id: true, name: true } })
        .catch(() => [])
    : [];
  const pname = new Map(projects.map((p) => [p.id, p.name]));

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold tracking-tight">Activity</h1>
      <p className="mt-1 text-muted-foreground">
        A timeline of what happened in your cockpit — captures, QA runs, quick-adds.
      </p>

      {logs.length === 0 ? (
        <p className="mt-6 text-sm text-muted-foreground">Nothing logged yet.</p>
      ) : (
        <ul className="mt-6 space-y-1.5">
          {logs.map((l) => (
            <li key={l.id} className="flex items-center gap-3 text-sm">
              <span className="w-36 shrink-0 text-xs tabular-nums text-muted-foreground">
                {l.createdAt.toLocaleString()}
              </span>
              <Badge variant="secondary" className="text-[10px]">
                {l.entity}
              </Badge>
              <span className="text-xs text-muted-foreground">{l.action}</span>
              <span className="flex-1 truncate">{l.summary}</span>
              {l.projectId && pname.get(l.projectId) && (
                <Badge variant="outline" className="text-[10px]">
                  {pname.get(l.projectId)}
                </Badge>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
