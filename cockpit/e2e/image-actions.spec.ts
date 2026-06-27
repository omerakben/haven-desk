import { test, expect } from "@playwright/test";

// A 1x1 PNG — content is irrelevant (the vision call is mocked); it just satisfies
// the "image required" gate so Ask enables.
const PNG_1x1 = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M8AAAMBAQAY3Y2wAAAAAElFTkSuQmCC",
  "base64",
);

test.describe("image tool result actions", () => {
  test("a vision answer offers refine, save-as-note, and turn-into-tasks", async ({ page }) => {
    await page.route("**/api/vision", (route) =>
      route.fulfill({ contentType: "text/plain", body: "1. Call the plumber\n2. Buy groceries" }),
    );
    await page.goto("/tools/image");
    await page.setInputFiles('input[type="file"]', { name: "todo.png", mimeType: "image/png", buffer: PNG_1x1 });
    await page.getByRole("button", { name: /^ask$/i }).click();

    await expect(page.getByText("Call the plumber")).toBeVisible();
    await expect(page.getByText("Make it:")).toBeVisible(); // universal refine row
    await expect(page.getByRole("button", { name: /save as note/i })).toBeVisible();

    // Turn into tasks → review → add (extract + create both mocked).
    await page.route("**/api/result-tasks", (route) => {
      const body = route.request().method() === "POST" ? (route.request().postDataJSON() as { create?: unknown[] }) : {};
      if (Array.isArray(body.create)) {
        return route.fulfill({ contentType: "application/json", body: JSON.stringify({ created: body.create.length }) });
      }
      return route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({
          tasks: [
            { title: "Call the plumber", owner: null, dueDate: null, dueLabel: null },
            { title: "Buy groceries", owner: null, dueDate: null, dueLabel: null },
          ],
          dropped: 0,
        }),
      });
    });
    await page.getByRole("button", { name: "Turn into tasks" }).click();
    await expect(page.getByText("Review tasks")).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Task title" })).toHaveCount(2);
    await page.getByRole("button", { name: "Add 2 tasks" }).click();
    await expect(page.getByText("Added 2 tasks")).toBeVisible();
  });
});
