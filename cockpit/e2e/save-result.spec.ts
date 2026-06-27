import { test, expect, type Page } from "@playwright/test";

// Route-mocked (model-independent): the streaming /api/quick-action is fulfilled
// with deterministic text so the result area + save actions render.
const fulfillJson = (body: unknown) => ({ contentType: "application/json", body: JSON.stringify(body) });

async function mockResult(page: Page, output: string) {
  await page.route("**/api/quick-action", (route) =>
    route.fulfill({ contentType: "text/plain", body: output }),
  );
}

test.describe("save a result", () => {
  test("save as note flips to Saved; save as tasks absent on a reply", async ({ page }) => {
    await mockResult(page, "A polished reply you can send.");
    await page.route("**/api/ideas", (route) => route.fulfill(fulfillJson({ idea: { id: "i1" } })));

    await page.goto("/tools/quick-actions?action=reply-to-message");
    await page.getByPlaceholder("Paste it here…").fill("hi there");
    await page.getByPlaceholder(/say yes/).fill("yes");
    await page.getByRole("button", { name: "Go" }).click();

    await expect(page.getByText("A polished reply you can send.")).toBeVisible();
    // reply-to-message has no canSaveTasks flag.
    await expect(page.getByRole("button", { name: "Save as tasks" })).toHaveCount(0);

    await page.getByRole("button", { name: "Save as note" }).click();
    await expect(page.getByRole("button", { name: "Saved" })).toBeVisible();
  });

  test("save as tasks: extract → review → add", async ({ page }) => {
    await mockResult(page, "Your checklist is ready below.");
    await page.route("**/api/result-tasks", (route) => {
      const req = route.request();
      const body = req.method() === "POST" ? (req.postDataJSON() as { create?: unknown[] }) : {};
      if (Array.isArray(body.create)) return route.fulfill(fulfillJson({ created: body.create.length }));
      return route.fulfill(
        fulfillJson({
          tasks: [
            { title: "Call printer", owner: null, dueDate: null, dueLabel: null },
            { title: "Send quote", owner: null, dueDate: null, dueLabel: null },
          ],
          dropped: 0,
        }),
      );
    });

    await page.goto("/tools/quick-actions?action=notes-to-list");
    await page.getByPlaceholder(/Paste or type anything/).fill("printer, quote");
    await page.getByRole("button", { name: "Go" }).click();
    await expect(page.getByText("Your checklist is ready below.")).toBeVisible();

    await page.getByRole("button", { name: "Save as tasks" }).click();
    await expect(page.getByText("Review tasks")).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Task title" })).toHaveCount(2);

    await page.getByRole("button", { name: "Add 2 tasks" }).click();
    await expect(page.getByText("Added 2 tasks")).toBeVisible();
  });
});
