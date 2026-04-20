const { test, expect } = require("@playwright/test");

test.describe("VibeVoice site", () => {
  test("desktop homepage renders primary content and resources", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveTitle(/VibeVoice ASR & Realtime TTS \| Open-Source Voice AI/i);
    await expect(page.locator("h1")).toHaveText("VibeVoice ASR and realtime TTS in one open-source voice AI overview.");
    await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /VibeVoice ASR, VibeVoice Realtime/i);
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute("href", "https://vibevoice.lol/");
    await expect(page.locator('meta[property="og:site_name"]')).toHaveAttribute("content", "VibeVoice");
    await expect(page.getByText("Independent editorial guide to the public VibeVoice release materials")).toBeVisible();

    await expect(page.getByRole("link", { name: "Try ASR Playground" })).toHaveAttribute("href", "https://aka.ms/vibevoice-asr");
    await expect(page.getByRole("link", { name: "View on GitHub" })).toHaveAttribute("href", "https://github.com/microsoft/VibeVoice");

    const modelCards = page.locator("[data-model-card]");
    await expect(modelCards).toHaveCount(3);
    await expect(modelCards.nth(0).getByText("VibeVoice-ASR-7B", { exact: true })).toBeVisible();
    await expect(modelCards.nth(1).getByText("VibeVoice-Realtime-0.5B", { exact: true })).toBeVisible();
    await expect(modelCards.nth(2).getByText("VibeVoice-TTS-1.5B", { exact: true })).toBeVisible();
    await expect(page.getByText("Research notice: synthetic speech systems can be misused")).toBeVisible();

    const ogCard = await page.request.get("/assets/brand/og-card.png");
    expect(ogCard.ok()).toBe(true);

    const favicon = await page.request.get("/assets/brand/favicon.png");
    expect(favicon.ok()).toBe(true);

    const appleTouch = await page.request.get("/assets/brand/apple-touch-icon.png");
    expect(appleTouch.ok()).toBe(true);

    const healthz = await page.request.get("/healthz");
    expect(healthz.ok()).toBe(true);
    await expect(healthz.json()).resolves.toEqual({ ok: true });

    const appConfig = await page.request.get("/app-config.js");
    expect(appConfig.ok()).toBe(true);
    const appConfigText = await appConfig.text();
    expect(appConfigText).toMatch(/window\.__SITE_CONFIG__ = \{/);
    expect(appConfigText).toMatch(/siteUrl: "https:\/\/vibevoice\.lol"/);
    expect(appConfigText).toMatch(/gaMeasurementId: ""/);

    const schemaTypes = await page.locator('script[type="application/ld+json"]').evaluateAll((nodes) =>
      nodes
        .map((node) => JSON.parse(node.textContent || "{}"))
        .map((payload) => payload["@type"])
    );
    expect(schemaTypes).toEqual(expect.arrayContaining(["WebSite", "CollectionPage", "ItemList", "FAQPage"]));

    const loadedImages = await page.evaluate(() =>
      Array.from(document.images).every((image) => image.complete && image.naturalWidth > 0)
    );
    expect(loadedImages).toBe(true);

    await expect(page.locator('script[src*="googletagmanager.com"]')).toHaveCount(0);
    await expect(page.locator('script[src*="clarity.ms"]')).toHaveCount(0);
  });

  test("mobile layout keeps navigation and content within viewport", async ({ browser }) => {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true
    });
    const page = await context.newPage();

    await page.goto("/");

    await expect(page.locator("h1")).toBeVisible();
    await expect(page.getByRole("button", { name: "Menu" })).toBeVisible();
    await page.getByRole("button", { name: "Menu" }).click();
    await expect(page.getByRole("link", { name: "Capabilities" })).toBeVisible();
    await page.getByRole("link", { name: "Capabilities" }).click();
    await expect(page.locator("#capabilities")).toBeInViewport();
    await expect(page.locator("[data-model-card]")).toHaveCount(3);

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(1);

    await context.close();
  });
});
