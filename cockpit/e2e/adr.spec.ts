import { test, expect, type Page } from "@playwright/test";

// Model-independent: /api/adr-writer (Ollama) and /api/adr (DB writes) are
// route-mocked; /api/adr-lint is deterministic and runs for real, so these
// tests exercise the actual gate.

const fulfill = (body: unknown) => ({
  contentType: "application/json",
  body: JSON.stringify(body),
});

const GOOD_ADR = `# Use SQLite for local persistence

## Context and Problem Statement
The cockpit needs a zero-ops local store for prompts and tasks.

## Decision Drivers
* Zero configuration for colleagues

## Considered Options
* SQLite via Prisma
* Postgres in Docker

## Decision Outcome
Chosen option: "SQLite via Prisma", because it is zero-ops and file-based.

### Consequences
* Good, because backups are a single file copy.
* Bad, because concurrent writers are limited.
`;

const BAD_ADR = `# Rewrite everything in Rust

## Context and Problem Statement
The team wants speed.

## Considered Options
* Rewrite in Rust

## Decision Outcome
Chosen option: "Rewrite in Rust", because it is fast.

### Consequences
* Good, because it will be fast.
`;

async function mockAdrCrud(page: Page, adrs: unknown[] = []) {
  await page.route("**/api/adr", (route) => {
    if (route.request().method() === "POST") {
      return route.fulfill(
        fulfill({
          adr: {
            id: "adr_1",
            title: "Use SQLite for local persistence",
            status: "proposed",
            lintOk: true,
            errors: 0,
            warnings: 0,
            markdown: GOOD_ADR,
            createdAt: "2026-01-01T00:00:00.000Z",
          },
          lint: { ok: true },
        })
      );
    }
    return route.fulfill(fulfill({ adrs }));
  });
}

test.describe("adr writer", () => {
  test("page loads with input and run button", async ({ page }) => {
    await mockAdrCrud(page);
    await page.goto("/tools/adr");
    await expect(page.getByRole("heading", { name: /adr writer/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /^draft adr$/i })).toBeVisible();
  });

  test("a clean draft streams in and passes the gate, then saves", async ({ page }) => {
    await mockAdrCrud(page);
    await page.route("**/api/adr-writer", (route) =>
      route.fulfill({ status: 200, contentType: "text/plain; charset=utf-8", body: GOOD_ADR })
    );
    await page.goto("/tools/adr");
    await page
      .getByPlaceholder(/describe the decision/i)
      .fill("We need a local store; SQLite vs Postgres; we picked SQLite.");
    await page.getByRole("button", { name: /^draft adr$/i }).click();

    await expect(page.getByText("Context and Problem Statement").first()).toBeVisible();
    await expect(page.getByText("GATE PASS")).toBeVisible();

    await page.getByRole("button", { name: /^save adr$/i }).click();
    await expect(page.getByRole("button", { name: /^saved$/i })).toBeVisible();
  });

  test("a draft with one option and no downside is blocked by the gate", async ({ page }) => {
    await mockAdrCrud(page);
    await page.route("**/api/adr-writer", (route) =>
      route.fulfill({ status: 200, contentType: "text/plain; charset=utf-8", body: BAD_ADR })
    );
    await page.goto("/tools/adr");
    await page.getByPlaceholder(/describe the decision/i).fill("rust rewrite");
    await page.getByRole("button", { name: /^draft adr$/i }).click();

    await expect(page.getByText("GATE BLOCK")).toBeVisible();
    await expect(page.getByText(/at least 2 real alternatives/i)).toBeVisible();
    await expect(page.getByText(/no negative consequence/i)).toBeVisible();
  });

  test("surfaces a clear error when the engine is down", async ({ page }) => {
    await mockAdrCrud(page);
    await page.route("**/api/adr-writer", (route) =>
      route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({
          error: "Ollama isn't running. Start it (run `ollama serve`) and try again.",
          reason: "ollama_down",
        }),
      })
    );
    await page.goto("/tools/adr");
    await page.getByPlaceholder(/describe the decision/i).fill("x");
    await page.getByRole("button", { name: /^draft adr$/i }).click();
    await expect(page.getByText(/ollama isn't running/i)).toBeVisible();
  });

  test("saved ADRs list shows lint badge and status", async ({ page }) => {
    await mockAdrCrud(page, [
      {
        id: "adr_9",
        title: "Adopt embeddinggemma for memory ranking",
        status: "accepted",
        lintOk: true,
        errors: 0,
        warnings: 1,
        markdown: GOOD_ADR,
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    ]);
    await page.goto("/tools/adr");
    await expect(page.getByText("Saved ADRs")).toBeVisible();
    await expect(page.getByText("Adopt embeddinggemma for memory ranking")).toBeVisible();
    await expect(page.getByText("gate ✓")).toBeVisible();
  });
});
