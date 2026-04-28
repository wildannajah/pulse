import { expect, test } from "@playwright/test";

test("home page renders Pulse heading and Get started button", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "Pulse" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Get started" })).toBeVisible();
});
