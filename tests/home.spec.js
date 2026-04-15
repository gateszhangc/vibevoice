const { test, expect } = require("@playwright/test");

test.describe("Artemis II wallpaper site", () => {
  test("desktop homepage renders key content and filters wallpapers", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle(/Artemis II Wallpaper/i);
    await expect(page.locator("h1")).toHaveText("Artemis II Wallpaper");
    await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /publicly released NASA mission imagery/i);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://artemis-2-wallpaper.lol/");

    const wallpaperCards = page.locator(".wallpaper-card");
    await expect(wallpaperCards).toHaveCount(10);
    await expect(page.getByText("Not an official NASA website.")).toBeVisible();

    await page.getByRole("button", { name: "Posters" }).click();
    await expect(page.locator(".wallpaper-card:not([hidden])")).toHaveCount(2);
    await expect(page.locator("[data-results-count]")).toHaveText("Showing 2 wallpapers");

    await page.getByRole("button", { name: "All" }).click();
    await expect(page.locator(".wallpaper-card:not([hidden])")).toHaveCount(10);

    for (const image of await page.locator("img").all()) {
      await image.scrollIntoViewIfNeeded();
    }

    const imagesLoaded = await page.evaluate(() =>
      Array.from(document.images).every((image) => image.complete && image.naturalWidth > 0)
    );
    expect(imagesLoaded).toBe(true);
  });

  test("mobile layout stays within viewport and keeps gallery accessible", async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true
    });
    const page = await context.newPage();

    await page.goto("/");

    await expect(page.locator("h1")).toBeVisible();
    await expect(page.getByRole("link", { name: "Explore the Collection" })).toBeVisible();
    await page.getByRole("link", { name: "Explore the Collection" }).click();
    await expect(page.locator("#gallery")).toBeInViewport();

    const overflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth - window.innerWidth;
    });
    expect(overflow).toBeLessThanOrEqual(1);

    await expect(page.locator(".wallpaper-card")).toHaveCount(10);
    await context.close();
  });
});
