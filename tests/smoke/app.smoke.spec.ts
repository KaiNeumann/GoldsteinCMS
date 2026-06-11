import { test, expect } from "@playwright/test";

const mockContent = {
  posts: [
    {
      id: "smoke-1",
      date: "2026-06-01",
      author: "Smoke Test",
      title: "Smoke Beitrag",
      content: "<p>Smoke Content</p>",
    },
  ],
  siteConfig: {
    name: "Goldsteinfreunde Bad Nauheim e.V.",
    shortName: "Goldsteinfreunde",
    tagline: "Test Tagline",
    email: "info@goldsteinfreunde.de",
    phone: "+49 160 5551160",
    phoneNote: "Test",
    phoneLandline: "+49 6032 3075898",
    address: { street: "Adlerweg 27", zip: "61231", city: "Bad Nauheim" },
    bankAccount: {
      bank: "Sparkasse Oberhessen",
      accountNumber: "270 885 38",
      blz: "518 500 79",
      iban: "DE24518500790027088538",
      bic: "HELADEF1FRI",
    },
    registry: { court: "Amtsgericht Friedberg", number: "VR 2732" },
    board: [{ name: "Gerd Hildebrand", role: "Vorsitzender" }],
    responsibleContent: {
      name: "Kai Uwe Neumann",
      street: "Rohrweihenweg 21",
      zip: "61231",
      city: "Bad Nauheim",
    },
    founded: "Juli 2011",
    members: "über 150",
    bannerImage: "",
  },
  images: [],
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
  await expect(page.getByRole("heading", { name: "Willkommen im Goldsteinpark" })).toBeVisible();
  await expect(page.getByText("Smoke Beitrag")).toBeVisible();

  await page.goto("/#/ueber-uns");
  await expect(page.getByRole("heading", { name: "Über uns" })).toBeVisible();

  await page.goto("/#/aktivitaeten");
  await expect(page.getByRole("heading", { name: "Aktivitäten & Beiträge" })).toBeVisible();

  await page.goto("/#/huettennutzung");
  await expect(page.getByRole("heading", { name: "Hüttennutzung" })).toBeVisible();
  await expect(page.getByText("Google-Kalender laden")).toBeVisible();
  await page.getByRole("button", { name: "Kalender anzeigen" }).click();
  await expect(page.locator('iframe[title="Belegungsplan Hütte"]')).toBeVisible();
});

test("admin login and publish flow works", async ({ page }) => {
  await page.goto("/#/admin");

  await page.getByPlaceholder("Passwort eingeben…").fill("testpasswort");
  await page.getByRole("button", { name: "Anmelden" }).click();
  await expect(page.getByRole("heading", { name: "Admin-Dashboard" })).toBeVisible();

  await page.getByRole("button", { name: "GitHub" }).click();
  await page.getByPlaceholder("z.B. Martina").fill("Kai");
  await page.getByPlaceholder("z.B. Neue Termine ergänzt").fill("Kurze Aktualisierung");
  await page.getByRole("button", { name: "Jetzt veröffentlichen" }).click();

  await expect(page.getByText("erfolgreich auf GitHub veröffentlicht")).toBeVisible();
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

  await page.getByRole("button", { name: "GitHub" }).click();
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

  await page.getByRole("button", { name: "GitHub" }).click();
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
