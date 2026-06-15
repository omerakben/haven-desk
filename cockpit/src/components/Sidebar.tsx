import { Wrench } from "lucide-react";

import { prisma } from "@/lib/db";
import { getActiveProjectId } from "@/lib/project";
import { ThemeToggle } from "@/components/theme-toggle";
import { ProjectSwitcher } from "@/components/ProjectSwitcher";
import { CommandHint } from "@/components/CommandHint";
import { SidebarNav } from "@/components/SidebarNav";
import { MobileSidebar } from "@/components/MobileSidebar";

export default async function Sidebar() {
  const [projects, activeId] = await Promise.all([
    prisma.project
      .findMany({
        where: { archived: false },
        orderBy: { createdAt: "asc" },
        select: { id: true, name: true },
      })
      .catch(() => [] as { id: string; name: string }[]),
    getActiveProjectId(),
  ]);

  // Rendered twice: inside the md+ persistent aside and inside the <md drawer.
  const content = (
    <>
      <div className="flex items-center justify-between px-4 py-3.5">
        <span className="flex items-center gap-2.5 text-[15px] font-semibold tracking-tight">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
            <Wrench className="h-[15px] w-[15px]" />
          </span>
          Swiss Knife
        </span>
        <ThemeToggle />
      </div>

      <div className="space-y-2 px-3 pb-3">
        <ProjectSwitcher projects={projects} activeId={activeId} />
        <CommandHint />
      </div>

      <div className="flex-1 overflow-y-auto px-3 pb-3">
        <SidebarNav />
      </div>

      <div className="border-t border-border px-4 py-3 text-xs text-muted-foreground">
        Powered by local Gemma 4
      </div>
    </>
  );

  return (
    <>
      <MobileSidebar>{content}</MobileSidebar>
      <aside
        aria-label="Sidebar"
        className="hidden w-60 shrink-0 flex-col border-r border-border/70 glass md:flex"
      >
        {content}
      </aside>
    </>
  );
}
