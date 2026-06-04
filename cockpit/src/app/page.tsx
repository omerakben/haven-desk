import Link from "next/link";
import { prisma } from "@/lib/db";
import { HealthBanner } from "@/components/HealthBanner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold">Welcome back, Ozzy</h1>
      <p className="mt-1 text-muted-foreground">
        Your local AI cockpit. Everything runs on this machine.
      </p>

      <div className="mt-6">
        <HealthBanner />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Link href="/tools/prompt-optimizer">
          <Card className="h-full transition-shadow hover:shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">✨ Prompt Optimizer</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Clean up and save reusable prompts.
            </CardContent>
          </Card>
        </Link>
        <Card className="h-full border-dashed">
          <CardHeader>
            <CardTitle className="text-base text-muted-foreground">📥 Coming next</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Email writer · Todo · Kanban · Knowledge base
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <h2 className="text-sm font-medium text-muted-foreground">Recent prompts</h2>
        {recent.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            None yet — optimize your first prompt.
          </p>
        ) : (
          <ul className="mt-2 space-y-1">
            {recent.map((p) => (
              <li key={p.id} className="text-sm">
                • {p.title}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
