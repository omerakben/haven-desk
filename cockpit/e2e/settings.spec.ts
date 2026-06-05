import { test, expect } from "@playwright/test";

// Model-independent: the engine list is route-mocked, so this runs without Ollama.

test.describe("settings — model picker", () => {
  test.beforeEach(async ({ page }) => {
    await page.route("**/api/models", (route) =>
      route.fulfill({
        json: {
          current: "gemma4:12b-mlx",
          models: [
            { name: "gemma4:12b-mlx", sizeBytes: 10_000_000_000, paramSize: "", quant: "", embedding: false },
            { name: "gemma4:e4b", sizeBytes: 9_600_000_000, paramSize: "8.0B", quant: "Q4_K_M", embedding: false },
          ],
        },
      })
    );
  });

  test("shows the model picker and the RAM guidance", async ({ page }) => {
    await page.goto("/settings");
    await expect(page.getByRole("heading", { name: /settings/i })).toBeVisible();

    // The picker (combobox) replaces the old free-text box.
    await expect(page.getByLabel("Model")).toBeVisible();

    // The Docker-RAM guidance callout points users at the light model.
    await expect(page.getByText(/light model/i)).toBeVisible();
    await expect(page.getByText("gemma4:e4b").first()).toBeVisible();
  });

  test("lists installed models as options", async ({ page }) => {
    await page.goto("/settings");
    await page.getByLabel("Model").click();
    await expect(page.getByRole("option", { name: /gemma4:e4b/ })).toBeVisible();
    await expect(page.getByRole("option", { name: /gemma4:12b-mlx/ })).toBeVisible();
    await expect(page.getByRole("option", { name: /custom tag/i })).toBeVisible();
  });
});
