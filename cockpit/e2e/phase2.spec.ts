import { test, expect } from "@playwright/test";

// Model-independent smoke tests for the Phase 2 tool pages.

test.describe("phase 2 tools", () => {
  test("prompt library lists seeded templates", async ({ page }) => {
    await page.goto("/tools/prompt-library");
    await expect(page.getByRole("heading", { name: /prompt library/i })).toBeVisible();
    await page.getByRole("tab", { name: /templates/i }).click();
    await expect(page.getByText(/summarize to bullets/i)).toBeVisible();
  });

  test("create a custom template", async ({ page }) => {
    await page.goto("/tools/prompt-library");
    await page.getByRole("tab", { name: /templates/i }).click();
    await page.getByRole("button", { name: /new template/i }).click();

    const dialog = page.getByRole("dialog");
    const name = `E2E tmpl ${Date.now()}`;
    await dialog.getByLabel("Name").fill(name);
    await dialog.getByLabel("Body").fill("Summarize {{text}} in {{count}} bullets.");
    await dialog.getByRole("button", { name: /^save$/i }).click();

    await expect(page.getByText(name)).toBeVisible();
  });

  test("duplicate a built-in template prefills the dialog", async ({ page }) => {
    await page.goto("/tools/prompt-library");
    await page.getByRole("tab", { name: /templates/i }).click();
    // Built-ins (seeded) expose a duplicate button, not edit/delete.
    await page.getByRole("button", { name: /duplicate template/i }).first().click();
    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText(/new template/i)).toBeVisible();
    await expect(dialog.getByLabel("Name")).toHaveValue(/copy of/i);
  });

  test("create then delete a custom template", async ({ page }) => {
    await page.goto("/tools/prompt-library");
    await page.getByRole("tab", { name: /templates/i }).click();
    await page.getByRole("button", { name: /new template/i }).click();

    const dialog = page.getByRole("dialog");
    const name = `Del tmpl ${Date.now()}`;
    await dialog.getByLabel("Name").fill(name);
    await dialog.getByLabel("Body").fill("Body {{x}}.");
    await dialog.getByRole("button", { name: /^save$/i }).click();
    await expect(page.getByText(name)).toBeVisible();

    const card = page
      .locator("div")
      .filter({ hasText: name })
      .filter({ has: page.getByRole("button", { name: "Delete template" }) })
      .last();
    await card.getByRole("button", { name: "Delete template" }).click();

    await expect(page.getByText(name)).toHaveCount(0);
  });

  test("email writer shows its controls", async ({ page }) => {
    await page.goto("/tools/email-writer");
    await expect(page.getByRole("heading", { name: /email writer/i })).toBeVisible();
    await expect(page.getByLabel(/brief/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /^write$/i })).toBeVisible();
  });

  test("brainstorm shows the technique picker", async ({ page }) => {
    await page.goto("/tools/brainstorm");
    await expect(page.getByRole("heading", { name: /brainstorming/i })).toBeVisible();
    // "Refine an idea" is the default mode now; the classic techniques sit behind a tab.
    await page.getByRole("tab", { name: "Thinking techniques" }).click();
    await expect(page.getByRole("button", { name: /premortem/i })).toBeVisible();
  });

  test("dashboard links to all tools", async ({ page }) => {
    await page.goto("/");
    // Scope to the main content so we match the cards, not the sidebar nav links.
    const main = page.getByRole("main");
    await expect(main.getByRole("link", { name: /prompt library/i })).toBeVisible();
    await expect(main.getByRole("link", { name: /email writer/i })).toBeVisible();
    await expect(main.getByRole("link", { name: /brainstorming/i })).toBeVisible();
  });
});
