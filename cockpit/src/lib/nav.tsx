import {
  LayoutDashboard,
  Wand2,
  Library,
  Mail,
  Lightbulb,
  Image as ImageIcon,
  Inbox,
  ListTodo,
  FlaskConical,
  ClipboardCheck,
  Bug,
  Scale,
  Brain,
  Activity,
  FolderKanban,
  Settings as SettingsIcon,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Short description; present items are featured as dashboard cards. */
  desc?: string;
};

// Single source of truth for navigation + dashboard cards, so the sidebar and
// the home grid always match (icons, labels, order).
export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tools/prompt-optimizer", label: "Prompt Optimizer", icon: Wand2, desc: "Sharpen a rough prompt." },
  { href: "/tools/prompt-library", label: "Prompt Library", icon: Library, desc: "Saved prompts + variable templates." },
  { href: "/tools/email-writer", label: "Email Writer", icon: Mail, desc: "Compose and reply with the right tone." },
  { href: "/tools/brainstorm", label: "Brainstorming", icon: Lightbulb, desc: "Structured thinking techniques." },
  { href: "/tools/image", label: "Image", icon: ImageIcon, desc: "Ask Gemma about an image." },
  { href: "/tools/inbox", label: "Smart Inbox", icon: Inbox, desc: "Drop or paste anything; it's auto-sorted." },
  { href: "/tools/tasks", label: "Tasks", icon: ListTodo, desc: "List + Kanban with AI assists." },
  { href: "/tools/gherkin-lint", label: "Gherkin Lint", icon: FlaskConical, desc: "Check .feature files for BDD hygiene." },
  { href: "/tools/qa-pipeline", label: "QA Pipeline", icon: ClipboardCheck, desc: "Story → Gherkin → lint → rubric." },
  { href: "/tools/bug-report", label: "Bug Report", icon: Bug, desc: "Rough note → a structured bug report." },
  { href: "/tools/adr", label: "ADR Writer", icon: Scale, desc: "Decision note → a gated MADR record." },
  { href: "/tools/memory", label: "Memory", icon: Brain, desc: "Facts woven into your tools." },
  { href: "/tools/activity", label: "Activity", icon: Activity, desc: "A timeline of what happened." },
  { href: "/tools/projects", label: "Projects", icon: FolderKanban, desc: "Group work; deep-link to Open WebUI." },
  { href: "/settings", label: "Settings", icon: SettingsIcon },
];

/** Items featured as cards on the dashboard (everything with a description). */
export const FEATURED_TOOLS = NAV_ITEMS.filter((i) => i.desc);
