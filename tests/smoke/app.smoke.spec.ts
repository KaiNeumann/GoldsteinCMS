import { test, expect } from "@playwright/test";

const mockContent = {
  posts: [
    {
      id: "smoke-1",
      date: "2026-06-01",
      author: "Smoke Test",
      title: "Smoke Beitrag",
      content: "Smoke Content",
    },
  ],
  fields: {
    "site.name": "OpenHands Smoke",
    "site.shortName": "OpenHands",
    "site.tagline": "Smoke Test Tagline",
    "contact.email": "hello@example.test",
    "pages.home.welcomeHtml": "## Smoke Welcome\n\nMarkdown content for smoke tests.",
    "pages.about.html": "## About Smoke\n\nThe about page is editable markdown.",
    "pages.impressum.html": "## Contact Smoke\n\nhello@example.test",
  },
  images: [],
  components: {},
};

test.beforeEach(async ({ page }) => {
  await page.route("**/api/content", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ data: mockContent, version: "v1" }),
    });
  });

  await page.route("**/api/session", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ authenticated: true }),
    });
  });

  await page.route("**/api/auth", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true }),
    });
  });

  await page.route("**/api/publish", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true, version: "v2" }),
    });
  });

  await page.route("**/api/logout", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ ok: true }),
    });
  });
});

test("public routes render", async ({ page }) => {
  await page.goto("/#/");

  const acceptBtn = page.getByRole("button", { name: "Alle akzeptieren" });
  if (await acceptBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await acceptBtn.click();
  }

  await expect(page.getByRole("heading", { name: "Smoke Welcome" })).toBeVisible();
  await expect(page.getByText("Smoke Beitrag")).toBeVisible();

  await page.goto("/#/about");
  await expect(page.getByRole("heading", { name: "About", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "About Smoke" })).toBeVisible();

  await page.goto("/#/community");
  await expect(page.getByRole("heading", { name: "Aktivitäten & Beiträge" })).toBeVisible();

  await page.goto("/#/contact");
  await expect(page.getByRole("heading", { name: "Contact", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Contact Smoke" })).toBeVisible();
});

test("admin login and publish flow works", async ({ page }) => {
  await page.goto("/#/admin");

  await page.getByPlaceholder("Passwort eingeben…").fill("testpasswort");
  await page.getByRole("button", { name: "Anmelden" }).click();
  await expect(page.getByRole("heading", { name: "Admin-Dashboard" })).toBeVisible();

  await page.getByRole("button", { name: "Veröffentlichen" }).click();
  await page.getByPlaceholder("z.B. Martina").fill("Kai");
  await page.getByPlaceholder("z.B. Neue Termine ergänzt").fill("Kurze Aktualisierung");
  await page.getByRole("button", { name: "Jetzt veröffentlichen" }).click();

  await expect(page.getByText("Inhalte erfolgreich veröffentlicht")).toBeVisible();
});

test("admin publish conflict shows guidance", async ({ page }) => {
  await page.route("**/api/publish", async (route) => {
    await route.fulfill({
      status: 409,
      contentType: "application/json",
      body: JSON.stringify({ error: "Zwischenzeitliche Änderung erkannt. Bitte zuerst 'Von GitHub laden' klicken." }),
    });
  });

  await page.goto("/#/admin");
  await page.getByPlaceholder("Passwort eingeben…").fill("testpasswort");
  await page.getByRole("button", { name: "Anmelden" }).click();
  await expect(page.getByRole("heading", { name: "Admin-Dashboard" })).toBeVisible();

  await page.getByRole("button", { name: "Veröffentlichen" }).click();
  await page.getByPlaceholder("z.B. Martina").fill("Kai");
  await page.getByPlaceholder("z.B. Neue Termine ergänzt").fill("Parallel-Änderung Test");
  await page.getByRole("button", { name: "Jetzt veröffentlichen" }).click();

  await expect(page.getByText("Bitte zuerst 'Von GitHub laden' klicken.")).toBeVisible();
});

test("admin publish with expired session forces logout", async ({ page }) => {
  await page.route("**/api/publish", async (route) => {
    await route.fulfill({
      status: 401,
      contentType: "application/json",
      body: JSON.stringify({ error: "Sitzung abgelaufen. Bitte erneut anmelden." }),
    });
  });

  await page.goto("/#/admin");
  await page.getByPlaceholder("Passwort eingeben…").fill("testpasswort");
  await page.getByRole("button", { name: "Anmelden" }).click();
  await expect(page.getByRole("heading", { name: "Admin-Dashboard" })).toBeVisible();

  await page.getByRole("button", { name: "Veröffentlichen" }).click();
  await page.getByPlaceholder("z.B. Martina").fill("Kai");
  await page.getByPlaceholder("z.B. Neue Termine ergänzt").fill("Session Test");
  await page.getByRole("button", { name: "Jetzt veröffentlichen" }).click();

  await expect(page.getByRole("heading", { name: "Admin-Bereich" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Admin-Dashboard" })).toHaveCount(0);
});

test("login lockout message shown after repeated failures", async ({ page }) => {
  let attempts = 0;
  await page.route("**/api/auth", async (route) => {
    attempts += 1;
    if (attempts < 6) {
      await route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ error: "Falsches Passwort" }),
      });
      return;
    }

    await route.fulfill({
      status: 429,
      contentType: "application/json",
      body: JSON.stringify({ error: "Zu viele Fehlversuche. Bitte in 10 Minute(n) erneut versuchen." }),
    });
  });

  await page.goto("/#/admin");

  for (let i = 0; i < 5; i += 1) {
    await page.getByPlaceholder("Passwort eingeben…").fill("falsch");
    await page.getByRole("button", { name: "Anmelden" }).click();
    await expect(page.getByText("Falsches Passwort")).toBeVisible();
  }

  await page.getByPlaceholder("Passwort eingeben…").fill("falsch");
  await page.getByRole("button", { name: "Anmelden" }).click();
  await expect(page.getByText("Zu viele Fehlversuche")).toBeVisible();
});
