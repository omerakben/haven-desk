import { prisma } from "@/lib/db";
import { PROMPT_TEMPLATE_WHERE } from "@/lib/templateGroups";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export type SearchResult = {
  type: "Prompt" | "Note" | "Task" | "Fact" | "Email" | "QA" | "Template";
  id: string;
  title: string;
  subtitle?: string;
  href: string;
};

// One deterministic, local-only search across every content type. SQLite LIKE
// (Prisma `contains`) is case-insensitive for ASCII, which is plenty here.
export async function GET(req: Request) {
  const q = (new URL(req.url).searchParams.get("q") ?? "").trim();
  if (q.length < 2) return Response.json({ results: [] });
  const take = 6;

  const [prompts, ideas, tasks, facts, emails, sessions, templates] = await Promise.all([
    prisma.prompt
      .findMany({
        where: { OR: [{ title: { contains: q } }, { original: { contains: q } }, { optimized: { contains: q } }] },
        take,
        orderBy: { updatedAt: "desc" },
        select: { id: true, title: true },
      })
      .catch(() => []),
    prisma.idea
      .findMany({
        where: { OR: [{ title: { contains: q } }, { topic: { contains: q } }, { content: { contains: q } }] },
        take,
        orderBy: { updatedAt: "desc" },
        select: { id: true, title: true, topic: true },
      })
      .catch(() => []),
    prisma.task
      .findMany({
        where: { OR: [{ title: { contains: q } }, { notes: { contains: q } }] },
        take,
        orderBy: { updatedAt: "desc" },
        select: { id: true, title: true, status: true },
      })
      .catch(() => []),
    prisma.memoryFact
      .findMany({
        where: { status: "active", deletedAt: null, OR: [{ key: { contains: q } }, { value: { contains: q } }] },
        take,
        orderBy: { updatedAt: "desc" },
        select: { id: true, key: true, value: true },
      })
      .catch(() => []),
    prisma.emailDraft
      .findMany({
        where: { OR: [{ title: { contains: q } }, { brief: { contains: q } }, { body: { contains: q } }] },
        take,
        orderBy: { updatedAt: "desc" },
        select: { id: true, title: true, brief: true },
      })
      .catch(() => []),
    prisma.qaSession
      .findMany({
        where: { OR: [{ title: { contains: q } }, { story: { contains: q } }] },
        take,
        orderBy: { updatedAt: "desc" },
        select: { id: true, title: true },
      })
      .catch(() => []),
    prisma.template
      .findMany({
        where: { ...PROMPT_TEMPLATE_WHERE, OR: [{ name: { contains: q } }, { description: { contains: q } }, { body: { contains: q } }] },
        take,
        orderBy: { updatedAt: "desc" },
        select: { id: true, name: true, description: true },
      })
      .catch(() => []),
  ]);

  // Deep links: every href targets the ITEM (seeded search / direct open),
  // not just the listing page — selecting a result used to drop the user on
  // an unfiltered page to hunt for it again.
  const results: SearchResult[] = [
    ...prompts.map((p) => ({
      type: "Prompt" as const,
      id: p.id,
      title: p.title || "Untitled prompt",
      href: `/tools/prompt-library?q=${encodeURIComponent((p.title || "").slice(0, 60))}`,
    })),
    ...ideas.map((i) => ({
      type: "Note" as const,
      id: i.id,
      title: i.title || i.topic || "Note",
      // The Notes home renders the note's actions (turn into tasks / draft email);
      // Brainstorming does not. Send saved-note searches to their real home.
      href: `/tools/notes?ideaId=${i.id}`,
    })),
    ...tasks.map((t) => ({
      type: "Task" as const,
      id: t.id,
      title: t.title,
      subtitle: t.status,
      href: `/tools/tasks?q=${encodeURIComponent(t.title.slice(0, 60))}`,
    })),
    ...facts.map((f) => ({
      type: "Fact" as const,
      id: f.id,
      title: f.key || f.value.slice(0, 70),
      subtitle: f.key ? f.value.slice(0, 70) : undefined,
      href: `/tools/memory?q=${encodeURIComponent((f.key || f.value.slice(0, 40)).trim())}`,
    })),
    ...emails.map((e) => ({
      type: "Email" as const,
      id: e.id,
      title: e.title || e.brief?.slice(0, 70) || "Email draft",
      href: `/tools/email-writer?draftId=${e.id}`,
    })),
    ...sessions.map((s) => ({
      type: "QA" as const,
      id: s.id,
      title: s.title,
      href: `/tools/qa-pipeline?session=${s.id}`,
    })),
    ...templates.map((t) => ({
      type: "Template" as const,
      id: t.id,
      title: t.name,
      subtitle: t.description ?? undefined,
      href: `/tools/templates?run=${t.id}`,
    })),
  ];

  return Response.json({ results });
}
