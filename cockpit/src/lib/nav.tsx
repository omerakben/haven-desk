import {
  LayoutDashboard,
  Wand2,
  Library,
  LayoutTemplate,
  Mail,
  Lightbulb,
  Image as ImageIcon,
  Inbox,
  ListTodo,
  FlaskConical,
  ClipboardCheck,
  Bug,
  Scale,
  SearchCode,
  ListChecks,
  TestTubes,
  Webhook,
  Brain,
  StickyNote,
  Activity,
  FolderKanban,
  Package,
  ClipboardList,
  Sparkles,
  Settings as SettingsIcon,
  type LucideIcon,
} from "lucide-react";

export type NavGroup = "today" | "capture" | "write" | "documents" | "projects" | "packs" | "settings";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Short description; present items are featured as dashboard cards. */
  desc?: string;
  /** Sidebar section. Dashboard is ungrouped (always first). */
  group?: NavGroup;
  /** Extra ⌘K match terms (the palette derives from this registry). */
  keywords?: string;
  /**
   * QA/dev tools for a technical audience. Hidden from the dashboard grid and
   * tucked behind a collapsible "Professional" section in the sidebar, so a
   * non-technical user is not led with them. Still reachable from ⌘K.
   */
  professional?: boolean;
};

// Persona-first groups for the Haven Desk transition (was work/write/qa/dev/system,
// which signalled a developer/SDET audience). The professional QA + dev tools now
// live under "Packs". "documents" is reserved for future native document routes and
// renders no header until an item carries it (SidebarNav filters empty groups).
export const NAV_GROUPS: { id: NavGroup; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "capture", label: "Capture" },
  { id: "write", label: "Write" },
  { id: "documents", label: "Documents" },
  { id: "projects", label: "Projects" },
  { id: "packs", label: "Packs" },
  { id: "settings", label: "Settings" },
];

// Single source of truth for navigation, the dashboard cards, AND the command
// palette (which used to hand-copy this list and drifted). Sidebar groups make
// the seams visible now that there are 20+ destinations.
export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, keywords: "home brief today" },

  // Today — the daily operational surfaces.
  { href: "/tools/quick-actions", label: "Quick Actions", icon: Sparkles, group: "today", desc: "One-click help for everyday tasks.", keywords: "quick actions one click do something useful write summarize reply plan list" },
  { href: "/tools/tasks", label: "Tasks", icon: ListTodo, group: "today", desc: "List + Kanban with AI assists.", keywords: "todo kanban board" },
  { href: "/tools/meeting-notes", label: "Meeting Notes", icon: ClipboardList, group: "today", desc: "Turn meeting notes into real tasks.", keywords: "action items extract standup notes to tasks" },
  { href: "/tools/memory", label: "Memory", icon: Brain, group: "today", desc: "Facts woven into your tools.", keywords: "facts glossary" },

  // Capture — input-first tools.
  { href: "/tools/inbox", label: "Smart Inbox", icon: Inbox, group: "capture", desc: "Drop or paste anything; it's auto-sorted.", keywords: "drop paste sort capture" },
  { href: "/tools/image", label: "Image", icon: ImageIcon, group: "capture", desc: "Ask Gemma about an image.", keywords: "vision photo screenshot ocr" },

  // Write — drafting tools on the local model.
  { href: "/tools/prompt-optimizer", label: "Prompt Optimizer", icon: Wand2, group: "write", desc: "Sharpen a rough prompt.", keywords: "sharpen" },
  { href: "/tools/templates", label: "Templates", icon: LayoutTemplate, group: "write", desc: "Browse & run ready-made templates.", keywords: "template proposal sop email pack run library" },
  { href: "/tools/prompt-library", label: "Prompt Library", icon: Library, group: "write", desc: "Saved prompts; manage your templates.", keywords: "templates prompts saved" },
  { href: "/tools/email-writer", label: "Email Writer", icon: Mail, group: "write", desc: "Compose and reply with the right tone.", keywords: "compose reply" },
  { href: "/tools/brainstorm", label: "Brainstorming", icon: Lightbulb, group: "write", desc: "Refine an idea, or run a thinking technique.", keywords: "ideas techniques refine interview me ask questions aha product manager edge cases premortem" },

  // Documents — saved text lives here (the Idea store: results, brainstorms,
  // captures, quick notes). Was reserved/empty until now.
  { href: "/tools/notes", label: "Notes", icon: StickyNote, group: "documents", desc: "Everything you've saved, in one place.", keywords: "notes ideas saved results captures brainstorm" },

  // Projects — the hub + active-project switcher.
  { href: "/tools/projects", label: "Projects", icon: FolderKanban, group: "projects", desc: "Group work; deep-link to Open WebUI.", keywords: "hub" },

  // Packs — installable workflows, including the professional QA + dev tools.
  { href: "/tools/packs", label: "Packs", icon: Package, group: "packs", desc: "Browse and install workflow packs.", keywords: "install pack workflow catalog marketplace small business ops" },
  { href: "/tools/qa-pipeline", label: "QA Pipeline", icon: ClipboardCheck, group: "packs", professional: true, desc: "Story → Gherkin → lint → rubric.", keywords: "story rubric test bench golden professional qa pack" },
  { href: "/tools/gherkin-lint", label: "Gherkin Lint", icon: FlaskConical, group: "packs", professional: true, desc: "Check .feature files for BDD hygiene.", keywords: "bdd feature professional qa pack" },
  { href: "/tools/bug-report", label: "Bug Report", icon: Bug, group: "packs", professional: true, desc: "Rough note → a structured bug report.", keywords: "defect repro severity professional qa pack" },
  { href: "/tools/rubric-designer", label: "Rubric Designer", icon: ListChecks, group: "packs", professional: true, desc: "The bar → a gated, weighted eval rubric.", keywords: "eval rubric weights bands score professional qa pack" },
  { href: "/tools/eval-cases", label: "Eval Cases", icon: TestTubes, group: "packs", professional: true, desc: "Spec → coverage-gated eval cases.", keywords: "golden test cases coverage adversarial boundary professional qa pack" },
  { href: "/tools/code-review", label: "Code Review", icon: SearchCode, group: "packs", professional: true, desc: "Smell scan + AI explanation of findings.", keywords: "smells complexity big-o diff lint professional dev pack" },
  { href: "/tools/adr", label: "ADR Writer", icon: Scale, group: "packs", professional: true, desc: "Decision note → a gated MADR record.", keywords: "decision record madr architecture professional dev pack" },
  { href: "/tools/api-contract", label: "API Contract", icon: Webhook, group: "packs", professional: true, desc: "Prose → validated OpenAPI 3.1.", keywords: "openapi swagger rest endpoint yaml professional dev pack" },

  // Settings — meta surfaces.
  { href: "/tools/activity", label: "Activity", icon: Activity, group: "settings", desc: "A timeline of what happened.", keywords: "timeline log history" },
  { href: "/settings", label: "Settings", icon: SettingsIcon, group: "settings", keywords: "model theme health backup" },
];

/** Items featured as cards on the dashboard (everything with a description). */
export const FEATURED_TOOLS = NAV_ITEMS.filter((i) => i.desc);
