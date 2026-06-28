// Pure field-mapping + validation for editing a saved Prompt (the pencil-icon
// edit dialog in the Prompt Library). The route stays a thin shell: it calls
// this, then does the one check that needs the DB (the project FK exists).
//
// House rule (the "trust pattern killed everywhere"): a manual edit SAVES the
// reviewed text verbatim — no model re-run on save. So this is plain mapping.

const TITLE_MAX = 120;

export type PromptPatchBody = {
  title?: unknown;
  original?: unknown;
  optimized?: unknown;
  tags?: unknown;
  favorite?: unknown;
  projectId?: unknown;
};

export type PromptPatchResult =
  | { ok: true; data: Record<string, unknown> }
  | { ok: false; error: string };

/**
 * Map a PATCH body to a Prisma `prompt.update` data object. Only keys present in
 * the body are touched (partial update). Returns an error string for the caller
 * to surface as a 400. A `data.projectId` that is a non-empty string still needs
 * an FK-existence check in the route (this function can't reach the DB).
 *
 * Takes `unknown`: `req.json()` resolves (does not reject) for a primitive JSON
 * body like `null`/`5`/`"x"`, so the route's parse fallback can't catch those —
 * we guard here so a hand-crafted body is a clean 400, never a 500.
 */
export function buildPromptPatch(body: unknown): PromptPatchResult {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return { ok: false, error: "Invalid request body." };
  }
  const b = body as PromptPatchBody;
  const data: Record<string, unknown> = {};

  if (typeof b.title === "string") {
    const t = b.title.trim();
    if (!t) return { ok: false, error: "Title can't be empty." };
    data.title = t.slice(0, TITLE_MAX);
  }

  // `original` is NOT NULL in the schema — an empty edit would orphan the row's
  // content, so reject it rather than silently storing "".
  if (typeof b.original === "string") {
    const o = b.original.trim();
    if (!o) return { ok: false, error: "Original prompt can't be empty." };
    data.original = o;
  }

  // `optimized` is nullable: an all-whitespace value clears it (back to
  // original-only). Otherwise preserve the content exactly (no trim — leading
  // indentation can be meaningful in a prompt).
  if (typeof b.optimized === "string") {
    data.optimized = b.optimized.trim() ? b.optimized : null;
  }

  if (typeof b.tags === "string") {
    data.tags = b.tags.trim() || null;
  }

  if (typeof b.favorite === "boolean") {
    data.favorite = b.favorite;
  }

  // projectId reassignment: null / "" => global (clear). A string id is mapped
  // here but its existence is verified in the route before the update runs.
  if ("projectId" in b) {
    const pid = b.projectId;
    if (pid === null || pid === "") {
      data.projectId = null;
    } else if (typeof pid === "string") {
      data.projectId = pid;
    } else {
      return { ok: false, error: "Invalid project." };
    }
  }

  if (Object.keys(data).length === 0) {
    return { ok: false, error: "Nothing to update." };
  }
  return { ok: true, data };
}
