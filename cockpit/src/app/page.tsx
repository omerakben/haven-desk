import Link from "next/link";

import { prisma } from "@/lib/db";
import { HealthBanner } from "@/components/HealthBanner";
import { DailyBrief } from "@/components/DailyBrief";
import { DashboardToolGrid } from "@/components/DashboardToolGrid";
import { PersonaPicker } from "@/components/PersonaPicker";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function greeting(name: string | null): string {
  const h = new Date().getHours();
  const part = h < 5 ? "Working late" : h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  return name ? `${part}, ${name}` : part;
}

export default async function Dashboard() {
  let recent: { id: string; title: string }[] = [];
  let userName: string | null = null;
  let persona: string | null = null;
  let firstRun = false;
  try {
    const [recentRows, settings, projects, prompts, tasks, facts] = await Promise.all([
      prisma.prompt.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, title: true },
      }),
      prisma.settings.findUnique({ where: { id: "singleton" }, select: { userName: true, persona: true } }),
      prisma.project.count(),
      prisma.prompt.count(),
      prisma.task.count(),
      prisma.memoryFact.count(),
    ]);
    recent = recentRows;
    userName = settings?.userName ?? null;
    persona = settings?.persona ?? null;
    firstRun = projects + prompts + tasks + facts === 0;
  } catch {
    // DB not migrated yet — treat as a first run.
    firstRun = true;
  }

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-3xl font-semibold tracking-tight">{greeting(userName)}</h1>
      <p className="mt-1.5 text-[15px] text-muted-foreground">Your local AI cockpit. Everything runs on this machine.</p>

      <div className="mt-6">
        <HealthBanner />
      </div>

      {firstRun && !persona && <PersonaPicker />}

      <div className="mt-6">
        <DailyBrief />
      </div>

      <h2 className="mt-8 text-xs font-medium uppercase tracking-wide text-muted-foreground">Tools</h2>
      <DashboardToolGrid />

      {recent.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Recent prompts</h2>
          <ul className="mt-2 space-y-1">
            {recent.map((p) => (
              <li key={p.id} className="truncate text-sm">
                <Link href="/tools/prompt-library" className="text-foreground/80 hover:text-foreground hover:underline">
                  {p.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
