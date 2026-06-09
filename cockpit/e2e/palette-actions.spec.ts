import { test, expect } from "@playwright/test";

// Palette actions + the ⌘P project switcher. Anything that writes (routine,
// project switch) is route-mocked.

test.describe("palette actions", () => {
  test("toggle theme action flips the html class", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Control+k");
    await page.getByPlaceholder(/search prompts/i).fill("toggle theme");
    await page.getByRole("button", { name: /^toggle theme run$/i }).click();
    await expect(page.locator("html")).toHaveClass(/dark/);
    // flip back so other tests aren't affected by persisted theme
    await page.keyboard.press("Control+k");
    await page.getByPlaceholder(/search prompts/i).fill("toggle theme");
    await page.getByRole("button", { name: /^toggle theme run$/i }).click();
    await expect(page.locator("html")).not.toHaveClass(/dark/);
  });

  test("ctrl+p opens project mode and switches the active project", async ({ page }) => {
    await page.route("**/api/projects", (route) => {
      if (route.request().method() === "GET") {
        return route.fulfill({
          contentType: "application/json",
          body: JSON.stringify({ projects: [{ id: "p1", name: "Acme Rockets" }] }),
        });
      }
      return route.fallback();
    });
    await page.route("**/api/projects/active", (route) =>
      route.fulfill({ contentType: "application/json", body: JSON.stringify({ ok: true }) })
    );
    await page.goto("/");
    await page.keyboard.press("Control+p");

    await expect(page.getByPlaceholder(/switch to project/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /no project — global/i })).toBeVisible();
    await page.getByRole("button", { name: /acme rockets/i }).click();
    await expect(page.getByText(/active project: acme rockets/i)).toBeVisible();
  });

  test("the standup routine action reports success", async ({ page }) => {
    await page.route("**/api/capture/token", (route) =>
      route.fulfill({ contentType: "application/json", body: JSON.stringify({ token: "tok" }) })
    );
    await page.route("**/api/routines/standup", (route) =>
      route.fulfill({ contentType: "application/json", body: JSON.stringify({ ok: true }) })
    );
    await page.goto("/");
    await page.keyboard.press("Control+k");
    await page.getByPlaceholder(/search prompts/i).fill("standup");
    await page.getByRole("button", { name: /run standup routine/i }).click();
    await expect(page.getByText(/standup captured to ideas/i)).toBeVisible();
  });
});
