"use client";

import Link from "next/link";
import { useMemo } from "react";

import { Card, CardContent } from "@/components/ui/card";
import { FEATURED_TOOLS, NAV_GROUPS, type NavItem } from "@/lib/nav";
import { usePersisted } from "@/hooks/usePersisted";

/**
 * The dashboard tool grid, grouped by the persona-first nav sections (Favorites
 * first, then Today / Capture / Write / Projects / Packs / Settings). The flat
 * grid used to dump every tool at equal weight, so a non-technical user saw QA
 * Pipeline next to Email Writer; sectioning keeps the everyday surfaces on top
 * and the professional tools in a clearly-labelled section lower down.
 */
function ToolCard({ t }: { t: NavItem }) {
  const Icon = t.icon;
  return (
    <Link href={t.href} className="group">
      <Card className="h-full transition-[transform,box-shadow,border-color] duration-200 ease-apple group-hover:border-border group-hover:shadow-md motion-safe:group-hover:-translate-y-0.5">
        <CardContent className="flex items-start gap-3 p-4">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary/15">
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
}

function Grid({ items }: { items: NavItem[] }) {
  return (
    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((t) => (
        <ToolCard key={t.href} t={t} />
      ))}
    </div>
  );
}

export function DashboardToolGrid() {
  const [favJson] = usePersisted("sk:nav:favorites", "[]");

  const { favItems, groups } = useMemo(() => {
    let favs: Set<string>;
    try {
      const a = JSON.parse(favJson);
      favs = new Set<string>(Array.isArray(a) ? a : []);
    } catch {
      favs = new Set<string>();
    }
    // Favorites float to their own section; the rest stay grouped by nav section
    // (so a starred tool isn't shown twice), mirroring the sidebar.
    const favItems = FEATURED_TOOLS.filter((t) => favs.has(t.href));
    const rest = FEATURED_TOOLS.filter((t) => !favs.has(t.href));
    const groups = NAV_GROUPS.map((g) => ({ ...g, items: rest.filter((t) => t.group === g.id) })).filter(
      (g) => g.items.length > 0,
    );
    return { favItems, groups };
  }, [favJson]);

  return (
    <div className="space-y-6">
      {favItems.length > 0 && (
        <section>
          <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Favorites</h3>
          <Grid items={favItems} />
        </section>
      )}
      {groups.map((g) => (
        <section key={g.id}>
          <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{g.label}</h3>
          <Grid items={g.items} />
        </section>
      ))}
    </div>
  );
}
