# Design Document — Goldsteinfreunde CMS

This document records architectural decisions and design plans for the Goldsteinfreunde website CMS.

---

## Chapter 3: Multi-Customer Site Configuration

**Status:** Implemented  
**Date:** 2026-06-11  
**Goal:** Make the site structure (pages, navigation, blocks, sidebar, footer) configurable per customer deployment via a static config file, so that adapting the CMS for a new customer requires only editing one JSON/JSONC file — not touching React component code.

### 3.1 Motivation

The current CMS is tightly coupled to a single customer ("Goldsteinfreunde Bad Nauheim e.V."). Every structural element is hardcoded:

| Element | Current Location | Hardcoded As |
|---|---|---|
| Navigation items | `Layout.tsx:5-12` | Static array of 6 objects |
| Sidebar widgets | `Layout.tsx:163-254` | Inline JSX (3 widgets) |
| Footer columns | `Layout.tsx:262-306` | Inline JSX (3 columns) |
| Route definitions | `App.tsx:17-25` | 6 `<Route>` elements |
| Page components | `src/pages/*.tsx` | 6 standalone React files |
| Hero banner text | `Layout.tsx:140-144` | Hardcoded German strings |
| Footer credit | `Layout.tsx:299` | Hardcoded author name |

To deploy for another customer, a developer must currently:
1. Create new page components (or modify existing ones)
2. Rewrite the navigation array
3. Restructure the sidebar widgets
4. Adjust the footer layout
5. Update route definitions in `App.tsx`
6. Adapt hero banner content and structure

This is **code-level work** for what is essentially a **configuration change**. The goal is to make site structure declarative: define pages, blocks, and their placement in a config file, and have the layout system render them.

### 3.2 Design Constraints

- **No admin UI for this.** The config is a static file deployed with the build, not edited by end users. It changes rarely (once per customer deployment).
- **Low complexity.** The solution should not introduce a framework, a block registry system, or runtime component resolution. Keep it simple.
- **Git-based deployment stays.** The config file lives in the repo and is deployed via Cloudflare Pages.
- **Existing page components are reusable.** Generic pages (Home with posts, Impressum, Datenschutz) can be reused as-is. Customer-specific pages are new components.
- **Works with the planned theming system** (Chapter 2) and **storage adapters** (Chapter 1).

### 3.3 What Needs to Be Configurable

After analyzing the codebase, these are the structural elements that differ between customers:

**Always varies:**
- Navigation items (labels, paths, order, which are visible)
- Sidebar widgets (which ones, their order, their titles)
- Footer structure (columns, content, credits)
- Which pages exist (and which components render them)

**Sometimes varies:**
- Hero banner text (welcome headline, subtitle)
- Home page blocks (what appears on the landing page and in what order)
- Footer admin link visibility
- Logo path

**Already configurable via content (SiteConfig):**
- Organization name, tagline, contact info, etc. — these stay in `content.json`

### 3.4 Options

#### Option A: `site.json` Config File + Config-Driven Layout

A single `site.json` (or `site.jsonc` for comments) file in the repo root defines the entire site structure. The Layout component reads this config and renders accordingly.

**Config structure:**

```jsonc
{
  // Navigation items shown in header and footer
  "navigation": [
    { "label": "Startseite", "path": "/" },
    { "label": "Über uns", "path": "/ueber-uns" },
    { "label": "Aktivitäten", "path": "/aktivitaeten" },
    { "label": "Hüttennutzung", "path": "/huettennutzung" },
    { "label": "Impressum", "path": "/impressum" },
    { "label": "Datenschutz", "path": "/datenschutz" }
  ],

  // Sidebar widgets (order = render order, omit to hide)
  "sidebar": [
    { "type": "contact" },
    { "type": "bankAccount" },
    { "type": "quickInfo" }
  ],

  // Footer columns (order = render order)
  "footer": {
    "columns": ["brand", "navigation", "contact"],
    "credit": "Website & CMS: Kai Uwe Neumann",
    "showAdminLink": true
  },

  // Home page block layout
  "homeBlocks": ["welcome", "latestPost", "olderPosts"],

  // Hero banner (only shown on home page)
  "hero": {
    "headline": "Willkommen im Goldsteinpark",
    "subtitle": "Gemeinsam für Natur und Umwelt in Bad Nauheim",
    "showTrees": true
  },

  // Available page components (maps route paths to components)
  "pages": {
    "/": { "component": "Home", "title": "Startseite" },
    "/ueber-uns": { "component": "About", "title": "Über uns" },
    "/aktivitaeten": { "component": "Activities", "title": "Aktivitäten" },
    "/huettennutzung": { "component": "Huettennutzung", "title": "Hüttennutzung" },
    "/impressum": { "component": "Impressum", "title": "Impressum" },
    "/datenschutz": { "component": "Datenschutz", "title": "Datenschutz" }
  }
}
```

**How it works:**

1. `site.json` is imported at build time (Vite handles JSON imports)
2. `Layout.tsx` receives the config and renders navigation, sidebar, footer dynamically
3. `App.tsx` reads `pages` from config and generates `<Route>` elements dynamically
4. Page components remain as React files — the config just maps paths to them
5. Sidebar widget types map to existing components (`"contact"` → `<ContactWidget />`, etc.)

**Pros:**
- Single source of truth for site structure
- Familiar JSON format, easy to understand and edit
- No runtime overhead (bundled at build time)
- Existing page components work unchanged
- Config is version-controlled and diffable
- Adding a new customer = copy repo, edit `site.json`, adjust colors (via theming)

**Cons:**
- Still need to create new page components for customer-specific pages
- Sidebar/footer widget library is limited to what's coded
- Config cannot express conditional logic (e.g., "show bank widget only if bankAccount is configured")

**Complexity:** Low. One new file, ~50 lines of config parsing, ~30 lines of changes in Layout.tsx and App.tsx.

---

#### Option B: `site.json` + Slot-Based Block System

Extends Option A with a lightweight "slot" system. Instead of hardcoding sidebar/footer JSX, define named slots that can be filled with block types.

**Config structure (extension of Option A):**

```jsonc
{
  // ...navigation, pages same as Option A...

  // Named slots — each is a list of block references
  "slots": {
    "sidebar": [
      { "block": "contact" },
      { "block": "bankAccount" },
      { "block": "quickInfo" },
      { "block": "customHtml", "title": "Mitglied werden", "html": "<p>...</p>" }
    ],
    "footerLeft": [
      { "block": "brand" }
    ],
    "footerCenter": [
      { "block": "navLinks" }
    ],
    "footerRight": [
      { "block": "contact" }
    ],
    "homeHeader": [
      { "block": "welcome" }
    ],
    "homeBody": [
      { "block": "latestPost" },
      { "block": "olderPosts" }
    ]
  },

  // Block definitions (reusable block types)
  "blockTypes": {
    "contact": { "render": "ContactBlock" },
    "bankAccount": { "render": "BankAccountBlock" },
    "quickInfo": { "render": "QuickInfoBlock" },
    "brand": { "render": "BrandBlock" },
    "navLinks": { "render": "NavLinksBlock" },
    "welcome": { "render": "WelcomeBlock" },
    "latestPost": { "render": "LatestPostBlock" },
    "olderPosts": { "render": "OlderPostsBlock" },
    "customHtml": { "render": "CustomHtmlBlock" }
  }
}
```

**How it works:**

1. Each block type is a small React component (already exist implicitly in Layout.tsx)
2. A `BlockRenderer` component maps `"render": "ContactBlock"` to `<ContactBlock />`
3. Blocks receive their data from `content.siteConfig` via context
4. `customHtml` block allows arbitrary HTML in the config (for customer-specific content)

**Pros:**
- Highly flexible — any combination of blocks in any slot
- New block types are just new React components + config entry
- Customer-specific content (custom HTML blocks) lives in the config
- Clean separation between structure (config) and presentation (block components)

**Cons:**
- More abstraction — introduces a block registry and renderer
- Harder to understand at a glance (indirection layer)
- JSON config becomes more complex with block type definitions
- For 90% of deployments, the simpler Option A is sufficient

**Complexity:** Medium. ~100 lines of new code (block registry, renderer, block components extracted from Layout.tsx).

---

#### Option C: No Config File — Convention-Based with Selective Imports

No config file. Instead, use a thin adapter pattern where each customer deployment creates a `site.config.ts` file that exports typed objects. Components import from this file directly.

**Config structure:**

```typescript
// src/site.config.ts (per-customer, in repo)

export const navigation = [
  { label: "Startseite", path: "/" },
  { label: "Über uns", path: "/ueber-uns" },
  // ...
] as const;

export const sidebarWidgets = ["contact", "bankAccount", "quickInfo"] as const;

export const footerColumns = ["brand", "navigation", "contact"] as const;

export const homeBlocks = ["welcome", "latestPost", "olderPosts"] as const;

export const hero = {
  headline: "Willkommen im Goldsteinpark",
  subtitle: "Gemeinsam für Natur und Umwelt in Bad Nauheim",
  showTrees: true,
} as const;
```

**How it works:**

1. `site.config.ts` is a TypeScript module, not JSON
2. Components import directly: `import { navigation } from "../site.config"`
3. Full type safety — autocomplete, compile-time errors for typos
4. Can use TypeScript features (const assertions, computed values)

**Pros:**
- Full TypeScript type safety
- No JSON parsing or import wrapper needed
- Can use computed values (e.g., `const paths = pages.map(p => p.path)`)
- Feels native to the existing codebase

**Cons:**
- Less portable — requires TypeScript compilation (not a plain data file)
- Cannot be trivially edited by non-developers (though this is a config for developers anyway)
- Mixes config with code (it's a `.ts` file, not a data file)
- Harder to diff and review changes compared to JSON

**Complexity:** Low. Similar to Option A but with TypeScript instead of JSON.

---

#### Option D: Hybrid — `site.json` + TypeScript Type Definitions

Combines the portability of JSON with TypeScript safety. A `site.json` file holds the config, and a `site.config.types.ts` file defines the schema.

**Config structure:**

```jsonc
// site.json
{
  "navigation": [
    { "label": "Startseite", "path": "/" }
  ],
  "sidebar": ["contact", "bankAccount", "quickInfo"],
  "footer": {
    "columns": ["brand", "navigation", "contact"],
    "credit": "Website & CMS: Kai Uwe Neumann",
    "showAdminLink": true
  },
  "homeBlocks": ["welcome", "latestPost", "olderPosts"],
  "hero": {
    "headline": "Willkommen im Goldsteinpark",
    "subtitle": "Gemeinsam für Natur und Umwelt in Bad Nauheim",
    "showTrees": true
  }
}
```

```typescript
// src/siteConfig.ts — loaded and validated at build time
import siteJson from "../site.json";

export type NavigationItem = { label: string; path: string };
export type SidebarWidget = "contact" | "bankAccount" | "quickInfo";
export type FooterColumn = "brand" | "navigation" | "contact";
export type HomeBlock = "welcome" | "latestPost" | "olderPosts";

export interface SiteStructure {
  navigation: NavigationItem[];
  sidebar: SidebarWidget[];
  footer: {
    columns: FooterColumn[];
    credit: string;
    showAdminLink: boolean;
  };
  homeBlocks: HomeBlock[];
  hero: {
    headline: string;
    subtitle: string;
    showTrees: boolean;
  };
}

export const site = siteJson as SiteStructure;
```

**Pros:**
- JSON is easy to edit, diff, and version control
- TypeScript types provide safety and IDE support
- Clean separation: data in JSON, types in TypeScript
- Can add validation logic in the TypeScript module if needed

**Cons:**
- Two files to maintain (JSON + types)
- Slightly more indirection than pure TypeScript (Option C)

**Complexity:** Low. ~40 lines of type definitions, ~20 lines of config loading.

---

### 3.5 Recommendation

**Option D: Hybrid `site.json` + TypeScript types** is the recommended approach.

**Rationale:**

1. **Matches the constraint perfectly.** The user wants a "switchable config file" that is "included in the deployment" and "rarely changes." A JSON file is the most natural fit for this — it's a data file, not a code file, and is trivially editable.

2. **Lowest complexity with highest safety.** The TypeScript type definitions catch errors at build time (wrong key names, missing fields, wrong types) without adding runtime overhead. The JSON is the single source of truth; the types are a compile-time guard.

3. **Easy to adapt for new customers.** Copy the repo, edit `site.json`, adjust theming colors, done. No need to understand React internals.

4. **Aligns with existing design document style.** Both Chapter 1 (storage adapters) and Chapter 2 (theming) follow a similar pattern: define an interface, implement adapters/components, provide a migration path. Option D fits this pattern.

5. **Option A is a close second** if the team prefers to avoid the extra type definition file. It's functionally equivalent but relies on runtime correctness rather than compile-time checks.

**Option B is not recommended** for now. The slot/block system adds abstraction that isn't justified by the current use case. If future customers need highly different layouts, it can be adopted later as an evolution of Option D — the `site.json` schema can be extended to include slot definitions.

**Option C is not recommended** because it mixes config with code. The JSON approach is cleaner for a file that exists purely as configuration.

### 3.6 Implementation Plan

#### Phase 1: Extract Existing Widgets into Components

Before making things config-driven, extract the inline sidebar/footer JSX from `Layout.tsx` into standalone components.

| New File | Extracted From | Lines |
|---|---|---|
| `src/components/widgets/ContactWidget.tsx` | `Layout.tsx:165-200` | ~35 |
| `src/components/widgets/BankAccountWidget.tsx` | `Layout.tsx:203-215` | ~15 |
| `src/components/widgets/QuickInfoWidget.tsx` | `Layout.tsx:217-253` | ~35 |
| `src/components/footer/BrandColumn.tsx` | `Layout.tsx:265-270` | ~10 |
| `src/components/footer/NavColumn.tsx` | `Layout.tsx:271-281` | ~12 |
| `src/components/footer/ContactColumn.tsx` | `Layout.tsx:282-293` | ~12 |

This is a pure refactoring step — no behavior changes, just moving code into separate files. The existing `Layout.tsx` imports these components and renders them exactly as before.

#### Phase 2: Create Config File and Types

| New File | Purpose | Lines |
|---|---|---|
| `site.json` | Site structure config | ~40 |
| `src/siteConfig.ts` | TypeScript types + import | ~40 |

**Default `site.json`** matches the current Goldsteinfreunde structure exactly, so the existing site renders identically before and after.

#### Phase 3: Make Layout Config-Driven

Modify `Layout.tsx` to:
1. Import `site` from `siteConfig.ts`
2. Replace hardcoded `navigation` array with `site.navigation`
3. Replace hardcoded sidebar widgets with a loop over `site.sidebar`, mapping widget types to components
4. Replace hardcoded footer columns with a loop over `site.footer.columns`
5. Replace hardcoded hero text with `site.hero`

Modify `App.tsx` to:
1. Import `site` from `siteConfig.ts`
2. Generate `<Route>` elements from `site.pages` (or keep explicit routes if preferred — the config still defines which pages exist)

**Key decision:** The page components (`Home.tsx`, `About.tsx`, etc.) remain as React files. The config maps routes to component names; a simple lookup object resolves `"Home"` to `<Home />`. This avoids runtime component loading complexity.

```typescript
// src/pageRegistry.ts
import Home from "./pages/Home";
import About from "./pages/About";
import Activities from "./pages/Activities";
import Huettennutzung from "./pages/Huettennutzung";
import Impressum from "./pages/Impressum";
import Datenschutz from "./pages/Datenschutz";
import Admin from "./pages/Admin";

export const pageRegistry: Record<string, React.ComponentType> = {
  Home,
  About,
  Activities,
  Huettennutzung,
  Impressum,
  Datenschutz,
  Admin,
};
```

This is a static import map — no dynamic loading, no magic. Adding a new page means adding the component file and a line to the registry.

#### Phase 4: Make Home Page Config-Driven

Modify `Home.tsx` to:
1. Import `site` from `siteConfig.ts`
2. Render blocks based on `site.homeBlocks` instead of hardcoded order
3. Each block type maps to a sub-component (already extracted in Phase 1 or existing in Home.tsx)

```typescript
const homeBlockMap: Record<string, React.ComponentType> = {
  welcome: WelcomeBlock,
  latestPost: LatestPostBlock,
  olderPosts: OlderPostsBlock,
};

// In render:
{site.homeBlocks.map((block) => {
  const Component = homeBlockMap[block];
  return Component ? <Component key={block} /> : null;
})}
```

### 3.7 New Customer Onboarding Checklist

With this system in place, deploying for a new customer requires:

1. **Fork/copy the repo**
2. **Edit `site.json`** — change navigation items, sidebar widgets, footer columns, hero text, page list
3. **Adjust theming** — edit CSS custom properties (per Chapter 2)
4. **Adjust content** — via the admin panel or by editing `content.json` in storage
5. **Add custom pages** (if needed) — create new React component, add to `pageRegistry`, add route to `site.json`
6. **Deploy** — push to Cloudflare Pages

Steps 1-4 require **zero React code changes** for standard sites. Step 5 is only needed if the customer requires pages that don't map to the existing generic components.

### 3.8 File Changes Summary

| File | Action | Description |
|---|---|---|
| `site.json` | **New** | Site structure configuration (~40 lines) |
| `src/siteConfig.ts` | **New** | TypeScript types and config import (~40 lines) |
| `src/pageRegistry.ts` | **New** | Static component-to-name mapping (~20 lines) |
| `src/components/widgets/ContactWidget.tsx` | **New** | Extracted from Layout.tsx (~35 lines) |
| `src/components/widgets/BankAccountWidget.tsx` | **New** | Extracted from Layout.tsx (~15 lines) |
| `src/components/widgets/QuickInfoWidget.tsx` | **New** | Extracted from Layout.tsx (~35 lines) |
| `src/components/footer/BrandColumn.tsx` | **New** | Extracted from Layout.tsx (~10 lines) |
| `src/components/footer/NavColumn.tsx` | **New** | Extracted from Layout.tsx (~12 lines) |
| `src/components/footer/ContactColumn.tsx` | **New** | Extracted from Layout.tsx (~12 lines) |
| `src/components/Layout.tsx` | **Modified** | Replace hardcoded arrays/JSX with config-driven rendering (~309 → ~200 lines) |
| `src/App.tsx` | **Modified** | Use pageRegistry + site config for routes (~31 → ~40 lines) |
| `src/pages/Home.tsx` | **Modified** | Use homeBlocks config for block order (~110 → ~115 lines) |

**Lines of code estimate:**
- New config/types files: ~100 lines across 3 files
- Extracted widget components: ~120 lines across 6 files
- Modified Layout.tsx: net -109 lines (simplification)
- Modified App.tsx: net +9 lines
- Modified Home.tsx: net +5 lines

**Total new code: ~220 lines across 9 new files.**
**Total modified code: ~95 lines across 3 files (net simplification).**

### 3.9 What Does NOT Change

- **Content structure:** Posts, site config, images — untouched
- **Backend API:** Cloudflare Pages Functions — no changes
- **Admin panel:** All editing functionality — unchanged
- **Page components:** `Home.tsx`, `About.tsx`, `Activities.tsx`, etc. — same components, just config-driven ordering
- **Build configuration:** `vite.config.ts` — JSON imports are native to Vite
- **Routing behavior:** Hash-based routing — preserved
- **Responsive design:** Mobile/desktop layouts — preserved

### 3.10 Alternatives Considered

#### 3.10.1 YAML Config

**What:** Use `site.yaml` instead of `site.json`.

**Pros:** More readable for complex structures, supports comments natively.

**Cons:** Requires a YAML parser dependency (e.g., `js-yaml`). JSON with JSONC comments (`site.jsonc`) is sufficient and has zero dependencies (Vite supports JSONC natively via `@ts-expect-error` or a small plugin).

**Verdict:** Not recommended. JSON/JSONC is simpler and dependency-free.

#### 3.10.2 TOML Config

**What:** Use `site.toml` for the config.

**Pros:** Very readable, designed for configuration.

**Cons:** Requires a parser dependency. Not standard in the JavaScript ecosystem. Adds friction for developers familiar with JSON/TypeScript.

**Verdict:** Not recommended. Adds a dependency without meaningful benefit.

#### 3.10.3 Runtime Component Resolution

**What:** Use `React.lazy()` or dynamic imports to load page components based on config, allowing components to be added/removed without modifying `pageRegistry.ts`.

**Pros:** True plugin-like architecture. New pages can be added by just dropping a file and updating `site.json`.

**Cons:** Breaks the single-file inlined build (dynamic imports create separate chunks). Adds code-splitting complexity. For a site with 5-10 pages, this is unnecessary overhead.

**Verdict:** Not recommended. The static registry is simpler and compatible with the single-file build.

#### 3.10.4 Astro or Similar SSG Migration

**What:** Migrate from Vite+React to an SSG like Astro that has native content collections and layout slots.

**Pros:** Purpose-built for content sites. Native support for config-driven pages, slots, and layouts.

**Cons:** Major rewrite. Loses the admin panel (React-based). Introduces a new framework and build system. Far exceeds the scope of this task.

**Verdict:** Not recommended. The current React SPA approach works well; the goal is to add configurability, not replace the stack.

### 3.11 Interaction with Other Design Documents

| Document | Interaction |
|---|---|
| **Chapter 1: Storage Adapters** | No interaction. Site config is a build-time static file; storage adapters handle runtime content. |
| **Chapter 2: Theming** | Complementary. Theming handles colors/visual tokens; site config handles structure/layout. Both are needed for a complete multi-customer deployment. The config file could reference a theme name if needed. |

### 3.12 Implementation Checklist

- [ ] Extract `ContactWidget` from `Layout.tsx`
- [ ] Extract `BankAccountWidget` from `Layout.tsx`
- [ ] Extract `QuickInfoWidget` from `Layout.tsx`
- [ ] Extract footer columns from `Layout.tsx` into separate components
- [ ] Create `site.json` with current Goldsteinfreunde structure
- [ ] Create `src/siteConfig.ts` with TypeScript types
- [ ] Create `src/pageRegistry.ts` with component-to-name mapping
- [ ] Modify `Layout.tsx` to use config-driven rendering
- [ ] Modify `App.tsx` to use pageRegistry + site config
- [ ] Modify `Home.tsx` to use homeBlocks config
- [ ] Verify existing site renders identically (visual regression)
- [ ] Test adding a hypothetical new page via config only
- [ ] Document new customer onboarding in `DEPLOY.md`

---

*End of Chapter 3.*
