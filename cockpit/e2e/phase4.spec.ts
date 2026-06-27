import { test, expect } from "@playwright/test";

test.describe("phase 4", () => {
  test("memory page shows add + suggest controls", async ({ page }) => {
    await page.goto("/tools/memory");
    await expect(page.getByRole("heading", { name: /memory/i })).toBeVisible();
    await expect(page.getByPlaceholder(/add a fact/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /find facts in text/i })).toBeVisible();
  });

  test("image page shows upload + ask controls", async ({ page }) => {
    await page.goto("/tools/image");
    await expect(page.getByRole("heading", { name: /image/i })).toBeVisible();
    // "Upload image" is a styled <label>, not a button role.
    await expect(page.getByText(/upload image/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /^ask$/i })).toBeVisible();
  });

  test("image tool streams a vision answer (mocked engine)", async ({ page }) => {
    await page.route("**/api/vision", (route) =>
      route.fulfill({ contentType: "text/plain; charset=utf-8", body: "A small blue square." })
    );
    await page.goto("/tools/image");

    // Upload a 1x1 PNG (the file input is hidden but setInputFiles still works).
    const png = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
      "base64"
    );
    await page
      .locator('input[type="file"]')
      .setInputFiles({ name: "tiny.png", mimeType: "image/png", buffer: png });

    const ask = page.getByRole("button", { name: /^ask$/i });
    await expect(ask).toBeEnabled();
    await ask.click();

    await expect(page.getByText("A small blue square.")).toBeVisible();
  });

  test("sidebar links to memory and image", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: "Memory", exact: true })).toBeVisible();
    await expect(page.getByRole("link", { name: "Image", exact: true })).toBeVisible();
  });
});
