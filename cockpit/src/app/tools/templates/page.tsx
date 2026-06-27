import { prisma } from "@/lib/db";
import { PROMPT_TEMPLATE_WHERE } from "@/lib/templateGroups";
import { TemplatesBrowser } from "@/components/library/TemplatesBrowser";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function TemplatesPage({ searchParams }: { searchParams: Promise<{ run?: string }> }) {
  const { run } = await searchParams;
  const templates = await prisma.template
    .findMany({
      where: PROMPT_TEMPLATE_WHERE,
      orderBy: { name: "asc" },
      select: { id: true, name: true, description: true, category: true, builtin: true, favorite: true, variables: true },
    })
    .catch(() => []);
  // Key by `run` so navigating to a different ?run= (e.g. from ⌘K) remounts and
  // reopens the dialog without a set-state-in-effect.
  return <TemplatesBrowser key={run ?? "none"} templates={templates} initialRunId={run ?? null} />;
}
