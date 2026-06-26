// Pure planning step for installing a declarative pack. Given a validated
// PluginManifest and a target project (null = global), it produces the exact
// upsert rows for templates (keyed by slug), memory facts and task seeds (keyed
// by sourceKey). It performs no I/O. The API route validates the manifest with
// validatePackManifest (the deterministic gate), then applies this plan via
// prisma upserts, so re-installing the same pack refreshes content without
// duplicating it (the schema enforces unique slug / sourceKey).
//
// create vs update: a fresh install uses `create`; a reinstall uses `update`.
// They differ on purpose. Facts carry deletedAt:null on both so a reinstall
// restores a fact the user had moved to Trash. Tasks omit `status` (and never
// touch completedAt) from `update`, so reinstalling a pack never resets a task
// the user already moved to Doing/Done back to todo.

import type { PluginManifest } from "./manifest";

export type TemplateData = {
  slug: string;
  kind: string;
  name: string;
  description: string | null;
  body: string;
  variables: string;
  category: string | null;
  builtin: boolean;
  archived: boolean;
  projectId: string | null;
};

export type FactData = {
  key: string | null;
  value: string;
  source: string;
  status: string;
  pinned: boolean;
  category: string | null;
  sourceKey: string;
  deletedAt: Date | null;
  projectId: string | null;
};

export type TaskCreateData = {
  title: string;
  status: string;
  module: string | null;
  notes: string | null;
  sourceKey: string;
  projectId: string | null;
};
// Reinstall must not clobber the user's task state, so the update payload drops
// `status` (and never sets completedAt).
export type TaskUpdateData = Omit<TaskCreateData, "status">;

export type TemplateRow = { slug: string; create: TemplateData; update: TemplateData };
export type FactRow = { sourceKey: string; create: FactData; update: FactData };
export type TaskRow = { sourceKey: string; create: TaskCreateData; update: TaskUpdateData };

export type InstallPlan = {
  packSlug: string;
  templates: TemplateRow[];
  facts: FactRow[];
  tasks: TaskRow[];
  counts: { templates: number; facts: number; tasks: number };
};

/**
 * Build the deterministic upsert plan for a pack. Pure: same input, same plan.
 * A pack install is a deliberate human action over declarative content, so
 * facts land as active manual memory (the same model the seed loader uses), not
 * as model-suggested pending facts.
 */
export function buildInstallPlan(pack: PluginManifest, projectId: string | null): InstallPlan {
  const templates: TemplateRow[] = pack.templates.map((t) => {
    const data: TemplateData = {
      slug: t.slug,
      kind: t.kind ?? "prompt",
      name: t.name,
      description: t.description ?? null,
      body: t.body,
      variables: t.variables ?? "[]",
      category: t.category ?? null,
      builtin: false,
      archived: false,
      projectId,
    };
    return { slug: t.slug, create: data, update: data };
  });

  const facts: FactRow[] = pack.memoryFacts.map((f) => {
    const data: FactData = {
      key: f.key ?? null,
      value: f.value,
      source: "manual",
      status: "active",
      pinned: Boolean(f.pinned),
      category: f.category ?? null,
      sourceKey: f.sourceKey,
      deletedAt: null,
      projectId,
    };
    return { sourceKey: f.sourceKey, create: data, update: data };
  });

  const tasks: TaskRow[] = pack.taskSeeds.map((s) => {
    const update: TaskUpdateData = {
      title: s.title,
      module: s.module ?? null,
      notes: s.notes ?? null,
      sourceKey: s.sourceKey,
      projectId,
    };
    return {
      sourceKey: s.sourceKey,
      create: { ...update, status: s.status ?? "todo" },
      update,
    };
  });

  return {
    packSlug: pack.slug,
    templates,
    facts,
    tasks,
    counts: { templates: templates.length, facts: facts.length, tasks: tasks.length },
  };
}
