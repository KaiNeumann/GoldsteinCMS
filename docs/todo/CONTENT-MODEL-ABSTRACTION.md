# Design Document — Content Model Abstraction

**Status:** Proposed  
**Date:** 2026-06-12  
**Goal:** Replace the current Goldsteinfreunde-centric `SiteConfig` fields with a schema-driven content model that can be configured per customer while staying aligned with the existing page/content editing workflow.

---

## 1. Motivation

GoldsteinCMS is now structurally configurable through `site.json`, but the editable content model is still tied to the original Goldsteinfreunde deployment. The admin settings and `SiteConfig` include fields such as `founded`, `members`, `bankAccount`, `registry`, `board`, and `huettennutzungIntroHtml`. These are useful for an association website, but they do not fit every customer.

For a florist or small business, the relevant fields are different:

- Opening hours
- Owner/operator details
- VAT ID
- Social media links
- Shop/order links
- Service categories
- Newsletter/contact settings
- Legal/commercial details

The current approach requires code changes in `defaultContent.ts`, `Admin.tsx`, page components, widgets, and legal pages for each customer type. That undermines the goal of adapting a deployment mostly through configuration and content.

---

## 2. Current State

### 2.1 Static Structure

`site.json` already controls:

- Navigation
- Sidebar widgets
- Footer columns
- Home blocks
- Hero copy
- Route-to-component mapping

### 2.2 Editable Content

`ContentData` currently contains:

```ts
interface ContentData {
  posts: Post[];
  siteConfig: SiteConfig;
  images: SiteImage[];
}
```

`siteConfig` is a strongly typed, fixed TypeScript interface. This gives good type safety, but it hardcodes one customer profile.

### 2.3 Admin Editing

The settings editor manually renders fields for the fixed `SiteConfig` shape. This makes adding or removing customer-specific fields a code task.

---

## 3. Design Constraints

| Constraint | Rationale |
|---|---|
| Keep deployment simple | Customer-specific customization should still work through static files and the existing storage adapter. |
| Avoid a full database schema system | The CMS is intentionally lightweight and file/KV/Gist based. |
| Preserve existing content | Existing Goldsteinfreunde deployments should be migratable without data loss. |
| Keep admin usable | Editors should see friendly labels, grouped fields, validation, and previews where useful. |
| Keep React components type-safe enough | Fully dynamic schemas reduce compile-time safety, so the dynamic boundary should be deliberate. |
| Support legal pages and widgets | Structured fields should be reusable in page templates, widgets, footer columns, and legal copy. |

---

## 4. Recommended Approach

Use a hybrid model:

1. Keep universal core content types (`posts`, `images`, published metadata).
2. Move customer-specific editable fields into a schema-defined `fields` object.
3. Define field groups and field metadata in `site.json` or a companion `content.schema.json`.
4. Render the admin settings UI from that schema.
5. Keep generic page HTML content as schema fields instead of hardcoded `pageContent` keys.

This keeps the CMS flexible without introducing a database, form-builder dependency, or a large runtime abstraction.

---

## 5. Proposed Content Shape

### 5.1 Stored Content

```ts
interface ContentData {
  version: number;
  posts: Post[];
  images: SiteImage[];
  fields: Record<string, unknown>;
}
```

Example `fields` for Floral Manufaktur:

```json
{
  "site.name": "Floral Manufaktur",
  "site.shortName": "Floral Manufaktur",
  "site.tagline": "Ihr Blumenladen in Bad Nauheim",
  "contact.email": "brodda@floralmanufaktur.de",
  "contact.phone": "06032/2475",
  "contact.fax": "06032/32540",
  "address.street": "Friedberger Straße 11",
  "address.zip": "61231",
  "address.city": "Bad Nauheim",
  "business.owner": "Norbert Brodda",
  "business.vatId": "DE 223012092",
  "openingHours.weekly": [
    { "day": "Montag", "hours": "08:30 bis 18:00 Uhr" },
    { "day": "Dienstag", "hours": "08:30 bis 18:00 Uhr" }
  ],
  "social.instagram": "https://instagram.com/floralmanufaktur",
  "social.facebook": "https://facebook.com/floralmanufaktur",
  "shop.orderUrl": "https://floral-manufaktur.lokalerflorist.de/de",
  "pages.home.introHtml": "<h1>NEU!</h1><p>...</p>",
  "pages.impressum.html": "<h2>Angaben gemäß § 5 TMG</h2><p>...</p>",
  "pages.datenschutz.html": "<h1>Datenschutzerklärung</h1><p>...</p>"
}
```

Using dotted keys keeps the storage format flat and easy to merge. Helper functions can expose nested access where needed.

---

## 6. Schema Definition

### 6.1 Location

Two viable locations:

- `site.json`: best if the schema is considered part of the customer site configuration.
- `content.schema.json`: best if we want to keep structure/config and editable-content schema separate.

Recommendation: start with a top-level `contentSchema` section in `site.json`. If it grows too large, split it into `content.schema.json` later.

### 6.2 Example

```jsonc
{
  "contentSchema": {
    "groups": [
      {
        "id": "site",
        "label": "Allgemein",
        "fields": [
          { "key": "site.name", "label": "Name", "type": "text", "required": true },
          { "key": "site.shortName", "label": "Kurzname", "type": "text", "required": true },
          { "key": "site.tagline", "label": "Untertitel", "type": "text" }
        ]
      },
      {
        "id": "contact",
        "label": "Kontakt",
        "fields": [
          { "key": "contact.email", "label": "E-Mail", "type": "email", "required": true },
          { "key": "contact.phone", "label": "Telefon", "type": "tel" },
          { "key": "contact.fax", "label": "Fax", "type": "text" }
        ]
      },
      {
        "id": "openingHours",
        "label": "Öffnungszeiten",
        "fields": [
          {
            "key": "openingHours.weekly",
            "label": "Wochenplan",
            "type": "list",
            "itemFields": [
              { "key": "day", "label": "Tag", "type": "text", "required": true },
              { "key": "hours", "label": "Öffnungszeiten", "type": "text", "required": true }
            ]
          }
        ]
      },
      {
        "id": "pages",
        "label": "Seiteninhalte",
        "fields": [
          { "key": "pages.home.introHtml", "label": "Startseite", "type": "html", "rows": 14 },
          { "key": "pages.impressum.html", "label": "Impressum", "type": "html", "rows": 20 },
          { "key": "pages.datenschutz.html", "label": "Datenschutz", "type": "html", "rows": 20 }
        ]
      }
    ]
  }
}
```

---

## 7. Field Types

Initial field types should be deliberately small:

| Type | Storage | Admin Control | Notes |
|---|---|---|---|
| `text` | string | input | Default for short values. |
| `textarea` | string | textarea | Plain multi-line text. |
| `html` | string | existing HTML editor | Reuse formatting toolbar and component builder. |
| `email` | string | input type=email | Validate format. |
| `tel` | string | input type=tel | No strict formatting. |
| `url` | string | input type=url | Validate `http`, `https`, `mailto`, `tel` depending on config. |
| `image` | string | image picker/upload | Store URL or data URL. |
| `boolean` | boolean | checkbox/switch | Useful for toggles. |
| `select` | string | select | Fixed options. |
| `list` | array | repeatable item editor | For opening hours, links, team members. |

Defer complex types like nested objects, conditional fields, rich validation expressions, and computed fields until needed.

---

## 8. Rendering Fields In Components

Add a small helper API:

```ts
const { getField, getStringField, getListField } = useContentFields();

const name = getStringField("site.name", "");
const openingHours = getListField<OpeningHour>("openingHours.weekly", []);
```

Widgets and pages should consume fields through helpers instead of directly relying on `siteConfig`.

Examples:

- `ContactWidget` reads `contact.email`, `contact.phone`, `address.*`.
- `BrandColumn` reads `site.name`, `site.tagline`.
- `OpeningHoursWidget` reads `openingHours.weekly`.
- Legal pages read `pages.impressum.html`, `pages.datenschutz.html`.

---

## 9. Relation To Site Configuration

`site.json` should distinguish between:

- Structure: which pages, routes, widgets, footer columns, and navigation items exist.
- Content schema: which editable fields the admin exposes.
- Defaults: optional initial values for a new deployment.

Example:

```jsonc
{
  "navigation": [],
  "pages": {},
  "widgets": [],
  "contentSchema": { "groups": [] },
  "contentDefaults": {
    "site.name": "Floral Manufaktur"
  }
}
```

The stored content should remain the source of truth after initial setup. Defaults are only used when storage is empty or a new field is introduced.

---

## 10. Admin UI Changes

Replace the manually coded settings sections with a schema renderer:

```tsx
<SchemaSettingsEditor schema={site.contentSchema} values={content.fields} />
```

The renderer should support:

- Collapsible groups
- Required-field validation
- Per-field help text
- HTML fields using existing `HtmlField`
- Image fields using existing image upload/library patterns
- Repeatable lists for simple structured data
- Default values from schema/content defaults

This aligns settings editing with the existing content editing approach: fields become data-driven, and HTML remains editable with the existing tools.

---

## 11. Migration Strategy

### 11.1 Additive Phase

Introduce `fields` alongside the existing `siteConfig`:

```ts
interface ContentData {
  posts: Post[];
  siteConfig?: SiteConfig;
  fields?: Record<string, unknown>;
  images: SiteImage[];
}
```

Existing components continue to work.

### 11.2 Migration Helper

Add a migration function that maps old `siteConfig` values to field keys:

```ts
function migrateSiteConfigToFields(siteConfig: SiteConfig): Record<string, unknown>;
```

Example mappings:

| Old Key | New Key |
|---|---|
| `name` | `site.name` |
| `shortName` | `site.shortName` |
| `tagline` | `site.tagline` |
| `email` | `contact.email` |
| `phone` | `contact.phone` |
| `phoneLandline` | `contact.phoneLandline` |
| `address.street` | `address.street` |
| `pageContent.homeWelcomeHtml` | `pages.home.welcomeHtml` |
| `pageContent.impressumHtml` | `pages.impressum.html` |
| `pageContent.datenschutzHtml` | `pages.datenschutz.html` |

### 11.3 Component Migration

Move components one by one from `siteConfig` to `fields`. Keep old fallbacks during the migration only.

### 11.4 Cleanup

Once all components and admin editors use `fields`, remove `siteConfig` from the content shape in the next content version.

---

## 12. Validation

Validation should be schema-driven and run in three places:

- Admin UI before saving settings.
- Server-side publish endpoint before accepting content.
- Migration/default loading when fields are missing.

Initial validation rules:

- `required`
- `type`
- `minLength`
- `maxLength`
- URL protocol allowlist
- image copyright required for image fields if configured

Defer complex regex/custom validation unless a real deployment needs it.

---

## 13. Security And Sanitization

HTML fields should continue to use the existing sanitization path. Schema-defined field types must not allow arbitrary executable code.

Rules:

- No script/style/event-handler fields.
- URL fields should reject `javascript:` URLs.
- HTML fields should use the existing sanitizer.
- Image uploads keep size/type limits.
- Server-side publish validation should reject malformed schema-sensitive content.

---

## 14. Estimated Implementation

| Task | Files | Complexity |
|---|---|---|
| Add content schema types | `src/siteConfig.ts`, `src/content/defaultContent.ts` | Medium |
| Add `fields` storage shape | `defaultContent.ts`, `ContentContext.tsx`, API validation | Medium |
| Build schema settings renderer | `Admin.tsx` or new `SchemaSettingsEditor.tsx` | Medium-High |
| Add field helper hooks | new `src/context/ContentFields.ts` or helper module | Low |
| Migrate widgets/footer/pages | components and pages | Medium |
| Add migration function | content utilities | Low-Medium |
| Update docs/templates | `templates/site.json.example`, user docs | Low |

---

## 15. Open Questions

- Should the schema live inside `site.json` from the start, or should it be split into `content.schema.json` immediately?
- Should page HTML fields be declared manually in the schema, or automatically inferred from `site.pages`?
- Do we need per-field permissions later, or is a single admin role enough?
- Should repeatable lists support drag-and-drop ordering in the first implementation?
- Should content defaults live in `site.json`, `defaultContent.ts`, or a separate customer seed file?

---

## 16. Recommendation

Implement a schema-driven `fields` object as the next content-model step. Keep `siteConfig` during migration, but stop adding new customer-specific fields to the fixed interface. New customer deployments should define their editable fields in `site.json` and use generic widgets/pages that read from field keys.
