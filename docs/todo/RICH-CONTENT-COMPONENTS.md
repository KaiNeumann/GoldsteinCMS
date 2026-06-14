# Design Document — Rich Content Components

**Status:** Proposed  
**Date:** 2026-06-12  
**Goal:** Add reusable CMS components for embedded YouTube videos, embedded PDF readers, and card-like content sections such as service overview grids and process-step cards.

---

## 1. Motivation

GoldsteinCMS already supports editor-authored HTML, galleries, sliders, lightboxes, accordions, callouts, and responsive tables. Customer sites will also need richer content blocks that are common on small business websites:

- Embedded videos for introductions, product demos, event recaps, tutorials, and testimonials.
- Embedded PDF readers for menus, flyers, price lists, brochures, regulations, forms, and event programs.
- Card grids for services, product categories, process steps, team members, links, and landing-page overviews.

The ZAHRT reference page shows two practical card use cases:

- Process cards: "Schritt 1", "Schritt 2", etc. with image/icon, title, and explanatory text.
- Service overview cards: image-backed cards for categories such as Wandschränke, Badmöbel, Dachschrägenmöbel, Hängeboards, Kleiderschränke, Kommoden, Regale, and Sideboards.

These components should be editor-friendly, responsive, accessible, and compatible with the existing DOM enhancement pattern.

---

## 2. Scope

### In Scope

- YouTube embed component with consent-aware loading.
- PDF reader/download component.
- Card grid component for service/category overviews.
- Process/step card component.
- Component Builder support for these components.
- Sanitization rules for safe CMS markup.

### Out Of Scope

- General arbitrary iframe embeds.
- Video hosting or transcoding.
- PDF editing, annotations, signatures, or form filling.
- Full page-builder layout system.
- Dynamic filtering/searching of cards in the first version.

---

## 3. Design Constraints

| Constraint | Rationale |
|---|---|
| No arbitrary scripts | CMS content must not execute user-provided JavaScript. |
| Consent before external requests | YouTube embeds must not load before consent. |
| Mobile-first | Cards, videos, and PDFs must work on small screens. |
| Progressive enhancement | Content remains understandable if JavaScript fails. |
| Editor-friendly markup | Component Builder should generate the markup; advanced editors can still read/edit it. |
| No heavy viewer dependency initially | PDF support should use browser-native capabilities first. |

---

## 4. YouTube Video Embed

### 4.1 Component

Add a consent-aware YouTube component:

```tsx
<YouTubeEmbed videoId="dQw4w9WgXcQ" title="Vorstellung der Floral Manufaktur" />
```

It should internally use the consent system's `ConsentEmbed` component and load from `https://www.youtube-nocookie.com/embed/...` rather than regular `youtube.com` where possible.

### 4.2 CMS Markup

```html
<div
  class="gf-youtube"
  data-video-id="dQw4w9WgXcQ"
  data-title="Vorstellung der Floral Manufaktur"
  data-aspect="16:9">
  <p><a href="https://www.youtube.com/watch?v=dQw4w9WgXcQ">Video auf YouTube ansehen</a></p>
</div>
```

Fallback content inside the element remains visible if JavaScript is unavailable.

### 4.3 Behavior

- Before consent: show a placeholder with title, provider notice, and buttons.
- Actions: `Einmalig laden`, `YouTube dauerhaft erlauben`, optional direct YouTube link.
- After consent: render an iframe using `youtube-nocookie.com`.
- Support aspect ratios: `16:9`, `4:3`, `1:1`, `9:16`.
- Add `loading="lazy"` to iframe.
- Add meaningful `title` attribute.

### 4.4 Sanitization

Allowed attributes:

- `data-video-id`
- `data-title`
- `data-aspect`
- `data-start`

Validation:

- `videoId` must match YouTube's safe ID shape: letters, numbers, `_`, `-`.
- `start` must be numeric seconds.
- Do not allow arbitrary iframe `src` in CMS content.

### 4.5 Consent Integration

The cookie consent config should include a `youtube` service under `externalMedia`. The YouTube component should refuse to load if the service is not configured, unless consent is disabled site-wide.

---

## 5. Embedded PDF Reader

### 5.1 Component

Add a PDF embed component:

```tsx
<PdfEmbed src="/downloads/preisliste.pdf" title="Preisliste" />
```

Initial implementation should use native browser PDF rendering through `<object>` or `<iframe>`, plus a clear download fallback.

### 5.2 CMS Markup

```html
<div
  class="gf-pdf"
  data-src="/downloads/preisliste.pdf"
  data-title="Preisliste"
  data-height="700">
  <p><a href="/downloads/preisliste.pdf">PDF herunterladen</a></p>
</div>
```

### 5.3 Behavior

- Show a responsive PDF viewer area on desktop/tablet.
- On small mobile screens, prefer a compact card with title and download/open button if embedded viewing is poor.
- Always show `PDF öffnen` and `PDF herunterladen` links.
- If the PDF fails to render, show fallback content.
- Use `loading="lazy"` where supported.

### 5.4 Source Handling

Supported sources:

- Local/public PDF files, e.g. `/downloads/menu.pdf`.
- Admin-uploaded PDF files if a future file library is added.
- External PDFs only if explicitly allowed and preferably opened as links instead of embedded.

Recommendation: start with same-origin PDFs only. External PDF embedding can leak visitor data to third parties and should be consent-aware if supported later.

### 5.5 File Library Implication

Current GoldsteinCMS has an image library, not a general file library. PDF support can start with static files in `public/downloads`. A future file library could generalize `SiteImage` into `SiteAsset`:

```ts
interface SiteAsset {
  id: string;
  name: string;
  mimeType: string;
  dataUrl?: string;
  url?: string;
  copyright?: string;
  createdAt: string;
}
```

Do not block PDF component implementation on a full asset library.

### 5.6 Sanitization

Validation:

- `data-src` must be same-origin by default.
- Path must end in `.pdf` or have a configured PDF MIME type from an asset library.
- Reject `javascript:`, `data:`, and unknown external hosts.
- `data-height` must be a reasonable numeric value, e.g. `300` to `1200`.

---

## 6. Card Grids

### 6.1 Component

Add a generic card grid component for service overviews, landing pages, and category navigation.

```tsx
<CardGrid variant="service" columns="auto" />
```

The component should render a responsive grid of cards with optional image, eyebrow, title, text, link, and CTA label.

### 6.2 CMS Markup

```html
<div class="gf-card-grid" data-variant="service" data-columns="auto">
  <article class="gf-card">
    <figure>
      <img src="/images/services/hochzeit.jpg" alt="Hochzeitsfloristik" />
      <figcaption>Foto: Floral Manufaktur</figcaption>
    </figure>
    <h3>Hochzeit</h3>
    <p>Floristik für Trauung, Feier und Brautstrauß.</p>
    <a href="/hochzeit">Mehr erfahren</a>
  </article>
  <article class="gf-card">
    <figure>
      <img src="/images/services/trauer.jpg" alt="Trauerfloristik" />
      <figcaption>Foto: Floral Manufaktur</figcaption>
    </figure>
    <h3>Trauer</h3>
    <p>Würdevolle florale Begleitung für den Abschied.</p>
    <a href="/trauer">Mehr erfahren</a>
  </article>
</div>
```

### 6.3 Variants

Initial variants:

| Variant | Use Case | Visual Behavior |
|---|---|---|
| `service` | Service/category overview | Image on top, title/text/link below. |
| `imageOverlay` | Visual landing page cards | Image fills card, text overlays on gradient. |
| `compact` | Footer/sidebar link cards | Smaller spacing, optional image/icon. |
| `feature` | Feature highlights | Larger cards, stronger typography. |

The ZAHRT-style service overview maps best to `service` or `imageOverlay`, depending on whether the text sits below the image or overlays it.

### 6.4 Layout Options

Supported `data-columns` values:

- `auto`: responsive auto-fit grid.
- `2`, `3`, `4`: preferred desktop columns with mobile fallback.

Supported `data-card-aspect` values:

- `auto`
- `1:1`
- `4:3`
- `16:9`

### 6.5 Behavior

- Cards should be keyboard accessible.
- If a card has one primary link, the whole card may become clickable while preserving a real visible link.
- Images should use `loading="lazy"`.
- Figcaptions should be displayed subtly or exposed in lightbox/copyright overlay if images are clickable.
- Cards should not require JavaScript for baseline layout.

### 6.6 Component Builder

The builder should provide:

- Variant selection.
- Column count.
- Add/remove/reorder cards.
- Image selection from image library.
- Title, text, URL, CTA label fields.
- Optional copyright override from selected image.

---

## 7. Process Step Cards

### 7.1 Component

Process steps are a specialized card grid for sections like "So funktioniert es".

```html
<div class="gf-steps" data-columns="4">
  <article class="gf-step">
    <figure>
      <img src="/images/steps/planung.jpg" alt="Möbelstück online planen" />
      <figcaption>Foto: ZAHRT</figcaption>
    </figure>
    <h3>Schritt 1: Möbelstück online planen</h3>
    <p>Mit unserem Online-Möbelplaner planen Sie bequem von zu Hause aus Ihr Wunschmöbel.</p>
  </article>
  <article class="gf-step">
    <figure>
      <img src="/images/steps/pruefung.jpg" alt="Prüfung Ihrer Planung" />
      <figcaption>Foto: ZAHRT</figcaption>
    </figure>
    <h3>Schritt 2: Prüfung Ihrer Planung</h3>
    <p>Wir prüfen Ihre Planung und nehmen bei Bedarf vor Ort Maß.</p>
  </article>
</div>
```

### 7.2 Behavior

- Render as responsive cards or a horizontal/vertical timeline depending on variant.
- Preserve source order for screen readers.
- Optional automatic numbering if `data-numbered="true"`.
- Optional connector line for desktop timeline variant.

### 7.3 Variants

| Variant | Use Case |
|---|---|
| `cards` | Simple responsive step cards. |
| `timeline` | Sequential process with connecting line. |
| `icons` | Compact process steps using icons instead of photos. |

---

## 8. Relationship To Existing Gallery/Slider/Lightbox

Card images should not automatically join the global lightbox unless the card explicitly opts in. Cards often use images as navigation/illustration rather than gallery content.

Add optional attributes:

```html
<div class="gf-card-grid" data-lightbox="false">
```

Default: `false` for cards, `true` for galleries.

---

## 9. Component Builder Integration

Add these component types:

- `youtubeEmbed`
- `pdfEmbed`
- `cardGrid`
- `steps`

Builder UI requirements:

- YouTube: accept full YouTube URL or video ID, parse to safe `videoId`, ask for title.
- PDF: accept same-origin URL/static path initially, ask for title and height.
- Card grid: repeatable card editor with image/title/text/link/CTA.
- Steps: repeatable step editor with optional image/icon/title/text.

Generated markup should be semantic HTML so advanced users can edit it manually.

---

## 10. Cookie Consent Alignment

YouTube belongs to the consent system's `externalMedia` category. The builder should generate YouTube markup that is consent-aware by default.

PDFs are not consent-relevant when served from the same domain. External PDF embeds should either be disallowed initially or handled through the same `ConsentEmbed` mechanism.

Cards are not consent-relevant unless they embed third-party media, which should not be allowed inside cards in the first version.

---

## 11. Accessibility

- YouTube placeholders and iframes need descriptive titles.
- PDF components need open/download links outside the embedded viewer.
- Cards need heading hierarchy that fits the surrounding page.
- Card CTAs must be real links, not only clickable containers.
- Process steps must keep logical source order.
- Do not hide essential card text behind hover-only interactions.

---

## 12. Estimated Implementation

| Task | Files | Complexity |
|---|---|---|
| Add YouTube consent component | `src/components/embeds/YouTubeEmbed.tsx`, consent components | Medium |
| Add CMS YouTube enhancer | `src/components/cms-enhance.ts` | Medium |
| Add PDF embed component | `src/components/embeds/PdfEmbed.tsx` | Low-Medium |
| Add CMS PDF enhancer | `src/components/cms-enhance.ts` | Low-Medium |
| Add card grid CSS/enhancer | `src/index.css`, `cms-enhance.ts` | Medium |
| Add steps CSS/enhancer | `src/index.css`, `cms-enhance.ts` | Medium |
| Extend Component Builder | `src/components/ComponentBuilder.tsx` | Medium-High |
| Add sanitizer rules | client/server sanitizer helpers | Medium |
| Update docs/user guide | `docs/USER-GUIDE.md` | Low |

---

## 13. Implementation Order

1. Card grid and steps, because they are same-origin/static and low legal risk.
2. PDF embed with same-origin source validation.
3. YouTube embed after or alongside the cookie consent implementation.
4. Component Builder support for all four components.
5. Optional file library expansion for PDFs.

---

## 14. Open Questions

- Should card content be stored only as HTML markup, or should reusable card sets be defined as structured fields in the content model?
- Should cards support icons in addition to images in the first implementation?
- Should PDF upload be part of the image library expansion, or remain static-file only for now?
- Should YouTube support playlists, shorts, and start times in the first version?
- Should process steps be a separate component or a preset of `CardGrid`?

---

## 15. Recommendation

Implement cards and process steps as semantic HTML components first, because they cover many customer landing-page needs without external dependencies. Add same-origin PDF embedding next. Add YouTube only through the consent-aware embed path so the CMS does not introduce accidental third-party requests.
