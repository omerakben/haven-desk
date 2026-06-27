// The canonical filter for prompt-template surfaces (the Templates page, search).
// Brainstorm uses kind:"technique"; never show those here, and never archived.
export const PROMPT_TEMPLATE_WHERE = { kind: "prompt", archived: false };

export type GroupableTemplate = { category: string | null; builtin: boolean; favorite: boolean; name: string };
export type TemplateGroup<T> = { label: string; templates: T[] };

const SOURCE_BUILTIN = "Built-in";
const SOURCE_USER = "Your templates";

// Lowercase then capitalize each word, so "EMAIL"/"email" merge into one group
// and multi-word categories read cleanly (and never collide with the fixed-case
// source-fallback labels like "Built-in").
const titleCase = (s: string) => s.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

/**
 * Group templates by category (title-cased); anything with no category falls
 * back to its source ("Built-in" / "Your templates"). Within a group: favorites
 * first, then by name. Group order: real categories alphabetically, then the two
 * source fallbacks last, so curated categories lead and catch-alls trail.
 */
export function groupTemplates<T extends GroupableTemplate>(templates: T[]): TemplateGroup<T>[] {
  const byLabel = new Map<string, T[]>();
  for (const item of templates) {
    const cat = item.category?.trim();
    const label = cat ? titleCase(cat) : item.builtin ? SOURCE_BUILTIN : SOURCE_USER;
    const arr = byLabel.get(label) ?? [];
    arr.push(item);
    byLabel.set(label, arr);
  }
  for (const arr of byLabel.values()) {
    arr.sort((a, b) => (a.favorite === b.favorite ? a.name.localeCompare(b.name) : a.favorite ? -1 : 1));
  }
  const fallbacks = [SOURCE_BUILTIN, SOURCE_USER];
  const categories = [...byLabel.keys()].filter((l) => !fallbacks.includes(l)).sort((a, b) => a.localeCompare(b));
  const tail = fallbacks.filter((l) => byLabel.has(l));
  return [...categories, ...tail].map((label) => ({ label, templates: byLabel.get(label)! }));
}
