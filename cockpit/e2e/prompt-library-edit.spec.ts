import { test, expect } from "@playwright/test";

// The edit dialog used to expose only Title + Tags. It now edits every field —
// the prompt text, the optimized version, tags, project, and favorite. These
// tests create real rows via the API, drive the UI, then clean up after
// themselves. Assertions are card-scoped (the e2e runs against the shared dev
// DB, so page-global text could collide with other prompts).

function cardFor(page: import("@playwright/test").Page, title: string) {
  return page
    .locator("div")
    .filter({ hasText: title })
    .filter({ has: page.getByRole("button", { name: "Edit", exact: true }) })
    .last();
}

test.describe("prompt library — full edit", () => {
  test("edits all fields and reassigns the project", async ({ page }) => {
    // Unique tokens so post-save assertions can't collide with other prompts in
    // the shared dev DB (page-global text + unique value = robust, not flaky).
    const stamp = Date.now();
    const title = `E2E edit ${stamp}`;
    const projectName = `E2E proj ${stamp}`;
    const optimizedEdit = `edited optimized ${stamp}`;
    const tagA = `alpha${stamp}`;
    const tagB = `beta${stamp}`;

    const projRes = await page.request.post("/api/projects", { data: { name: projectName } });
    expect(projRes.ok()).toBeTruthy();
    const { project } = await projRes.json();

    const createRes = await page.request.post("/api/prompts", {
      data: {
        title,
        original: "the original prompt text",
        optimized: "the optimized version",
        source: "library",
      },
    });
    expect(createRes.ok()).toBeTruthy();
    const { prompt } = await createRes.json();

    try {
      await page.goto("/tools/prompt-library");
      await cardFor(page, title).getByRole("button", { name: "Edit", exact: true }).click();

      const dialog = page.getByRole("dialog");
      // The gap closed: content fields are present and prefilled.
      await expect(dialog.getByLabel("Title")).toHaveValue(title);
      await expect(dialog.getByLabel("Prompt", { exact: true })).toHaveValue(
        "the original prompt text"
      );
      await expect(dialog.getByLabel("Optimized version")).toHaveValue("the optimized version");

      // Edit the body, the optimized rewrite, and the tags.
      await dialog.getByLabel("Prompt", { exact: true }).fill("edited original body");
      await dialog.getByLabel("Optimized version").fill(optimizedEdit);
      await dialog.getByLabel("Tags (comma-separated)").fill(`${tagA}, ${tagB}`);

      // Reassign the project (the headline new capability) and favorite it.
      await dialog.getByRole("combobox", { name: "Project" }).click();
      await page.getByRole("option", { name: projectName }).click();
      await dialog.getByRole("button", { name: /favorite/i }).click();
      await expect(dialog.getByRole("button", { name: /favorited/i })).toBeVisible();

      await dialog.getByRole("button", { name: /^save$/i }).click();
      await expect(dialog).toBeHidden();

      // The card reflects every saved edit (unique tokens => collision-free).
      await expect(page.getByText(optimizedEdit)).toBeVisible();
      await expect(page.getByText(tagA, { exact: true })).toBeVisible();
      await expect(page.getByText(tagB, { exact: true })).toBeVisible();
      await expect(page.getByText(projectName)).toBeVisible();
    } finally {
      await page.request.delete(`/api/prompts/${prompt.id}`);
      await page.request.delete(`/api/projects/${project.id}`);
    }
  });

  test("PATCH rejects a non-existent project and a malformed body", async ({ page }) => {
    const title = `E2E route ${Date.now()}`;
    const createRes = await page.request.post("/api/prompts", {
      data: { title, original: "x" },
    });
    expect(createRes.ok()).toBeTruthy();
    const { prompt } = await createRes.json();

    try {
      // FK rejection — the route's only added logic: a stale id is a clean 400.
      const fk = await page.request.patch(`/api/prompts/${prompt.id}`, {
        data: { projectId: "does-not-exist" },
      });
      expect(fk.status()).toBe(400);
      expect((await fk.json()).error).toMatch(/project not found/i);

      // A primitive JSON body (req.json resolves to `null`) is a 400, not a 500.
      const bad = await page.request.patch(`/api/prompts/${prompt.id}`, {
        headers: { "content-type": "application/json" },
        data: "null",
      });
      expect(bad.status()).toBe(400);
      expect((await bad.json()).error).toMatch(/invalid request body/i);
    } finally {
      await page.request.delete(`/api/prompts/${prompt.id}`);
    }
  });
});
