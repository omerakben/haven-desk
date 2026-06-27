import Link from "next/link";

import { prisma } from "@/lib/db";
import { HealthBanner } from "@/components/HealthBanner";
import { DailyBrief } from "@/components/DailyBrief";
import { DashboardToolGrid } from "@/components/DashboardToolGrid";
import { PersonaPicker } from "@/components/PersonaPicker";
import { DashboardQuickActions } from "@/components/DashboardQuickActions";
import { FeaturedDemo } from "@/components/FeaturedDemo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function greeting(name: string | null): string {
  const h = new Date().getHours();
  const part = h < 5 ? "Working late" : h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
  return name ? `${part}, ${name}` : part;
}

export default async function Dashboard() {
  let recent: { id: string; title: string }[] = [];
  let recentNotes: { id: string; title: string }[] = [];
  let userName: string | null = null;
  let persona: string | null = null;
  let firstRun = false;
  try {
    const [recentRows, noteRows, settings, projects, prompts, tasks, facts] = await Promise.all([
      prisma.prompt.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, title: true },
      }),
      prisma.idea.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, title: true, topic: true },
      }),
      prisma.settings.findUnique({ where: { id: "singleton" }, select: { userName: true, persona: true } }),
      prisma.project.count(),
      prisma.prompt.count(),
      prisma.task.count(),
      prisma.memoryFact.count(),
    ]);
    recent = recentRows;
    recentNotes = noteRows.map((n) => ({ id: n.id, title: n.title || n.topic || "Note" }));
    userName = settings?.userName ?? null;
    persona = settings?.persona ?? null;
    firstRun = projects + prompts + tasks + facts === 0;
  } catch {
    // DB not migrated yet — treat as a first run.
    firstRun = true;
  }

  const subtitle = firstRun
    ? "Welcome — this is your private AI workspace. Everything runs on this machine, nothing leaves it."
    : "Pick a quick action below, or pick up where you left off. Everything stays on this machine.";

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-3xl font-semibold tracking-tight">{greeting(userName)}</h1>
      <p className="mt-1.5 text-[15px] text-muted-foreground">{subtitle}</p>

      <div className="mt-6">
        <HealthBanner />
      </div>

      {firstRun && (
        <div className="mt-6">
          <FeaturedDemo />
        </div>
      )}

      {firstRun && !persona && <PersonaPicker />}

      {!(firstRun && !persona) && (
        <div className="mt-6">
          <DashboardQuickActions persona={persona} />
        </div>
      )}

      <div className="mt-6">
        <DailyBrief />
      </div>

      <h2 className="mt-8 text-xs font-medium uppercase tracking-wide text-muted-foreground">Tools</h2>
      <DashboardToolGrid />

      <div className="grid gap-8 sm:grid-cols-2">
        {recentNotes.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Recent notes</h2>
            <ul className="mt-2 space-y-1">
              {recentNotes.map((n) => (
                <li key={n.id} className="truncate text-sm">
                  <Link
                    href={`/tools/notes?ideaId=${n.id}`}
                    className="text-foreground/80 hover:text-foreground hover:underline"
                  >
                    {n.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

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
    </div>
  );
}
