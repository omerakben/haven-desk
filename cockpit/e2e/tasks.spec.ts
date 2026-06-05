import { test, expect } from "@playwright/test";

test.describe("tasks", () => {
  test("board shows columns and can add a task", async ({ page }) => {
    await page.goto("/tools/tasks");
    await expect(page.getByRole("heading", { name: /tasks/i })).toBeVisible();
    await expect(page.getByText("To do")).toBeVisible();
    await expect(page.getByText("Doing")).toBeVisible();
    await expect(page.getByText("Done", { exact: true })).toBeVisible();

    const title = `Smoke task ${Date.now()}`;
    const input = page.getByPlaceholder(/add a task/i);
    await input.fill(title);
    await page.getByRole("button", { name: /^add$/i }).click();
    await expect(page.getByText(title)).toBeVisible();
  });

  test("list view is reachable", async ({ page }) => {
    await page.goto("/tools/tasks");
    await page.getByRole("tab", { name: /^list$/i }).click();
    await expect(page.getByRole("tab", { name: /^list$/i })).toBeVisible();
  });

  test("AI task buttons are present", async ({ page }) => {
    await page.goto("/tools/tasks");
    await expect(page.getByRole("button", { name: /generate from goal/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /daily summary/i })).toBeVisible();
  });

  test("add box exposes priority and due-date controls", async ({ page }) => {
    await page.goto("/tools/tasks");
    await expect(page.getByLabel("Priority")).toBeVisible();
    await expect(page.getByLabel("Due date")).toBeVisible();
  });

  test("edit dialog updates a task title", async ({ page }) => {
    await page.goto("/tools/tasks");

    const title = `Edit me ${Date.now()}`;
    await page.getByPlaceholder(/add a task/i).fill(title);
    await page.getByRole("button", { name: /^add$/i }).click();
    await expect(page.getByText(title)).toBeVisible();

    // Open the edit dialog from that card (scoped by its unique title).
    const card = page
      .locator("div")
      .filter({ hasText: title })
      .filter({ has: page.getByRole("button", { name: "Edit task" }) })
      .last();
    await card.getByRole("button", { name: "Edit task" }).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog.getByText(/edit task/i)).toBeVisible();
    const edited = `${title} EDITED`;
    await dialog.getByLabel("Title").fill(edited);
    await dialog.getByRole("button", { name: /^save$/i }).click();

    await expect(page.getByText(edited)).toBeVisible();
  });
});
