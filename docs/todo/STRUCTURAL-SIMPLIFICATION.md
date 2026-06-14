# Structural Simplification

**Status:** Proposed  
**Date:** 2026-06-13  

---

## Guiding Principle

Simplicity and smallness over an overengineered masterpiece. Every change should reduce code, remove indirection, or eliminate a maintenance burden — not add abstraction layers.

---

## A. Reducing Redundancy / Deduplication

**Verification status:** Confirmed against current code on 2026-06-13.

### A1. Extract shared form utilities

`functions/api/forms/contact.ts` and `newsletter.ts` duplicate:
- `getClientIp()` — identical 6-line function in both files
- `isValidEmail()` — identical regex in both files
- Honeypot logic (`body.website` check + `MIN_SUBMIT_MS` timing)
- Webhook dispatch pattern (`try { fetch } catch { return 500 }`)

**Action:** Move into `functions/api/forms/_shared.ts`.

### A2. Frontend form deduplication

`ContactForm.tsx` and `NewsletterSignup.tsx` share the same structure:
- `SubmitStatus` type
- `validate()` logic
- `handleSubmit` with honeypot, privacy consent, `formConfig` from `site.forms`
- Loading/error state handling

**Action:** Extract a shared `useFormSubmission(config)` hook and a generic `FormShell` component. Each form provides only its specific fields and validation rules.

### A3. Consolidate backup constants

`BACKUP_PREFIX` and `MAX_BACKUPS` are defined in both `functions/api/_shared.ts` and `functions/api/storage/kv.ts`. The KV backend also has a redundant backup cleanup loop that independently enforces the same limit.

**Action:** Define once in `_shared.ts`, import in `kv.ts`. Remove the duplicate cleanup loop.

### A4. Merge `signPayload` into `createSessionToken`

`_shared.ts` has both `signPayload()` and `createSessionToken()`. Both do `importHmacKey` + `sign` + `toBase64Url`. `createSessionToken` should call `signPayload` instead of duplicating the crypto logic.

### A5. Consolidate footer/widget hook composition

Several widgets and footer columns repeat the same field access pattern:
```ts
const { content } = useContent();
const { getStringField } = useContentFields();
const name = getStringField("site.name", content.siteConfig?.name ?? "");
```

Confirmed files:
- `src/components/widgets/QuickInfoWidget.tsx`
- `src/components/widgets/BankAccountWidget.tsx`
- `src/components/widgets/ContactWidget.tsx`
- `src/components/footer/BrandColumn.tsx`
- `src/components/footer/ContactColumn.tsx`

Nuance: `NavColumn.tsx` and `SocialLinksColumn.tsx` do not repeat this pattern.

**Action:** Add a single `useStringField(key, fallback)` helper or simplify `useContentFields()` so consumers no longer need to import both `useContent()` and `useContentFields()` for the common case.

### A6. Extract shared page layout

Page components (Impressum, Datenschutz, About, Huettennutzung) are near-identical:
- Same gradient header with title
- Same `CmsContent` wrapper
- Same repeated Tailwind prose class overrides

Nuance: `About` and `Huettennutzung` include page-specific sections after the CMS content. The shared extraction should cover only the common header/card/content shell and allow children after the main CMS content.

**Action:** Create a `PageLayout` component that takes `title`, optional `subtitle`, optional `contentClassName`, and `children`. Keep page-specific sections in the page files.

### A7. Eliminate triple KV read

`kv.ts` `fetchContent()` calls `get()` then `getWithMetadata()` on the same key — but `getWithMetadata()` already returns the value. `fetchContentWithAudit()` reads and parses a third time.

**Action:** Use `getWithMetadata()` once; derive both value and metadata from the single result.

### A8. Eliminate double Gist fetch

`gist.ts` `fetchContent()` and `fetchContentWithAudit()` make identical GitHub API calls.

**Action:** Have `fetchContent()` delegate to `fetchContentWithAudit()` and destructure out the content.

### A9. Verified Findings And Execution Plan

Verification completed on 2026-06-13.

| Task | Finding | Current Status |
|---|---|---|
| A1 | Backend form utilities duplicated | Confirmed in `functions/api/forms/contact.ts` and `newsletter.ts` |
| A2 | Frontend forms duplicate submission state/validation flow | Confirmed in `ContactForm.tsx` and `NewsletterSignup.tsx` |
| A3 | Backup constants duplicated | Confirmed in `_shared.ts` and `storage/kv.ts`; KV also has duplicate cleanup |
| A4 | Session signing duplicated | Confirmed: `createSessionToken()` duplicates `signPayload()` logic |
| A5 | Field helper access repeated | Confirmed in 3 widgets and 2 footer columns; not present in all footer columns |
| A6 | Page content shell duplicated | Confirmed; page-specific sections require a flexible layout component |
| A7 | KV content read is redundant | Confirmed: `get()` plus `getWithMetadata()` on `content` |
| A8 | Gist content fetch duplicated | Confirmed: `fetchContent()` and `fetchContentWithAudit()` repeat the same GitHub request |

Recommended implementation order:

| Step | Task | Rationale | Verification |
|---|---|---|---|
| 1 | A7: simplify KV reads | Smallest safe backend cleanup | `npm run build` |
| 2 | A8: simplify Gist reads | Smallest safe backend cleanup | `npm run build` |
| 3 | A4: reuse `signPayload()` in session creation | Pure refactor, no behavior change | `npm run build` |
| 4 | A3: export backup constants and remove KV cleanup duplicate | Prevents two independent retention policies | `npm run build` |
| 5 | A1: extract backend form helpers | Reduces duplicated API validation/spam handling | `npm run build` |
| 6 | A5: simplify field helper usage | Low-risk frontend cleanup | `npm run build` and smoke test |
| 7 | A6: extract `PageLayout` | Frontend presentation refactor | `npm run build` and smoke test |
| 8 | A2: frontend form deduplication | Highest Part A risk; do after smaller cleanup | `npm run build` and smoke test |

Proceeding rule: document completion under this section immediately after each subtask lands, including what changed and which verification command passed.

Completed subtasks:
- 2026-06-13: Verified all Part A findings against the current code and recorded the execution plan.
- 2026-06-13: Completed A7. `functions/api/storage/kv.ts` now uses `getWithMetadata()` once per content fetch instead of reading `content` twice. Verification: `npm run build` passed.
- 2026-06-13: Completed A8. `functions/api/storage/gist.ts` now has `fetchContent()` delegate to `fetchContentWithAudit()` so the GitHub fetch/parsing path exists once. Verification: `npm run build` passed.
- 2026-06-13: Completed A4. `createSessionToken()` now reuses `signPayload()` instead of duplicating HMAC signing logic. Verification: `npm run build` passed.
- 2026-06-13: Completed A3. Backup constants now live once in `functions/api/storage/backupConstants.ts`, imported by `_shared.ts` and `storage/kv.ts`. The duplicate KV backup cleanup loop was removed so retention is enforced by `createBackupFiles()` only. Verification: `npm run build` passed.
- 2026-06-13: Completed A1. Added `functions/api/forms/_shared.ts` for `isValidEmail()`, `getClientIp()`, spam/timing suppression, and webhook posting. `contact.ts` and `newsletter.ts` now share those helpers while preserving their existing validation messages and response codes. Verification: `npm run build` passed.
- 2026-06-13: Completed A5. `useContentFields()` now exposes `content`, so repeated consumers use one hook/import instead of composing `useContent()` plus `useContentFields()`. Updated the 3 widgets and 2 footer columns identified in verification. Verification: `npm run build` passed.
- 2026-06-13: Completed A6. Added `src/components/PageLayout.tsx` for the shared gradient page header and card shell. Updated `Impressum`, `Datenschutz`, `About`, and `Huettennutzung` while leaving page-specific content in each page. Verification: `npm run build` passed.
- 2026-06-13: Completed A2. Added `src/components/forms/useFormSubmission.ts` for shared submit status, error handling, validation handoff, submitted-at timestamp, and email validation. Added `src/components/forms/FormStatus.tsx` for shared success/error messages. Updated `ContactForm.tsx` and `NewsletterSignup.tsx` while preserving their field markup and submission behavior. Verification: `npm run build` passed.
- 2026-06-13: Final Part A verification: `npm run build` passed after every subtask. `npm run test:smoke` currently fails because the smoke fixtures/assertions expect the old Goldstein route/content setup while the rendered app uses the current configured route/content set (for example, the public route snapshot shows OpenHands navigation and content instead of the expected `Willkommen im Goldsteinpark` heading). This appears to be a fixture/config mismatch rather than a Part A runtime crash.
- 2026-06-13: Started Part B. Verified current code paths and found an additional data-model issue: `Admin.tsx` called `updateFields()` but `ContentContext` did not expose it.
- 2026-06-13: Completed B1 safe migration step. `ContentContext` now exposes `updateFields()`, normalizes `fields` from migrated `siteConfig` defaults plus stored fields, and sanitizes HTML-like field keys during normalization. `useContentFields()` now supports empty default fallbacks. Simple page/widget/footer/header/form consumers now read migrated values from `fields` instead of directly falling back to `siteConfig`. `siteConfig` remains in `ContentData` for compatibility; it has not been removed yet. Verification: `npm run build` passed.
- 2026-06-13: Completed B2. Server-side `sanitizeContentData()` no longer uses a hardcoded `HTML_KEYS` array. It now collects `type: "html"` field keys from `site.json` when a `contentSchema` exists and also sanitizes field keys matching the existing `.html` / `Html` naming convention. This keeps current deployments safe even when no schema is present. Verification: `npm run build` passed.
- 2026-06-13: Completed B3. `src/pageRegistry.ts` now uses Vite's eager `import.meta.glob("./pages/*.tsx")` to build the component registry from page files automatically. `site.json` still controls routes and component names, but adding an already-existing page component no longer requires manually editing the registry. Verification: `npm run build` passed.
- 2026-06-13: Final Part B verification: `npm run build` passed. `npx tsc --noEmit` was also run; Part B/type issues found during the check were fixed (`vite-env.d.ts`, field consumer cleanup, partial forms config merge). Remaining TypeScript errors are pre-existing strict-mode issues outside Part B: `cms-enhance.ts` element typing, unused values in consent/schema-editor files.
- 2026-06-13: Completed C4. Split `functions/api/_shared.ts` into focused modules under `functions/api/shared/`: `types.ts`, `response.ts`, `session.ts`, `sanitize.ts`, `backup.ts`, and `rateLimit.ts`. `_shared.ts` is now a compatibility barrel that re-exports the same API, so endpoint imports can remain unchanged. Verification: `npm run build` passed.
- 2026-06-13: Progressed C2. Extracted the small React-mounted enhancer group from `src/components/cms-enhance.ts` into `src/components/enhancers/reactMounts.ts`: social links, contact form, newsletter signup, and consent service summary. `cms-enhance.ts` now exports `addCleanupCallback()` and `mountReactComponent()` for enhancer modules. Verification: `npm run build` passed.
- 2026-06-13: Progressed C2 further. Extracted embed-related enhancers into `src/components/enhancers/embeds.ts`: YouTube, PDF, and generic consent embeds. The larger imperative groups (lightbox, slider, gallery/cards/steps, collapsible/accordion/callout/table) remain in `cms-enhance.ts` for a later lower-risk split. Verification: `npm run build` passed.
- 2026-06-13: Completed D Phase 1. Added `marked` and `src/content/renderContent.ts`, then wired `CmsContent` through `renderContent()`. Existing raw HTML continues to work through markdown HTML passthrough. The renderer supports simple shortcodes for existing enhanced components: `{{youtube id="..." title="..." aspect="16:9"}}`, `{{pdf src="/...pdf" title="..." height="700"}}`, `{{contactForm formId="default"}}`, `{{newsletter formId="default"}}`, and `{{socialLinks variant="icons"}}`. The admin editor and stored content format were intentionally not changed yet. Verification: `npm run build` passed.
- 2026-06-13: Completed D Phase 2. The post editor toolbar and legacy settings `HtmlField` toolbar now insert markdown syntax for common formatting (`**bold**`, `_italic_`, headings, lists, links) while keeping underline and image figures as HTML where markdown has no equivalent or the existing CMS behavior depends on semantic figure markup. Labels/help text now describe content as Markdown with HTML passthrough. `SchemaSettingsEditor` previews now use `CmsContent`, so schema-driven HTML fields render markdown and shortcodes consistently.
- 2026-06-13: Completed D shortcode output. `ComponentBuilder` now emits shortcodes for the components supported by the renderer: YouTube, PDF, social links, contact form, and newsletter signup. Complex structured components such as gallery, slider, accordion, card grid, and steps still emit semantic HTML because there is not yet a separate structured component-data store for `{{cardGrid ref="..."}}`-style references.
- 2026-06-13: Completed D Phase 3 baseline sanitization. `renderContent()` now sanitizes the final rendered HTML after markdown parsing and shortcode expansion, closing the gap where markdown links become HTML only at render time. Client and server content normalization also scrub dangerous markdown URL targets such as `javascript:` and `data:` before save/publish. Verification: `npm run build` passed.
- 2026-06-13: Completed structured component store. Added `components?: Record<string, CmsComponent>` to `ContentData`, with `saveComponent()` and `deleteComponent()` exposed by `ContentContext`. `CmsContent` now passes stored components and images into `renderContent()`, and `renderContent()` resolves `{{component id="..."}}` into the existing `gf-*` markup for all builder component types: gallery, slider, collapsible, accordion, callout, table, YouTube, PDF, card grid, steps, social links, contact form, and newsletter signup. `ComponentBuilder` now stores every generated component as structured JSON and inserts only `{{component id="..."}}` into markdown content. Added a simple Admin “Bausteine” tab for listing shortcodes and deleting stored components. Existing raw HTML and direct simple shortcodes remain supported for compatibility. Verification: `npm run build` passed; `npx tsc --noEmit` only reports the pre-existing unused-variable issues in consent files.
- 2026-06-13: Follow-up structural work. Added editing for stored components in the Admin “Bausteine” tab using a small JSON editor for each component's structured data and label. This keeps the component store manageable without building a full page-builder UI.
- 2026-06-13: Follow-up structural work. Explicitly skipped HTML/component migration tooling by decision: this is a new-app path, so existing raw HTML remains compatible but no conversion tool will be built.
- 2026-06-13: Follow-up structural work. Split `ComponentsManager` out of `Admin.tsx` into `src/components/admin/ComponentsManager.tsx`, reducing the Admin god component without a risky full rewrite.
- 2026-06-13: Follow-up structural work. Replaced the hand-rolled client render sanitizer and server publish sanitizer with `sanitize-html`. Existing YouTube/PDF domain-specific validation remains as post-processing on the server. Verification: `npm run build` passed.
- 2026-06-13: Follow-up structural work. Import now accepts the new-app data shape without requiring `siteConfig`; normalization still fills compatibility defaults internally. Full `siteConfig` removal remains a larger follow-up because legacy Admin settings and defaults still reference it. Verification: `npm run build` passed; `npx tsc --noEmit` only reports the pre-existing unused-variable issues in consent files.
- 2026-06-14: Follow-up structural work. Removed hardcoded Goldstein-specific page sections from `About` and `Huettennutzung` so those pages rely on CMS markdown/components rather than built-in board, map, image, and Google Calendar markup.
- 2026-06-14: Follow-up structural work. Removed now-dead `board`, `aboutImage`, and `aboutImageCredit` defaults/Admin settings/migration paths after the public pages stopped using them.
- 2026-06-14: Follow-up structural work. Removed the `sanitize-html` client/server dependency path again to keep the new-app bundle small. Authored raw HTML tags are escaped before markdown parsing/save/publish, dangerous markdown URLs are scrubbed, and interactive markup comes from controlled structured components. The npm dependencies `sanitize-html` and `@types/sanitize-html` were removed. Verification: `npm run build` passed at `611.02 kB` / `171.42 kB gzip`; `npx tsc --noEmit` passed after fixing two pre-existing consent unused-variable errors.
- 2026-06-14: Follow-up structural work. Replaced raw JSON editing in the Admin “Bausteine” tab with the same `ComponentBuilder` UI used to create components. `ComponentBuilder` now supports edit mode for all stored component types and saves back to the same component ID.
- 2026-06-14: Follow-up structural work. Started the Admin/Builder split without a risky rewrite: extracted `AdminAuth` from `Admin.tsx` and moved builder option constants to `src/components/builders/componentBuilderOptions.ts`.
- 2026-06-14: Follow-up structural work. Added a schema-driven page/global settings model to `site.json` and made reusable page components resolve editable markdown content by route (`pages.product.html`, `pages.enterprise.html`, `pages.pricing.html`, `pages.about.html`, `pages.contact.html`). Restored `/admin` as a configured hidden route.
- 2026-06-14: Follow-up structural work. Updated smoke tests from the old Goldstein fixture/routes to the current new-app markdown/routes. Verification: `npx tsc --noEmit`, `npm run build`, and `npm run test:smoke` all passed. Current build output: `613.74 kB` / `172.41 kB gzip`.

---

## B. Unify the Data Model

### B1. Remove the dual `siteConfig` / `fields` model

Current state: every consumer does `content.fields?.["key"] as string || content.siteConfig.fallback`. The migration bridge (`migrateSiteConfig.ts`) adds complexity. Components have mixed access patterns.

**Action:** 
1. Complete the migration to the `fields` model for all consumers.
2. Remove the `siteConfig` field from `ContentData` in the next content version.
3. Remove `migrateSiteConfig.ts` once all deployments have migrated.
4. Components access data solely through `useContentFields()` / `useField()`.

### B2. Hardcoded `HTML_KEYS` in sanitizer

`sanitizeContentData()` in `_shared.ts` maintains a manual list of HTML field keys (`HTML_KEYS`) that must be updated whenever the schema changes. This is tightly coupled and error-prone.

**Action:** Mark HTML fields in the content schema (add a `sanitize: "html"` metadata flag) and walk the schema recursively at save time to find HTML fields, instead of maintaining a hardcoded list.

### B3. Auto-generate `pageRegistry` from `site.json`

`pageRegistry.ts` manually mirrors the `pages` section of `site.json`. Adding a page requires updating both files.

**Action:** Generate the page registry from `site.json` at build time (or use dynamic `import()` keyed by the component name from the config). Remove the manual `pageRegistry.ts`.

---

## C. Split Big Files Into Logical Maintainable Parts

### C1. `Admin.tsx` (~1400 lines) — god component

Contains auth flow, post editor, site settings, image manager, rich text editor, and component builder, all in one file.

**Action:** Split into:
- `AdminAuth.tsx` — login/session UI
- `PostEditor.tsx` — post list + post editing
- `SettingsEditor.tsx` — schema-driven settings (already partially exists as `SchemaSettingsEditor.tsx`)
- `ImageManager.tsx` — image library + upload
- `AdminShell.tsx` — layout, tab navigation, orchestrates the above

### C2. `cms-enhance.ts` (~900 lines) — 14 imperative enhancers

14 enhancer functions in one file. Mixes concerns: lightbox (200 lines), slider (100 lines), React component mounting, CSS class injection, event handling.

**Action:** Split into:
- `enhancers/lightbox.ts`
- `enhancers/slider.ts`
- `enhancers/youtube.ts`
- `enhancers/pdf.ts`
- `enhancers/forms.ts` (contact form, newsletter)
- `enhancers/cards.ts` (card grid, steps)
- `enhancers/misc.ts` (table, callout, gallery, collapsible, accordion, social links, consent summary)
- `enhanceCmsContent.ts` — imports and composes all enhancers

### C3. `ComponentBuilder.tsx` (~1200 lines) — 13 inline builders

13 component builders as inline functions in one component.

**Action:** Split into individual builder modules under `src/components/builders/` (one per component type). `ComponentBuilder.tsx` becomes a registry that imports builders by type key.

### C4. `functions/api/_shared.ts` (~300 lines) — god utility file

Mixes session management, HTML sanitization, rate limiting, backup rotation, cookie helpers, storage selection, and response helpers.

**Action:** Split into:
- `session.ts` — HMAC session creation, validation, cookie helpers
- `sanitize.ts` — HTML sanitization, content data sanitization
- `rateLimit.ts` — login attempt tracking, throttle state
- `response.ts` — `json()`, `isConfigured()`, storage selection
- `backup.ts` — `createBackupFiles()`, backup constants

---

## D. Markdown + Shortcodes (HTML → Markdown Evaluation)

### D1. Should the CMS switch from HTML to markdown editing?

**Current state:** Admins write raw HTML in a textarea. A toolbar injects `<strong>`, `<h3>`, `<ul><li>`, etc. Custom components (YouTube, PDF, cards, forms) are injected as `<div class="gf-xxx" data-...>` HTML snippets. Content is sanitized with a fragile hand-rolled regex sanitizer (~10 passes).

**Assessment:**

| Criterion | HTML (current) | Markdown + shortcodes |
|---|---|---|
| Writing experience | Must know HTML or use toolbar | `**bold**`, `### heading`, `- item` — no HTML knowledge needed |
| Storage readability | Angle-bracket soup in JSON Gist | Human-readable text |
| XSS risk | High — regex sanitizer is fragile | Low — parser emits only safe HTML |
| Custom components | Full HTML blobs | `{{youtube id="abc"}}` one-liners |
| Content portability | Locked to custom HTML dialect | Platform-agnostic markdown |
| Migration effort | — | Medium: one-time HTML→markdown conversion |
| Complex components (CardGrid, Steps) | ComponentBuilder generates HTML | ComponentBuilder still generates shortcodes; rendering is controlled code |

**Recommendation: Yes — switch to markdown + shortcodes, incrementally.**

### D2. Implementation phases

**Phase 1: Add markdown rendering alongside HTML (low risk)**
- Install a lightweight markdown parser (`marked` — ~40KB gzipped, zero dependencies).
- Add `renderContent(source)` that: (a) extracts `{{...}}` shortcodes, (b) renders markdown to HTML, (c) reinserts shortcodes as their `gf-*` div equivalents.
- Change `CmsContent.tsx` to call `renderContent()` before `dangerouslySetInnerHTML`.
- Existing HTML content still works because markdown parsers pass through raw HTML blocks unchanged.

**Phase 2: Switch editor to markdown mode (medium risk)**
- Change toolbar to emit markdown syntax (`**`, `###`, `- `, `[text](url)`).
- Change ComponentBuilder to emit `{{youtube id="..." title="..."}}` instead of raw HTML.
- Run a one-time migration script on all stored content (HTML → markdown for prose, HTML → shortcodes for components).
- ComponentBuilder wizard remains — it just writes a 1-line shortcode instead of 40-line HTML.

**Phase 3: Simplify sanitization (high value)**
- `marked` does not sanitize by itself, so escape authored raw HTML tags before markdown parsing/save/publish.
- Validate shortcode/component attributes at render time in controlled code.
- Keep dangerous markdown URL scrubbing for `javascript:` and `data:` link targets.

### D3. Shortcode syntax

Use `{{componentName key="value" ...}}` — simple, parsed with a single regex, easy for admins to read and edit:

```
{{youtube id="dQw4w9WgXcQ" title="Vorstellung" aspect="16:9"}}
{{pdf src="/downloads/preisliste.pdf" title="Preisliste" height="700"}}
{{cardGrid variant="service" columns="3" ref="card-set-1"}}
{{contactForm formId="default"}}
{{newsletter formId="default"}}
{{socialLinks variant="icons"}}
```

Card grids and steps are data-heavy. Store their data separately (in `fields` or a dedicated key) and reference by ID:

```
{{cardGrid ref="services"}}
```

This avoids embedding multi-line structured data in the shortcode itself.

### D4. What NOT to change

- **Leave `cms-enhance.ts` as-is** (after the split in C2). The enhancer pattern is the correct bridge between stored content and runtime interactivity. Shortcodes render to the same `gf-*` divs that enhancers already handle.
- **Do not try to make all content declarative React.** That would be a complete rewrite with no meaningful simplification.
- **Do not represent complex components in markdown syntax.** The ComponentBuilder wizard is the right UX for creating them — only the output format changes.

### D5. Estimated impact

| Area | Before | After | Change |
|---|---|---|---|
| ComponentBuilder output | 40-line HTML snippet per component | 1-line shortcode | -90% output size |
| Sanitizer (client + server) | ~100 lines regex | ~20 lines defense-in-depth | -80% |
| Content readability in Gist | Unreadable HTML blobs | Human-readable markdown | Qualitative win |
| XSS attack surface | User can write any HTML | User writes markdown; only parser output is HTML | Structural improvement |
| New code | 0 | ~80 lines (renderer + shortcode parser) | +80 lines |

---

## Implementation Priority

| Priority | Task | Category | Effort |
|---|---|---|---|
| 1 | A7: Consolidate triple KV read | A | Low |
| 2 | A8: Eliminate double Gist fetch | A | Low |
| 3 | A4: Merge signPayload into createSessionToken | A | Low |
| 4 | A3: Consolidate backup constants | A | Low |
| 5 | A1: Extract shared form utilities (backend) | A | Low |
| 6 | A5: Add `useField()` helper | A | Low |
| 7 | B2: Remove hardcoded HTML_KEYS | B | Low |
| 8 | A6: Extract `PageLayout` component | A | Low |
| 9 | A2: Frontend form deduplication | A | Medium |
| 10 | B1: Complete fields migration, remove siteConfig | B | Medium |
| 11 | B3: Auto-generate pageRegistry | B | Medium |
| 12 | C2: Split cms-enhance.ts into enhancers/ | C | Medium |
| 13 | C4: Split _shared.ts into focused modules | C | Medium |
| 14 | D1 Phase 1: Add markdown renderer | D | Medium |
| 15 | C1: Split Admin.tsx | C | Medium-High |
| 16 | C3: Split ComponentBuilder.tsx | C | Medium-High |
| 17 | D1 Phase 2: Switch editor to markdown | D | Medium |
| 18 | D1 Phase 3: Simplify sanitization | D | Medium |

Items 1–8 are small, low-risk, and can be done independently. Items 9–11 are medium effort but high value for reducing cognitive load. Items 12–16 are structural splits that improve maintainability without changing behavior. Items 17–18 depend on Phase 1 being complete.
