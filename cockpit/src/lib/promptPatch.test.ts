import { describe, it, expect } from "vitest";

import { buildPromptPatch } from "./promptPatch";

describe("buildPromptPatch", () => {
  it("maps only the keys present (partial update)", () => {
    const r = buildPromptPatch({ title: "Hi" });
    expect(r).toEqual({ ok: true, data: { title: "Hi" } });
  });

  it("trims the title and rejects an empty one", () => {
    expect(buildPromptPatch({ title: "  Spaced  " })).toEqual({
      ok: true,
      data: { title: "Spaced" },
    });
    expect(buildPromptPatch({ title: "   " })).toEqual({
      ok: false,
      error: "Title can't be empty.",
    });
  });

  it("caps the title at 120 chars", () => {
    const long = "x".repeat(200);
    const r = buildPromptPatch({ title: long });
    expect(r.ok).toBe(true);
    if (r.ok) expect((r.data.title as string).length).toBe(120);
  });

  it("trims original and rejects an empty one (NOT NULL column)", () => {
    expect(buildPromptPatch({ original: "  do x  " })).toEqual({
      ok: true,
      data: { original: "do x" },
    });
    expect(buildPromptPatch({ original: "   " })).toEqual({
      ok: false,
      error: "Original prompt can't be empty.",
    });
  });

  it("clears optimized when all-whitespace, preserves content otherwise", () => {
    expect(buildPromptPatch({ optimized: "   " })).toEqual({
      ok: true,
      data: { optimized: null },
    });
    // Content preserved verbatim (no trim — indentation can matter).
    expect(buildPromptPatch({ optimized: "  improved\n  text  " })).toEqual({
      ok: true,
      data: { optimized: "  improved\n  text  " },
    });
  });

  it("maps tags, clearing to null when blank", () => {
    expect(buildPromptPatch({ tags: " a, b " })).toEqual({
      ok: true,
      data: { tags: "a, b" },
    });
    expect(buildPromptPatch({ tags: "   " })).toEqual({
      ok: true,
      data: { tags: null },
    });
  });

  it("maps the favorite boolean (both values)", () => {
    expect(buildPromptPatch({ favorite: true })).toEqual({ ok: true, data: { favorite: true } });
    expect(buildPromptPatch({ favorite: false })).toEqual({ ok: true, data: { favorite: false } });
  });

  it("maps projectId: a string id, and null/'' => global", () => {
    expect(buildPromptPatch({ projectId: "proj_1" })).toEqual({
      ok: true,
      data: { projectId: "proj_1" },
    });
    expect(buildPromptPatch({ projectId: null })).toEqual({ ok: true, data: { projectId: null } });
    expect(buildPromptPatch({ projectId: "" })).toEqual({ ok: true, data: { projectId: null } });
  });

  it("rejects a non-string, non-null projectId", () => {
    expect(buildPromptPatch({ projectId: 42 })).toEqual({
      ok: false,
      error: "Invalid project.",
    });
  });

  it("rejects a non-object body without throwing (null/primitive/array)", () => {
    // req.json() resolves for these — the route can't catch them, so the lib must.
    for (const bad of [null, undefined, 42, "hi", true, []]) {
      expect(() => buildPromptPatch(bad)).not.toThrow();
      expect(buildPromptPatch(bad)).toEqual({ ok: false, error: "Invalid request body." });
    }
  });

  it("rejects an empty patch (nothing to update)", () => {
    expect(buildPromptPatch({})).toEqual({ ok: false, error: "Nothing to update." });
    // Non-string types for content fields are ignored, so still empty.
    expect(buildPromptPatch({ title: 5, tags: null })).toEqual({
      ok: false,
      error: "Nothing to update.",
    });
  });

  it("composes a full edit of every field", () => {
    const r = buildPromptPatch({
      title: "T",
      original: "orig",
      optimized: "opt",
      tags: "x,y",
      favorite: true,
      projectId: "p1",
    });
    expect(r).toEqual({
      ok: true,
      data: { title: "T", original: "orig", optimized: "opt", tags: "x,y", favorite: true, projectId: "p1" },
    });
  });
});
