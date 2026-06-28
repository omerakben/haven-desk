import { prisma } from "@/lib/db";
import { PROMPT_TEMPLATE_WHERE } from "@/lib/templateGroups";
import { PromptLibrary } from "@/components/library/PromptLibrary";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function PromptLibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; new?: string; edit?: string; duplicate?: string }>;
}) {
  const { q, new: newParam, edit, duplicate } = await searchParams;
  const [promptRows, templateRows, projectRows] = await Promise.all([
    prisma.prompt
      .findMany({
        orderBy: [{ favorite: "desc" }, { createdAt: "desc" }],
        include: { project: { select: { name: true } } },
      })
      .catch(() => []),
    prisma.template
      .findMany({ where: PROMPT_TEMPLATE_WHERE, orderBy: { name: "asc" } })
      .catch(() => []),
    prisma.project
      .findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } })
      .catch(() => []),
  ]);

  const prompts = promptRows.map((p) => ({
    id: p.id,
    title: p.title,
    original: p.original,
    optimized: p.optimized,
    tags: p.tags,
    favorite: p.favorite,
    source: p.source,
    projectId: p.projectId,
    project: p.project?.name ?? null,
  }));

  const templates = templateRows.map((t) => ({
    id: t.id,
    name: t.name,
    description: t.description,
    category: t.category,
    variables: t.variables,
    body: t.body,
    builtin: t.builtin,
  }));

  return (
    <PromptLibrary
      prompts={prompts}
      templates={templates}
      projects={projectRows}
      initialQuery={q ?? ""}
      initialNewTemplate={newParam === "template"}
      initialEditId={edit ?? null}
      initialDuplicateId={duplicate ?? null}
    />
  );
}
