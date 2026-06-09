"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ExternalLink } from "lucide-react";

import { NAV_ITEMS } from "@/lib/nav";

export function SidebarNav() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-col gap-0.5">
      {NAV_ITEMS.map((t) => {
        const active = t.href === "/" ? pathname === "/" : pathname.startsWith(t.href);
        const Icon = t.icon;
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={active ? "page" : undefined}
            className={
              "group flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm transition-colors " +
              (active
                ? "bg-accent font-medium text-accent-foreground"
                : "text-foreground/70 hover:bg-accent/60 hover:text-foreground")
            }
          >
            <Icon
              className={
                "h-4 w-4 shrink-0 " + (active ? "" : "text-muted-foreground group-hover:text-foreground")
              }
            />
            <span className="truncate">{t.label}</span>
          </Link>
        );
      })}

      <a
        href="http://localhost:3001"
        target="_blank"
        rel="noreferrer"
        className="group mt-1 flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground"
      >
        <ExternalLink className="h-4 w-4 shrink-0" />
        <span className="truncate">Open WebUI</span>
      </a>
    </nav>
  );
}
