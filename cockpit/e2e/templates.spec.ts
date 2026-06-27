import { test, expect } from "@playwright/test";

// The Templates page is server-rendered from the DB (the dev DB has built-in
// prompt templates), so these assert structure rather than mocking a server
// fetch: the grouped browse renders, search is present, and "Use" opens the
// shared run dialog. Model-independent (no run is triggered).

test.describe("templates page", () => {
  test("renders the grouped browse and opens the run dialog on Use", async ({ page }) => {
    await page.goto("/tools/templates");

    await expect(page.getByRole("heading", { name: "Templates", exact: true })).toBeVisible();
    await expect(page.getByPlaceholder(/Search templates/)).toBeVisible();
    // At least one category section header is present (built-ins are categorized).
    await expect(page.getByRole("heading", { level: 2 }).first()).toBeVisible();

    const use = page.getByRole("button", { name: "Use" }).first();
    await expect(use).toBeVisible();
    await use.click();
    await expect(page.getByRole("dialog")).toBeVisible();
    // The runner's Run button is inside the dialog.
    await expect(page.getByRole("button", { name: "Run" })).toBeVisible();
  });

  test("search narrows the list", async ({ page }) => {
    await page.goto("/tools/templates");
    await page.getByPlaceholder(/Search templates/).fill("zzzz-no-such-template");
    await expect(page.getByText(/No templates match/)).toBeVisible();
  });
});
