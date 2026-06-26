import { CircleCheck, CircleAlert, ShieldCheck } from "lucide-react";

import { prisma } from "@/lib/db";
import { EXAMPLE_PACKS } from "@/lib/packs/examples";
import { validatePackManifest, type PackPermissions } from "@/lib/packs/manifest";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { InstallPackButton } from "@/components/packs/InstallPackButton";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// The v1 invariant flags a pack must never request. If all are off, the pack is
// purely local and reviewed, which is the trust line we surface.
const RISK_PERMS: { key: keyof PackPermissions; label: string }[] = [
  { key: "network", label: "network access" },
  { key: "externalSend", label: "sends data out" },
  { key: "runtimeCode", label: "runs code" },
  { key: "autonomous", label: "acts unattended" },
];

export default async function PacksPage() {
  // Pack content is keyed by globally-unique slug / sourceKey, so install is
  // workspace-global in v1 and the "installed" check counts globally to match.
  const rows = await Promise.all(
    EXAMPLE_PACKS.map(async (pack) => {
      const validation = validatePackManifest(pack);
      const slugs = pack.templates.map((t) => t.slug);
      const factKeys = pack.memoryFacts.map((f) => f.sourceKey);
      const taskKeys = pack.taskSeeds.map((s) => s.sourceKey);
      const [tCount, fCount, kCount] = await Promise.all([
        slugs.length
          ? prisma.template.count({ where: { slug: { in: slugs }, archived: false } }).catch(() => 0)
          : 0,
        factKeys.length
          ? prisma.memoryFact.count({ where: { sourceKey: { in: factKeys }, deletedAt: null } }).catch(() => 0)
          : 0,
        taskKeys.length ? prisma.task.count({ where: { sourceKey: { in: taskKeys } } }).catch(() => 0) : 0,
      ]);
      const installedItems = tCount + fCount + kCount;
      const totalItems = slugs.length + factKeys.length + taskKeys.length;
      return { pack, validation, installedItems, totalItems };
    }),
  );

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-semibold tracking-tight">Packs</h1>
      <p className="mt-1.5 text-[15px] text-muted-foreground">
        Workflow packs bundle templates, memory facts, and tasks for a job. Installing one adds that
        content to your workspace, available across projects. Packs are declarative and reviewed before
        install. No pack runs a model, reaches the network, or sends anything out.
      </p>

      <div className="mt-6 space-y-4">
        {rows.map(({ pack, validation, installedItems, totalItems }) => {
          const granted = RISK_PERMS.filter((p) => pack.permissions[p.key]);
          const fullyInstalled = totalItems > 0 && installedItems >= totalItems;
          const partiallyInstalled = installedItems > 0 && !fullyInstalled;
          return (
            <Card key={pack.slug}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <CardTitle className="flex flex-wrap items-center gap-2">
                      <span>{pack.name}</span>
                      <Badge variant="outline" className="text-[10px] font-normal">
                        v{pack.version}
                      </Badge>
                      <Badge variant="secondary" className="text-[10px]">
                        {pack.maturity}
                      </Badge>
                      <Badge variant="secondary" className="text-[10px]">
                        {pack.audience}
                      </Badge>
                    </CardTitle>
                    <CardDescription className="mt-1.5">{pack.description}</CardDescription>
                  </div>
                  {validation.ok ? (
                    <Badge variant="success" className="shrink-0 gap-1">
                      <CircleCheck className="h-3.5 w-3.5" /> Valid
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="shrink-0 gap-1">
                      <CircleAlert className="h-3.5 w-3.5" /> {validation.summary.errors} errors
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-3 text-sm">
                <div>
                  <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    What it installs
                  </div>
                  <p className="mt-1 text-muted-foreground">
                    {validation.summary.templates} templates, {validation.summary.memoryFacts} memory facts,{" "}
                    {validation.summary.taskSeeds} tasks
                    {pack.routes.length > 0 && <> · surfaces {pack.routes.length} tools</>}
                  </p>
                </div>

                <div>
                  <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Capabilities
                  </div>
                  <ul className="mt-1 list-inside list-disc text-muted-foreground">
                    {pack.capabilities.slice(0, 4).map((c) => (
                      <li key={c} className="truncate">
                        {c}
                      </li>
                    ))}
                    {pack.capabilities.length > 4 && (
                      <li className="list-none text-xs">and {pack.capabilities.length - 4} more</li>
                    )}
                  </ul>
                </div>

                {granted.length === 0 ? (
                  <p className="flex items-center gap-1.5 text-xs text-[hsl(var(--badge-success-fg))]">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    Local and reviewed: no network, no sending, no code, no unattended action.
                  </p>
                ) : (
                  <p className="text-xs text-[hsl(var(--badge-warning-fg))]">
                    Requests: {granted.map((p) => p.label).join(", ")}.
                  </p>
                )}

                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs text-muted-foreground">
                    {fullyInstalled
                      ? "Installed"
                      : partiallyInstalled
                        ? `${installedItems} of ${totalItems} items present`
                        : "Not installed"}
                  </span>
                  <InstallPackButton slug={pack.slug} installed={fullyInstalled} disabled={!validation.ok} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
