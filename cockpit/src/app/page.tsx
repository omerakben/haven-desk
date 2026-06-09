import Link from "next/link";

import { prisma } from "@/lib/db";
import { HealthBanner } from "@/components/HealthBanner";
import { DailyBrief } from "@/components/DailyBrief";
import { Card, CardContent } from "@/components/ui/card";
import { FEATURED_TOOLS } from "@/lib/nav";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function Dashboard() {
  let recent: { id: string; title: string }[] = [];
  try {
    recent = await prisma.prompt.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, title: true },
    });
  } catch {
    // DB not migrated yet — fine on first boot.
  }

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-semibold tracking-tight">Welcome back, Ozzy</h1>
      <p className="mt-1 text-sm text-muted-foreground">Your local AI cockpit. Everything runs on this machine.</p>

      <div className="mt-6">
        <HealthBanner />
      </div>

      <div className="mt-6">
        <DailyBrief />
      </div>

      <h2 className="mt-8 text-xs font-medium uppercase tracking-wide text-muted-foreground">Tools</h2>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURED_TOOLS.map((t) => {
          const Icon = t.icon;
          return (
            <Link key={t.href} href={t.href} className="group">
              <Card className="h-full transition-colors hover:border-foreground/20 hover:bg-accent/40">
                <CardContent className="flex items-start gap-3 p-4">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors group-hover:text-foreground">
                    <Icon className="h-[18px] w-[18px]" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium leading-tight">{t.label}</div>
                    <div className="mt-1 text-xs leading-snug text-muted-foreground">{t.desc}</div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {recent.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Recent prompts</h2>
          <ul className="mt-2 space-y-1">
            {recent.map((p) => (
              <li key={p.id} className="truncate text-sm text-foreground/80">
                {p.title}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
