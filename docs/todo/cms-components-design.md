# Design Document — Goldsteinfreunde CMS

This document records architectural decisions and design plans for the Goldsteinfreunde website CMS.

---

## Chapter 4: Semantic Standard Components for CMS Content

**Status:** Proposed  
**Date:** 2026-06-11  
**Goal:** Add reusable, semantic UI components (image sliders, lightboxes, galleries, collapsible elements, accordions, submenus) that editors can insert into CMS-managed HTML content via simple markup, without introducing heavy dependencies or significant architecture changes.

### 4.1 Motivation

The CMS currently renders all editor-authored content via `dangerouslySetInnerHTML`. Editors can write basic HTML (headings, paragraphs, lists, links, images, figures), but have no way to create interactive elements like image sliders, lightbox galleries, collapsible sections, or nested navigation menus. Adding these capabilities would significantly improve the content experience for a nature/association website where photo galleries, event details, and structured information are common.

**Current limitations:**
- Images in posts are plain `<figure><img/><figcaption/></figure>` — no lightbox, no gallery grouping
- No way to create image sliders/carousels for event highlights or park photos
- No collapsible FAQ sections or accordion-style content in public pages
- No submenu/dropdown support in navigation (flat only)
- All interactive UI lives in React components; editors cannot create it via the HTML editor

### 4.2 Design Constraints

| Constraint | Rationale |
|---|---|
| **No new npm dependencies** | Single-file bundle (`vite-plugin-singlefile`), no code splitting, minimize bundle size |
| **Works with `dangerouslySetInnerHTML`** | All page content is rendered this way; components must survive this rendering path |
| **Survives HTML sanitization** | Both client-side and server-side sanitizers strip `<script>`, `<style>`, inline `style` attrs, event handlers; custom markup must use allowed elements |
| **Tailwind CSS only** | No CSS modules, SCSS, or CSS-in-JS; all styling via Tailwind utilities or pre-defined classes in `index.css` |
| **Editors write HTML** | Components are triggered by semantic HTML tags/attributes in the editor textarea; the Component Builder generates this HTML visually |
| **Accessible (a11y)** | Semantic HTML, ARIA attributes, keyboard navigation, focus management |
| **Mobile-friendly** | Touch gestures for sliders, responsive layouts, hamburger-compatible submenus |
| **German-language UI** | All visible labels, ARIA labels, and placeholder text in German |

### 4.3 Architecture: DOM Enhancement Pattern

The core approach is **DOM enhancement** — a lightweight JavaScript module that runs after `dangerouslySetInnerHTML` renders the content, finds custom HTML elements, and enhances them with interactivity.

```
Editor writes HTML          React renders via              Enhancement module
with custom tags    →       dangerouslySetInnerHTML   →    finds tags, attaches
                           (plain HTML in DOM)             event listeners, adds
                                                           classes, builds sub-DOM
```

This is the same pattern used by libraries like Alpine.js, and it fits perfectly because:
1. The sanitizer does NOT strip custom HTML elements (only `<script>`, `<style>`, `<iframe>`, etc.)
2. No inline styles or event handlers are needed — all behavior is attached imperatively
3. The HTML stays valid and readable in the editor
4. Components are progressively enhanced — if JS fails, the static content still renders

**Implementation:** A single new file `src/components/cms-enhance.ts` that exports an `enhanceCmsContent(root: HTMLElement)` function. Called from a lightweight React wrapper.

### 4.4 React Integration: `<CmsContent>` Wrapper

To bridge between `dangerouslySetInnerHTML` and the enhancement module, a thin React wrapper is needed:

```tsx
// src/components/CmsContent.tsx
import { useEffect, useRef } from "react";
import { enhanceCmsContent } from "./cms-enhance";

export default function CmsContent({ html }: { html: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      enhanceCmsContent(ref.current);
    }
  }, [html]);

  return (
    <div ref={ref} className="prose" dangerouslySetInnerHTML={{ __html: html }} />
  );
}
```

**Integration points** (each page is a 1-line change):

| File | Current | Change |
|---|---|---|
| `Home.tsx:26` | `<div dangerouslySetInnerHTML=...>` | `<CmsContent html={...} />` |
| `Home.tsx:72` | `<div dangerouslySetInnerHTML=...>` | `<CmsContent html={...} />` |
| `About.tsx:27` | `<div dangerouslySetInnerHTML=...>` | `<CmsContent html={...} />` |
| `Activities.tsx:83` | `<div dangerouslySetInnerHTML=...>` | `<CmsContent html={...} />` |
| `Huettennutzung.tsx:26` | `<div dangerouslySetInnerHTML=...>` | `<CmsContent html={...} />` |
| `Impressum.tsx:22` | `<div dangerouslySetInnerHTML=...>` | `<CmsContent html={...} />` |
| `Datenschutz.tsx:26` | `<div dangerouslySetInnerHTML=...>` | `<CmsContent html={...} />` |
| `Admin.tsx:332,1408` | Preview panels | `<CmsContent html={...} />` |

**Total: ~10 lines changed across 8 files.** All existing content continues to work unchanged — the wrapper is a no-op for standard HTML.

### 4.5 Image Copyright Convention

Every image displayed on the public site **must** carry a copyright/source attribution. This is a legal requirement (UrhG §63) and a project convention already enforced for banner images, about images, and editor-uploaded images.

**Rule:** Every `<img>` inside a CMS component MUST have a corresponding `<figcaption>` with the copyright text, prefixed with 📷.

**Markup pattern:**
```html
<figure>
  <img src="..." alt="Beschreibung" />
  <figcaption>📷 Max Mustermann</figcaption>
</figure>
```

**Where copyright comes from:**
- Images from the **Image Library** (`content.images[]`): copyright is the `SiteImage.copyright` field — already required at upload time
- **Directly uploaded** images: copyright is prompted via `window.prompt()` at upload time — already enforced
- **Static images** (banner, about): copyright is `siteConfig.bannerImageCredit` / `siteConfig.aboutImageCredit` — already required in settings

**In the Component Builder** (section 4.9), image selection always pulls from the Image Library, so copyright is pre-filled automatically. Editors can override it per-image if needed.

**In the enhancement module**, the lightbox reads `<figcaption>` text to display as the caption overlay. If no `<figcaption>` exists, no caption is shown (but no error).

### 4.6 Component Catalog

---

#### 4.6.1 Lightbox (Image Viewer)

**Purpose:** Click any image in CMS content to view it full-screen with caption, navigation, and keyboard support.

**Editor markup:**
```html
<figure>
  <img src="data:image/jpeg;base64,..." alt="Blick vom Goldsteinturm" />
  <figcaption>📷 Blick vom Goldsteinturm auf den Goldsteinpark — Foto: Max Mustermann</figcaption>
</figure>
```

**No special markup needed** — the enhancement module automatically detects `<figure>` elements containing `<img>` and adds lightbox behavior. This is the zero-friction approach: editors already write `<figure>` tags.

**Behavior:**
- Click image → overlay with full-size image, caption, close button
- Left/right arrow buttons for navigation between all lightbox-eligible images on the page
- Keyboard: `Escape` closes, `ArrowLeft`/`ArrowRight` navigate
- Touch: swipe left/right on mobile
- Caption shows `<figcaption>` text if present (including copyright)
- Overlay has semi-transparent backdrop, click backdrop to close

**Technical approach:**
- Use a React portal to render the overlay at `document.body` level (avoids z-index issues with sidebar/header)
- All images on page indexed in an array; track `currentIndex` state
- Pure CSS transitions for open/close (opacity + transform)
- No image preloading needed — Base64 images are already in memory

**Estimated complexity:** Medium (~150 lines)

---

#### 4.6.2 Image Slider / Carousel

**Purpose:** Rotating image showcase — ideal for event highlights, seasonal park photos, or a mini-gallery on the homepage.

**Editor markup:**
```html
<div class="gf-slider" data-autoplay="5000">
  <figure>
    <img src="..." alt="Frühling im Goldsteinpark" />
    <figcaption>📷 Foto: Anna Schmidt / Goldsteinfreunde</figcaption>
  </figure>
  <figure>
    <img src="..." alt="Sommer am Goldsteinturm" />
    <figcaption>📷 Foto: Peter Müller</figcaption>
  </figure>
</div>
```

**Configuration via data attributes:**
| Attribute | Default | Description |
|---|---|---|
| `data-autoplay` | `0` (off) | Auto-advance interval in ms |
| `data-loop` | `true` | Loop back to start/end |
| `data-height` | `auto` | Fixed height (e.g., `"400px"`) |

**Copyright handling:** Each slide is a `<figure>` with `<figcaption>`. Copyright is displayed below the image and shown in the lightbox when a slide is clicked.

**Behavior:**
- Horizontal sliding carousel with CSS `transform: translateX()`
- Left/right arrow buttons (SVG chevrons)
- Dot indicators showing current position
- Click any dot to jump to that slide
- Click image opens lightbox (reuses 4.6.1)
- Caption + copyright shown below image
- Responsive: full-width on mobile, constrained on desktop
- Swipe support on touch devices

**Technical approach:**
- Container with `overflow: hidden`, inner track with `display: flex` and `transition: transform 0.3s`
- Arrow buttons positioned absolute, dot indicators below
- Touch handling via `touchstart`/`touchmove`/`touchend` with threshold
- No `setInterval` for autoplay — use `IntersectionObserver` to pause when off-screen

**Estimated complexity:** Medium-High (~200 lines)

---

#### 4.6.3 Image Gallery

**Purpose:** Grid of thumbnail images, optionally with lightbox grouping.

**Editor markup:**
```html
<div class="gf-gallery" data-columns="3">
  <figure>
    <img src="..." alt="Wanderweg" />
    <figcaption>📷 Wanderweg durch den Goldsteinpark — Foto: Lisa Huber</figcaption>
  </figure>
  <figure>
    <img src="..." alt="Goldsteinturm" />
    <figcaption>📷 Der Goldsteinturm — Foto: Max Mustermann</figcaption>
  </figure>
</div>
```

**Configuration via data attributes:**
| Attribute | Default | Description |
|---|---|---|
| `data-columns` | `3` | Number of columns (`2`, `3`, `4`, or `"auto"` for responsive) |
| `data-lightbox` | `true` | Enable lightbox grouping |

**Copyright handling:** Each image is a `<figure>` with `<figcaption>` containing the copyright. Copyright is shown as a subtle overlay on hover and displayed fully in the lightbox view.

**Behavior:**
- Responsive CSS grid of thumbnails
- `object-cover` with aspect-square
- Click thumbnail → lightbox opens at that image, navigable within this gallery only
- Hover effect: subtle zoom + copyright overlay (bottom of image)
- Lazy loading via `loading="lazy"` on images

**Technical approach:**
- Pure CSS grid via Tailwind classes: `grid grid-cols-{n} gap-4`
- Lightbox integration: gallery assigns a `data-lightbox-group` attribute, lightbox module scopes navigation to that group
- Copyright overlay: absolute-positioned `<figcaption>` with gradient background, visible on hover

**Estimated complexity:** Low-Medium (~100 lines)

---

#### 4.6.4 Collapsible Elements

**Purpose:** Show/hide content sections — ideal for FAQs, detailed explanations, or long content blocks.

**Editor markup:**
```html
<details class="gf-collapsible">
  <summary>Was ist der Goldsteinfreunde e.V.?</summary>
  <p>Der Goldsteinfreunde e.V. ist ein gemeinnütziger Verein...</p>
</details>
```

**No special markup needed** — this uses the native HTML `<details>`/`<summary>` elements, which:
- Are already used in the admin (`Section`/`SubSection` components)
- Survive sanitization (not in the blocked tag list)
- Work without JavaScript (progressive enhancement)
- Are inherently accessible (built-in ARIA roles)

**Behavior:**
- Click `<summary>` to toggle open/closed
- Smooth height animation via CSS `grid-template-rows` trick (no JS needed)
- Animated chevron indicator rotating on open
- Styled to match the green theme

**Technical approach:**
- CSS-only animation using:
  ```css
  .gf-collapsible { display: grid; grid-template-rows: auto 0fr; transition: grid-template-rows 0.3s; }
  .gf-collapsible[open] { grid-template-rows: auto 1fr; }
  .gf-collapsible > :last-child { overflow: hidden; }
  ```
- Enhancement module adds chevron icon and theme classes

**Estimated complexity:** Low (~50 lines CSS + ~30 lines JS enhancement)

---

#### 4.6.5 Accordion (Grouped Collapsibles)

**Purpose:** Multiple collapsible sections where only one is open at a time — ideal for FAQ pages, event schedules, or structured information.

**Editor markup:**
```html
<div class="gf-accordion">
  <details class="gf-accordion-item" open>
    <summary>Frühlingsevents</summary>
    <div>
      <p>15. März — Baumaktion im Goldsteinpark</p>
      <p>2. April — Osterwanderung</p>
    </div>
  </details>
  <details class="gf-accordion-item">
    <summary>Sommerevents</summary>
    <div>
      <p>21. Juni — Sommerfest</p>
      <p>15. August — Wandertag</p>
    </div>
  </details>
</div>
```

**Behavior:**
- Same as collapsible, but clicking one item closes all others in the same group
- Only one section open at a time
- `open` attribute on the first item as default
- Smooth open/close animations

**Technical approach:**
- Enhancement module listens for `toggle` events on `<details>` elements inside `.gf-accordion`
- When one opens, close all siblings
- CSS: same animation as collapsible, plus `border-bottom` separators

**Estimated complexity:** Low (~40 lines JS)

---

#### 4.6.6 Submenus (Dropdown Navigation)

**Purpose:** Nested navigation items — allow editors to create dropdown menus in the site header.

The navigation array in `Layout.tsx` would be extended to support children:

```typescript
const navigation = [
  { label: "Startseite", path: "/" },
  { label: "Über uns", path: "/ueber-uns" },
  {
    label: "Aktivitäten",
    path: "/aktivitaeten",
    children: [
      { label: "Alle Beiträge", path: "/aktivitaeten" },
      { label: "Wandertage", path: "/aktivitaeten#wandertage" },
    ],
  },
  { label: "Hüttennutzung", path: "/huettennutzung" },
];
```

**Behavior:**
- Desktop: hover/click on parent item shows dropdown below
- Mobile: expandable/collapsible nested list in hamburger menu
- Keyboard: `Tab` through items, `Enter`/`Space` opens dropdown, `Escape` closes
- Dropdown has subtle shadow, rounded corners, green-themed styling

**Technical approach:**
- Extend `NavigationItem` type with optional `children` array
- Desktop: CSS `:hover` + `group` utility or `useState` for click-toggle
- Mobile: Nested `<details>`/`<summary>` for expand/collapse
- Dropdown positioned with `absolute` below parent nav item

**Estimated complexity:** Medium (~80 lines modified in Layout.tsx)

---

#### 4.6.7 Callout / Highlight Box

**Purpose:** Styled information box for notices, tips, warnings, or highlights.

**Editor markup:**
```html
<div class="gf-callout" data-type="info">
  <strong>Hinweis:</strong> Der Goldsteinpark ist von April bis Oktober zugänglich.
</div>
```

**Types:** `info` (blue), `warning` (amber), `success` (green), `tip` (purple)

**Behavior:**
- Colored left border + light background tint
- Icon in top-left corner (ℹ️, ⚠️, ✅, 💡)
- Rounded corners, subtle shadow

**Estimated complexity:** Low (~40 lines)

---

#### 4.6.8 Responsive Table Wrapper

**Purpose:** Make HTML tables scrollable on mobile devices.

**Editor markup:**
```html
<div class="gf-table-wrap">
  <table>
    <thead><tr><th>Termin</th><th>Event</th><th>Ort</th></tr></thead>
    <tbody>
      <tr><td>15.03.</td><td>Baumaktion</td><td>Goldsteinpark</td></tr>
    </tbody>
  </table>
</div>
```

**Behavior:**
- On mobile: horizontal scroll with `overflow-x: auto`
- Sticky first column (optional)
- On desktop: normal table display

**Estimated complexity:** Low (~20 lines)

---

### 4.7 File Structure

```
src/
  components/
    CmsContent.tsx          ← NEW: React wrapper (~25 lines)
    cms-enhance.ts          ← NEW: DOM enhancement module (~400 lines)
    ComponentBuilder.tsx    ← NEW: Component builder modal (~350 lines)
    Layout.tsx              ← MODIFIED: submenu support (~80 lines)
  index.css                 ← MODIFIED: component base styles (~80 lines)
  pages/
    Home.tsx                ← MODIFIED: use <CmsContent> (~3 lines)
    About.tsx               ← MODIFIED: use <CmsContent> (~3 lines)
    Activities.tsx          ← MODIFIED: use <CmsContent> (~3 lines)
    Huettennutzung.tsx      ← MODIFIED: use <CmsContent> (~3 lines)
    Impressum.tsx           ← MODIFIED: use <CmsContent> (~3 lines)
    Datenschutz.tsx         ← MODIFIED: use <CmsContent> (~3 lines)
    Admin.tsx               ← MODIFIED: integrate ComponentBuilder (~30 lines)
```

**New code:** ~900 lines (CmsContent + cms-enhance + ComponentBuilder + CSS)
**Modified code:** ~130 lines across existing files
**No new npm dependencies**

### 4.8 Sanitizer Compatibility

The existing sanitizer (`ContentContext.tsx:325-335` and `_shared.ts:235-247`) strips:
- `<script>`, `<style>`, `<iframe>`, `<object>`, `<embed>`, `<form>`, `<video>`, `<audio>`, `<canvas>`, `<svg>`, `<math>`
- Inline `style` attributes
- Inline event handlers (`onclick`, etc.)
- `javascript:` and unsafe `data:` URIs

**Custom elements survive sanitization:** `<details>`, `<summary>`, `<div class="gf-*">`, `<figure>`, `<table>` are all in the allowed tag set. The `class` attribute is not stripped. Data attributes (`data-*`) are not stripped.

No sanitizer changes needed.

### 4.9 Admin Integration: The Component Builder

Instead of a row of toolbar buttons, the editor gets a **Component Builder** — a modern modal/panel that guides editors through selecting, configuring, and inserting components. This follows the existing admin UI patterns (modals, image picker grid, green-themed cards).

#### 4.9.1 Entry Point

A single button in the formatting toolbar, positioned after the existing image buttons:

```
[ Fett ] [ Kursiv ] [ ... ] [ 🖼️ Bibliothek ] [ ⬆️ Upload ] [ 🧩 Baustein ]
```

The "🧩 Baustein" button opens the Component Builder modal. This keeps the toolbar clean — one entry point for all components instead of 6+ individual buttons.

#### 4.9.2 Step 1 — Component Type Selection

A full-screen modal (matching the existing admin modal pattern from `ImagePickerButton`) with a visual grid of component cards:

```
┌─────────────────────────────────────────────────────────┐
│  Baustein einfügen                              [ ✕ ]  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │  🖼️      │  │  🎠      │  │  📋      │             │
│  │ Galerie  │  │ Slider   │  │ Aufklapp-│             │
│  │          │  │          │  │ bar      │             │
│  │ Bilder   │  │ Bilder   │  │ Text     │             │
│  │ im Raster│  │ im Karussell│ │ ein-/aus-│             │
│  └──────────┘  └──────────┘  └──────────┘             │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │  ❓      │  │  ℹ️      │  │  📊      │             │
│  │ Akkordeon│  │ Hinweis- │  │ Tabelle  │             │
│  │          │  │ box      │  │          │             │
│  │ Nur ein  │  │ Info,    │  │ Responsive│            │
│  │ Section  │  │ Warnung, │  │ Tabellen │             │
│  │ offen    │  │ Tipp     │  │ auf Mobil│             │
│  └──────────┘  └──────────┘  └──────────┘             │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Card design:**
- White card with subtle border, rounded corners
- Large emoji icon centered at top
- Bold title below icon
- 1-line description in gray
- Hover: border turns green (`#2d6a1e`), subtle shadow lift
- Click: proceeds to Step 2

This matches the visual language of the existing admin tabs and settings sections.

#### 4.9.3 Step 2 — Configuration Forms

Each component type has a tailored configuration form. The modal content transitions with a slide animation.

**Galerie (Image Gallery):**

```
┌─────────────────────────────────────────────────────────┐
│  ← Zurück    Galerie konfigurieren              [ ✕ ]  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Spalten:  [ 2 ] [ ●3 ] [ 4 ] [ Auto ]                │
│                                                         │
│  Bilder:                                                 │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌──── ┐          │
│  │  📷     │ │  📷     │ │  📷     │ │  +  │          │
│  │ Max M.  │ │ Anna S. │ │ Peter M.│ │     │          │
│  │   ✕     │ │   ✕     │ │   ✕     │ │     │          │
│  └─────────┘ └─────────┘ └─────────┘ └──── ┘          │
│                                                         │
│  Copyright wird automatisch aus der Bibliothek über-    │
│  nommen. Einzelne Nachweise können bearbeitet werden.   │
│                                                         │
│  [ Galerie einfügen ]                                   │
└─────────────────────────────────────────────────────────┘
```

- **Column selector:** Pill-button group (matches existing toggle patterns)
- **Image grid:** Thumbnail grid reusing the existing `content.images[]` library
  - Each selected image shows as a thumbnail with copyright name below
  - ✕ button to remove from selection
- **"+" button:** Opens the existing image picker dropdown (or triggers file upload)
- **Copyright:** Pre-filled from `SiteImage.copyright`; shown as subtle text below each thumbnail; click to edit inline
- **Drag to reorder:** Optional — could be Phase 2; initially, images are in selection order

**Slider (Image Carousel):**

```
┌─────────────────────────────────────────────────────────┐
│  ← Zurück    Slider konfigurieren              [ ✕ ]  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Autoplay:  [ Aus ] [ 3s ] [ ●5s ] [ 8s ] [ 10s ]    │
│                                                         │
│  Bilder (wie Galerie — gleiche Bilderauswahl):          │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌──── ┐          │
│  │  📷     │ │  📷     │ │  📷     │ │  +  │          │
│  │ Max M.  │ │ Anna S. │ │ Peter M.│ │     │          │
│  └─────────┘ └─────────┘ └─────────┘ └──── ┘          │
│                                                         │
│  Vorschau:                                              │
│  ┌──────────────────────────────────────┐              │
│  │  ←  [    Bild 1 von 3    ]  →       │              │
│  │     📷 Max Mustermann                │              │
│  └──────────────────────────────────────┘              │
│                                                         │
│  [ Slider einfügen ]                                    │
└─────────────────────────────────────────────────────────┘
```

- **Autoplay selector:** Pill-button group with options (Aus, 3s, 5s, 8s, 10s)
- **Image selection:** Same grid pattern as Gallery
- **Live preview:** Small inline preview showing the first slide with navigation arrows — gives editors immediate visual feedback
- **Copyright:** Same as Gallery — pre-filled from library

**Aufklappbar (Collapsible):**

```
┌─────────────────────────────────────────────────────────┐
│  ← Zurück    Aufklappbar konfigurieren        [ ✕ ]  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Titel:  [ Was ist der Goldsteinfreunde e.V.?      ]  │
│                                                         │
│  Inhalt:                                                │
│  ┌───────────────────────────────────────────────────┐ │
│  │ Der Goldsteinfreunde e.V. ist ein gemeinnütziger │ │
│  │ Verein, der sich für den Erhalt des Goldstein-   │ │
│  │ parks einsetzt...                                 │ │
│  │                                                   │ │
│  └───────────────────────────────────────────────────┘ │
│  [ Fett ] [ Kursiv ] [ Link ] [ 🖼️ Bild ]             │
│                                                         │
│  [ Aufklappbar einfügen ]                               │
└─────────────────────────────────────────────────────────┘
```

- **Title:** Single-line text input
- **Content:** Mini rich-text editor (reuse the existing `HtmlField` pattern with formatting toolbar)
- No image selection needed — content is free-form HTML

**Akkordeon (Accordion):**

```
┌─────────────────────────────────────────────────────────┐
│  ← Zurück    Akkordeon konfigurieren           [ ✕ ]  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─ Abschnitt 1 ──────────────────────────── [▼] [✕] │
│  │  Titel: [ Frühlingsevents                      ]  │
│  │  Inhalt: [ <p>15. März — Baumaktion...</p>    ]  │
│  └─────────────────────────────────────────────────────┘│
│                                                         │
│  ┌─ Abschnitt 2 ──────────────────────────── [▼] [✕] │
│  │  Titel: [ Sommerevents                         ]  │
│  │  Inhalt: [ <p>21. Juni — Sommerfest...</p>     ]  │
│  └─────────────────────────────────────────────────────┘│
│                                                         │
│  [ + Abschnitt hinzufügen ]                             │
│                                                         │
│  [ Akkordeon einfügen ]                                 │
└─────────────────────────────────────────────────────────┘
```

- **Collapsible sections:** Each section has title + content, with ▼ to expand/collapse
- **Add/remove:** "+ Abschnitt" button at bottom, ✕ to remove individual sections
- **Content:** Same mini rich-text editor pattern
- **Default open:** Checkbox for which section starts open

**Hinweisbox (Callout):**

```
┌─────────────────────────────────────────────────────────┐
│  ← Zurück    Hinweisbox konfigurieren          [ ✕ ]  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Typ:  [ ℹ️ Info ] [ ⚠️ Warnung ] [ ✅ Erfolg ] [ 💡 Tipp ]│
│                                                         │
│  Vorschau:                                              │
│  ┌───────────────────────────────────────────────────┐ │
│  │ ℹ️ Hinweis: Der Goldsteinpark ist von April bis  │ │
│  │ Oktober zugänglich.                               │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  Inhalt:                                                │
│  ┌───────────────────────────────────────────────────┐ │
│  │ Der Goldsteinpark ist von April bis Oktober      │ │
│  │ zugänglich.                                       │ │
│  └───────────────────────────────────────────────────┘ │
│                                                         │
│  [ Hinweisbox einfügen ]                                │
└─────────────────────────────────────────────────────────┘
```

- **Type selector:** Visual pill-button group with icons and labels, color-coded
- **Live preview:** Shows the callout box with the selected type styling
- **Content:** Plain text or mini rich-text editor

**Tabelle (Table):**

```
┌─────────────────────────────────────────────────────────┐
│  ← Zurück    Tabelle konfigurieren             [ ✕ ]  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Spalten:  [ + Spalte ]  Zeilen: [ + Zeile ]           │
│                                                         │
│  ┌──────────────┬──────────────┬──────────────┐        │
│  │ Termin       │ Event        │ Ort          │        │
│  ├──────────────┼──────────────┼──────────────┤        │
│  │ 15.03.       │ Baumaktion   │ Goldsteinpark│        │
│  │ 02.04.       │ Osterwanderung│ Goldsteinturm│       │
│  └──────────────┴──────────────┴──────────────┘        │
│                                                         │
│  [ Tabelle einfügen ]                                   │
└─────────────────────────────────────────────────────────┘
```

- **Inline editable table:** Click cells to edit directly (contenteditable or input overlays)
- **Add row/column buttons:** "+" at the bottom and right edge
- **Remove:** Right-click context menu or ✕ on hover for rows/columns
- **Header row:** First row is automatically a `<th>` row (bold, slightly different background)

#### 4.9.4 HTML Generation

Each configuration form generates the final HTML string and inserts it at the cursor position in the textarea, using the same `insertHtml` pattern already used by `FormatBtn` and `ImagePickerButton`.

**Gallery example output:**
```html
<div class="gf-gallery" data-columns="3">
  <figure>
    <img src="data:image/jpeg;base64,..." alt="Wanderweg" />
    <figcaption>📷 Wanderweg durch den Goldsteinpark — Foto: Max Mustermann</figcaption>
  </figure>
  <figure>
    <img src="data:image/jpeg;base64,..." alt="Goldsteinturm" />
    <figcaption>📷 Der Goldsteinturm — Foto: Anna Schmidt</figcaption>
  </figure>
</div>
```

**Key rule:** Every `<img>` in generated output MUST have a `<figcaption>` with `📷` prefix and the copyright string. The Component Builder enforces this — the "Einfügen" button is disabled until at least one image is selected (for image components) and all images have copyright text.

#### 4.9.5 Integration into Admin.tsx

The Component Builder integrates into the existing `HtmlField` and `PostEditor` toolbar areas:

**Changes to `Admin.tsx`:**
1. Add `ComponentBuilder.tsx` import
2. Add a "🧩 Baustein" button to the `HtmlFormatBtn` toolbar (after the image buttons)
3. Add state: `const [showBuilder, setShowBuilder] = useState(false)`
4. Render `<ComponentBuilder>` modal when open, with `onInsert(html)` callback
5. The callback calls the existing `insertHtml(html)` function

**Estimated changes:** ~30 lines in `Admin.tsx` (1 button + state + modal render)

The Component Builder component itself is a new file `src/components/ComponentBuilder.tsx` (~350 lines) containing:
- Step 1: Type selection grid
- Step 2: Configuration forms (one per component type)
- HTML generation logic
- Image picker integration (reuses `content.images[]` from `useContent()`)

### 4.10 Implementation Roadmap

| Phase | Component | Effort | Dependencies |
|---|---|---|---|
| **1** | `<CmsContent>` wrapper + `cms-enhance.ts` scaffold | 0.5 day | None |
| **2** | Lightbox (4.6.1) | 1 day | Phase 1 |
| **3** | Gallery (4.6.3) | 0.5 day | Phase 2 (reuses lightbox) |
| **4** | Collapsible + Accordion (4.6.4, 4.6.5) | 0.5 day | Phase 1 |
| **5** | Callout + Table wrapper (4.6.7, 4.6.8) | 0.5 day | Phase 1 |
| **6** | Image Slider (4.6.2) | 1 day | Phase 2 |
| **7** | Submenu navigation (4.6.6) | 1 day | None (independent) |
| **8** | Component Builder modal (4.9) | 2 days | Phases 2-6 |

**Total estimated effort: 7-8 days** for a developer familiar with the codebase.

**Recommended order:** Phase 1 → 4 → 5 → 2 → 3 → 6 → 7 → 8 (backend first, then UI builder last since it depends on all components existing).

### 4.11 Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Enhancement module adds to bundle size | Single-file bundle gets larger | Keep total under 500 lines; no new dependencies |
| Base64 images in sliders/galleries bloat content JSON | Gist size limit (100 MB) reached sooner | Existing 500 KB/image limit already mitigates |
| `<details>` CSS animation inconsistent across browsers | Visual glitch on older browsers | Fallback to no-animation; progressive enhancement |
| Lightbox z-index conflicts with sidebar/header | Lightbox renders behind other elements | Use `z-50` on overlay; render via portal to `document.body` |
| Touch swipe on slider conflicts with page scroll | Poor mobile UX | Only trigger swipe when horizontal angle > 45° |
| Component Builder modal is complex | Large new component (~350 lines) | Keep each config form as a sub-component; reuse existing patterns (image picker, Section/SubSection) |
| Editors forget copyright on images | Legal risk | Enforced in Component Builder (button disabled); image picker pre-fills from library |
| Component Builder depends on all components being built | Can't test builder until components exist | Build builder last (Phase 8); test components individually via manual HTML in textarea |

### 4.12 Summary

This design adds 8 semantic CMS components with a **Component Builder** editor UI using a **DOM enhancement pattern**:

**Frontend components:**
- Lightbox, Image Slider, Image Gallery (with copyright on every image)
- Collapsible, Accordion
- Callout box, Responsive table wrapper
- Submenu navigation

**Editor experience:**
- Single "🧩 Baustein" button opens a modern modal builder
- Visual card-based component type selection
- Tailored configuration forms per component type
- Integrated image library picker with pre-filled copyright
- Live preview for callouts and sliders
- One-click insert at cursor position

**Technical characteristics:**
- **No new npm dependencies**
- ~900 lines new code + ~130 lines modified
- Uses **native HTML elements** where possible
- **Progressively enhanced** — works without JavaScript
- Survives the existing **HTML sanitizer**
- **Accessible** (keyboard nav, ARIA, semantic HTML)
- **Copyright enforced** — every image carries a `<figcaption>` with 📷 attribution

The highest-impact components (lightbox, gallery, collapsible) can be implemented in the first 2 days. The Component Builder UI is the final phase, tying everything together with a polished editor experience.
