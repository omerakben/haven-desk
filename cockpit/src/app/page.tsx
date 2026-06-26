import Link from "next/link";

import { prisma } from "@/lib/db";
import { HealthBanner } from "@/components/HealthBanner";
import { DailyBrief } from "@/components/DailyBrief";
import { DashboardToolGrid } from "@/components/DashboardToolGrid";
import { Card, CardContent } from "@/components/ui/card";

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
  let firstRun = false;
  try {
    const [recentRows, settings, projects, prompts, tasks, facts] = await Promise.all([
      prisma.prompt.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, title: true },
      }),
      prisma.settings.findUnique({ where: { id: "singleton" }, select: { userName: true } }),
      prisma.project.count(),
      prisma.prompt.count(),
      prisma.task.count(),
      prisma.memoryFact.count(),
    ]);
    recent = recentRows;
    userName = settings?.userName ?? null;
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

      {firstRun && (
        <Card className="mt-6 border-dashed">
          <CardContent className="p-5">
            <h2 className="font-semibold">Welcome to Haven Desk</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Private AI for the work of daily life. Three things to know:
            </p>
            <ol className="mt-3 list-inside list-decimal space-y-2 text-sm text-muted-foreground">
              <li>
                <span className="font-medium text-foreground">Everything stays on this machine.</span>{" "}
                The AI, your notes, and your files never leave your computer. If the engine ever looks
                off, the banner above tells you the next step in plain language.
              </li>
              <li>
                <span className="font-medium text-foreground">Start with a pack.</span> A pack sets up
                a ready-made workflow in one click. Open{" "}
                <Link href="/tools/packs" className="underline underline-offset-2">
                  Packs
                </Link>{" "}
                and install one (Small Business Ops is a good first pick) to get templates and tasks
                ready to use.
              </li>
              <li>
                <span className="font-medium text-foreground">Capture anything fast.</span> Press ⌘K
                (Ctrl K on Windows) to search, ask a quick question, or drop a note from anywhere, or
                paste into{" "}
                <Link href="/tools/inbox" className="underline underline-offset-2">
                  Smart Inbox
                </Link>
                .
              </li>
            </ol>
            <p className="mt-3 text-sm text-muted-foreground">
              Make it yours in{" "}
              <Link href="/settings" className="underline underline-offset-2">
                Settings
              </Link>
              : add your name, pick the model, choose a theme.
            </p>
          </CardContent>
        </Card>
      )}

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
