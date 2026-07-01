import { test, expect, type Page } from "@playwright/test";

// Route-mocked (model-independent): the AHA interview returns fixed questions and
// the brief streams fixed text, so the interview -> answer -> brief -> save flow
// renders deterministically without Ollama.

const QUESTIONS = {
  questions: [
    { text: "Who is this newsletter for?", type: "scope", why: "changes the whole design" },
    { text: "How do you know they want it?", type: "evidence", why: "avoids building the wrong thing" },
    { text: "Who writes it each week?", type: "risk", why: "a busy week can break the streak" },
  ],
};

const BRIEF = [
  "## The idea in one line",
  "A weekly street newsletter for your block.",
  "",
  "## Where it could go wrong",
  "- It fizzles when news runs out — medium",
  "",
  "## Next steps",
  "- Ask 10 neighbors if they'd read it.",
].join("\n");

async function mockInterview(page: Page) {
  await page.route("**/api/refine-idea/interview", (route) =>
    route.fulfill({ contentType: "application/json", body: JSON.stringify(QUESTIONS) }),
  );
}
async function mockBrief(page: Page) {
  await page.route("**/api/refine-idea/brief", (route) =>
    route.fulfill({ contentType: "text/plain", body: BRIEF }),
  );
}

test.describe("AHA idea refinement", () => {
  test("interview -> answer -> brief -> save", async ({ page }) => {
    await mockInterview(page);
    await mockBrief(page);
    await page.route("**/api/ideas", (route) =>
      route.fulfill({ contentType: "application/json", body: JSON.stringify({ idea: { id: "i1" } }) }),
    );

    await page.goto("/tools/brainstorm");
    // Refine is the default mode.
    await expect(page.getByRole("button", { name: /Interview me/ })).toBeVisible();

    await page.getByPlaceholder(/Describe your idea/).fill("A weekly email to my neighbors");
    await page.getByRole("button", { name: /Interview me/ }).click();

    // The interview questions render.
    await expect(page.getByText("Who is this newsletter for?")).toBeVisible();
    await expect(page.getByText("How do you know they want it?")).toBeVisible();

    // Answer one, then build the brief.
    await page.getByPlaceholder("Your answer (optional)…").first().fill("The 40 houses on my block");
    await page.getByRole("button", { name: "Build the brief" }).click();

    await expect(page.getByText("A weekly street newsletter for your block.")).toBeVisible();
    await expect(page.getByText("Make it:")).toBeVisible(); // universal refine row

    // Save as note flips to Saved.
    await page.getByRole("button", { name: "Save as note" }).click();
    await expect(page.getByRole("button", { name: "Saved" })).toBeVisible();
  });

  test("quick pass skips the interview and goes straight to a brief", async ({ page }) => {
    await mockBrief(page);
    await page.goto("/tools/brainstorm");

    await page.getByPlaceholder(/Describe your idea/).fill("An app to water my plants");
    await page.getByRole("button", { name: "Quick pass" }).click();

    await expect(page.getByText("A weekly street newsletter for your block.")).toBeVisible();
    // No interview happened, so there's no "Adjust answers" affordance.
    await expect(page.getByRole("button", { name: "Adjust answers" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Start over" })).toBeVisible();
  });
});
