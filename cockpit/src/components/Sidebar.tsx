import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";

const tools = [
  { href: "/", label: "Dashboard" },
  { href: "/tools/prompt-optimizer", label: "Prompt Optimizer" },
  { href: "/tools/prompt-library", label: "Prompt Library" },
  { href: "/settings", label: "Settings" },
];

export default function Sidebar() {
  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-border bg-card p-4">
      <div className="mb-6 flex items-center justify-between">
        <span className="text-lg font-semibold">🔧 Swiss Knife</span>
        <ThemeToggle />
      </div>
      <nav className="flex flex-col gap-1">
        {tools.map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="rounded-md px-3 py-2 text-sm text-foreground/80 hover:bg-accent hover:text-accent-foreground"
          >
            {t.label}
          </Link>
        ))}
        <a
          href="http://localhost:3001"
          target="_blank"
          rel="noreferrer"
          className="mt-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        >
          Open WebUI ↗
        </a>
      </nav>
      <div className="mt-auto pt-8 text-xs text-muted-foreground">
        Powered by local Gemma 4 12B
      </div>
    </aside>
  );
}
