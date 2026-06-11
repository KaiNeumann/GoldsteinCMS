# Design Document — Goldsteinfreunde CMS

This document records architectural decisions and design plans for the Goldsteinfreunde website CMS.

---

## Chapter 2: Theming Support with Dark Mode

**Status:** Implemented  
**Date:** 2026-06-11  
**Goal:** Add switchable CSS theming (including dark mode) to the CMS using CSS Custom Properties and Tailwind 4's `@theme` directive, without introducing new dependencies or significant complexity.

### 2.1 Motivation

The current CMS has a fixed visual style with hardcoded hex colors (`#2d6a1e`, `#1a4d0f`, `#4a8c34`) scattered across ~99 locations in JSX files. There is no mechanism to:

- Switch between light and dark modes
- Adapt to user OS preferences
- Customize the color scheme per deployment
- Maintain visual consistency through design tokens

Adding theming support provides:

- **Accessibility:** Dark mode reduces eye strain and meets user expectations
- **Professional polish:** Theme switching signals a mature, well-maintained application
- **Deployment flexibility:** Customer deployments can adjust colors without code changes
- **Future-proofing:** A token-based system makes visual updates trivial

### 2.2 Current Architecture

**CSS entry point:** `src/index.css` (62 lines)

```css
@import "tailwindcss";

:root {
  --font-body: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --font-heading: Georgia, "Times New Roman", serif;
}

body {
  font-family: var(--font-body);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #333;
}
```

**Color usage pattern:** Colors are applied as hardcoded hex values in Tailwind utility classes:

```tsx
{/* Header gradient */}
<header className="bg-gradient-to-br from-[#1a4d0f] via-[#2d6a1e] to-[#1a4d0f]">

{/* Widget header */}
<div className="bg-[#2d6a1e] px-5 py-3">

{/* Link text */}
<a className="text-[#2d6a1e] hover:underline">

{/* Button */}
<button className="bg-[#2d6a1e] hover:bg-[#1a4d0f]">
```

**Affected files and approximate occurrence counts:**

| File | Hardcoded Color References |
|---|---|
| `src/pages/Admin.tsx` | ~55 |
| `src/components/Layout.tsx` | ~25 |
| `src/pages/Home.tsx` | ~10 |
| `src/pages/Activities.tsx` | ~5 |
| `src/pages/About.tsx` | ~6 |
| `src/pages/Huettennutzung.tsx` | ~4 |
| `src/pages/Impressum.tsx` | ~2 |
| `src/pages/Datenschutz.tsx` | ~2 |
| `src/context/ContentContext.tsx` | ~1 |
| `src/index.css` | ~2 (scrollbar) |

**Total: ~99 hardcoded hex values across 10 files.**

### 2.3 Proposed Architecture

#### 2.3.1 Design Tokens via CSS Custom Properties

All visual tokens are defined as CSS custom properties in `:root`, making them globally available and overridable:

```css
@import "tailwindcss";

@theme {
  /* Primary palette */
  --color-primary: #2d6a1e;
  --color-primary-dark: #1a4d0f;
  --color-primary-light: #4a8c34;

  /* Surfaces */
  --color-surface: #ffffff;
  --color-surface-alt: #f9fafb;
  --color-surface-card: #ffffff;

  /* Text */
  --color-text: #1f2937;
  --color-text-muted: #6b7280;
  --color-text-on-primary: #ffffff;

  /* Borders */
  --color-border: #e5e7eb;
  --color-border-strong: #d1d5db;

  /* Semantic */
  --color-success: #2d6a1e;
  --color-warning: #f59e0b;
  --color-error: #ef4444;

  /* Typography */
  --font-body: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --font-heading: Georgia, "Times New Roman", serif;
}
```

This maps directly to Tailwind utilities: `bg-primary`, `text-text-muted`, `border-border`, etc.

#### 2.3.2 Dark Mode via `prefers-color-scheme` + `data-theme`

Dark mode uses two complementary mechanisms:

1. **Automatic:** CSS media query `prefers-color-scheme: dark` respects OS setting
2. **Manual override:** `data-theme` attribute on `<html>` element allows explicit control

```css
/* Automatic dark mode based on OS preference */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --color-primary: #5cb85c;
    --color-primary-dark: #4a8c34;
    --color-primary-light: #7dd87d;

    --color-surface: #111827;
    --color-surface-alt: #1f2937;
    --color-surface-card: #1f2937;

    --color-text: #f9fafb;
    --color-text-muted: #9ca3af;

    --color-border: #374151;
    --color-border-strong: #4b5563;
  }
}

/* Manual dark mode via data-theme attribute */
:root[data-theme="dark"] {
  --color-primary: #5cb85c;
  --color-primary-dark: #4a8c34;
  --color-primary-light: #7dd87d;

  --color-surface: #111827;
  --color-surface-alt: #1f2937;
  --color-surface-card: #1f2937;

  --color-text: #f9fafb;
  --color-text-muted: #9ca3af;

  --color-border: #374151;
  --color-border-strong: #4b5563;
}
```

**Why two mechanisms?**

- `prefers-color-scheme` handles the common case (follow OS) with zero JavaScript
- `data-theme` handles the explicit override (user clicks "Switch to dark mode")
- The `:root:not([data-theme="light"])` selector ensures manual "light" preference overrides the OS setting

#### 2.3.3 Theme Toggle Component

A small React component manages theme state:

```tsx
// src/components/ThemeToggle.tsx

import { useState, useEffect } from "react";

type Theme = "auto" | "light" | "dark";

const STORAGE_KEY = "goldsteinfreunde-theme";

function getSystemTheme(): "light" | "dark" {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === "auto") {
    root.removeAttribute("data-theme");
  } else {
    root.setAttribute("data-theme", theme);
  }
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    return stored || "auto";
  });

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  // Listen for OS theme changes when in auto mode
  useEffect(() => {
    if (theme !== "auto") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => applyTheme("auto");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme]);

  const cycle = () => {
    setTheme((prev) => {
      if (prev === "auto") return "light";
      if (prev === "light") return "dark";
      return "auto";
    });
  };

  const label = theme === "auto" ? "Automatisch" : theme === "light" ? "Hell" : "Dunkel";
  const icon = theme === "auto" ? "🖥️" : theme === "light" ? "☀️" : "🌙";

  return (
    <button
      onClick={cycle}
      className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg
        bg-white/10 hover:bg-white/20 transition-colors"
      title={`Farbschema: ${label}`}
    >
      <span>{icon}</span>
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
```

**Placement:** The toggle is placed in the header navigation bar, next to the existing navigation items (desktop) or in the mobile menu.

#### 2.3.4 Updated Scrollbar and Prose Styles

Scrollbar and prose styles are updated to use CSS variables:

```css
/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: var(--color-surface-alt);
}

::-webkit-scrollbar-thumb {
  background: var(--color-primary-light);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--color-primary);
}

/* Prose defaults for editor content */
.prose img {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
}

.prose figure {
  margin: 16px 0;
  max-width: 100%;
}

.prose figcaption {
  font-size: 11px;
  color: var(--color-text-muted);
  margin-top: 4px;
  font-style: italic;
  display: block;
}
```

### 2.4 Migration Strategy

#### 2.4.1 Phase 1: Token Foundation

**Files changed:** `src/index.css`

- Add `@theme` block with all design tokens
- Add dark mode media query and `data-theme` overrides
- Update scrollbar and prose styles to use variables

**No visual changes** — tokens are defined but not yet used by components.

#### 2.4.2 Phase 2: Theme Toggle

**Files changed:** `src/components/ThemeToggle.tsx` (new), `src/components/Layout.tsx`

- Create `ThemeToggle` component
- Add toggle to header navigation
- Add initial theme application in `App.tsx` (to avoid flash of unstyled content)

#### 2.4.3 Phase 3: Color Migration

Replace hardcoded hex values with Tailwind utility classes that reference tokens.

**Mapping table:**

| Hardcoded Value | Token | Tailwind Class |
|---|---|---|
| `#2d6a1e` | `--color-primary` | `bg-primary`, `text-primary` |
| `#1a4d0f` | `--color-primary-dark` | `bg-primary-dark`, `text-primary-dark` |
| `#4a8c34` | `--color-primary-light` | `bg-primary-light`, `text-primary-light` |
| `#ffffff` (cards) | `--color-surface-card` | `bg-surface-card` |
| `#f9fafb` | `--color-surface-alt` | `bg-surface-alt` |
| `#333` / `#1f2937` | `--color-text` | `text-text` |
| `#6b7280` | `--color-text-muted` | `text-text-muted` |
| `#e5e7eb` | `--color-border` | `border-border` |

**Migration order** (least to most complex):

1. `src/pages/Datenschutz.tsx` — 2 references
2. `src/pages/Impressum.tsx` — 2 references
3. `src/context/ContentContext.tsx` — 1 reference
4. `src/pages/Huettennutzung.tsx` — 4 references
5. `src/pages/Activities.tsx` — 5 references
6. `src/pages/About.tsx` — 6 references
7. `src/pages/Home.tsx` — 10 references
8. `src/components/Layout.tsx` — 25 references
9. `src/pages/Admin.tsx` — 55 references (largest file, most complex)

#### 2.4.4 Phase 4: Testing

- Verify light mode matches current visual appearance
- Verify dark mode renders correctly on all pages
- Verify theme toggle persists across page reloads
- Verify OS preference is respected in auto mode
- Verify no flash of unstyled content on initial load

### 2.5 File Changes Summary

| File | Action | Description |
|---|---|---|
| `src/index.css` | **Modified** | Add `@theme` tokens, dark mode rules, update scrollbar/prose |
| `src/components/ThemeToggle.tsx` | **New** | Theme toggle component (~50 lines) |
| `src/components/Layout.tsx` | **Modified** | Add toggle to header, replace ~25 hardcoded colors |
| `src/App.tsx` | **Modified** | Add initial theme application on mount |
| `src/pages/Admin.tsx` | **Modified** | Replace ~55 hardcoded colors |
| `src/pages/Home.tsx` | **Modified** | Replace ~10 hardcoded colors |
| `src/pages/About.tsx` | **Modified** | Replace ~6 hardcoded colors |
| `src/pages/Activities.tsx` | **Modified** | Replace ~5 hardcoded colors |
| `src/pages/Huettennutzung.tsx` | **Modified** | Replace ~4 hardcoded colors |
| `src/pages/Impressum.tsx` | **Modified** | Replace ~2 hardcoded colors |
| `src/pages/Datenschutz.tsx` | **Modified** | Replace ~2 hardcoded colors |
| `src/context/ContentContext.tsx` | **Modified** | Replace ~1 hardcoded color |

**Lines of code estimate:**
- Theme tokens and dark mode CSS: ~60 lines
- `ThemeToggle` component: ~50 lines
- `App.tsx` initialization: ~10 lines
- Color replacements: ~99 mechanical changes across 10 files

**Total new code: ~120 lines across 2 new/modified files.**

### 2.6 Open Standards Used

| Standard | Usage | Rationale |
|---|---|---|
| **CSS Custom Properties** (W3C) | Theme token definitions | Native browser feature, no runtime cost, cascading inheritance |
| **Tailwind 4 `@theme`** | Maps CSS variables to utility classes | Already in the stack, no new dependencies |
| **`prefers-color-scheme`** (CSS Media Queries) | Automatic OS-based dark mode | Browser-native, zero JavaScript required |
| **`localStorage`** | Persist user theme preference | Simple, synchronous, sufficient for single-value storage |
| **`data-theme` attribute** | Manual theme override | Clean separation of concerns, works with CSS selectors |

### 2.7 What Does NOT Change

- **Content structure:** Posts, site config, images — all untouched
- **Backend API:** Cloudflare Pages Functions — no changes
- **Routing:** React Router — no changes
- **Build configuration:** `vite.config.ts`, `package.json` — no new dependencies
- **Admin functionality:** All CRUD operations — unchanged
- **Layout structure:** Header, sidebar, footer — same markup, different colors
- **Responsive behavior:** Mobile/desktop breakpoints — preserved

### 2.8 Alternatives Considered

#### 2.8.1 Open Props (open-props.dev)

**What:** A comprehensive library of 400+ design tokens as CSS custom properties.

**Pros:** Battle-tested tokens, consistent naming, covers spacing/typography/shadows/etc.

**Cons:** Adds a dependency for ~10 tokens we actually need. The library's opinionated naming may conflict with Tailwind conventions. Overkill for a site with a single visual identity.

**Verdict:** Not recommended. Our token set is small and well-defined. We can always adopt Open Props later if the design system grows.

#### 2.8.2 CSS Layers (`@layer`)

**What:** CSS specification for controlling cascade order.

**Pros:** Prevents specificity conflicts between theme styles and utility classes.

**Cons:** Tailwind 4 already manages layer ordering internally. Adding custom layers would complicate the CSS without clear benefit for this project.

**Verdict:** Not needed. Tailwind 4's built-in layer system is sufficient.

#### 2.8.3 CSS-in-JS Theming (styled-components, emotion)

**What:** Runtime theme context via JavaScript.

**Pros:** Type-safe tokens, dynamic theme switching, component-level theming.

**Cons:** Adds runtime overhead, increases bundle size, conflicts with the project's static-site philosophy. The build already inlines everything into a single HTML file — runtime theming libraries work against this constraint.

**Verdict:** Not recommended. CSS Custom Properties provide the same capability with zero runtime cost.

#### 2.8.4 Tailwind Plugin (`tailwindcss-theming`)

**What:** A plugin for generating theme variants.

**Pros:** Integrates with Tailwind's plugin system.

**Cons:** Tailwind 4 uses a new CSS-based configuration system. Plugin compatibility is uncertain. Adds a dependency for functionality achievable with vanilla CSS.

**Verdict:** Not recommended. Native Tailwind 4 `@theme` is sufficient and more maintainable.

### 2.9 Implementation Checklist

- [ ] Add `@theme` block to `src/index.css` with all design tokens
- [ ] Add dark mode rules (`prefers-color-scheme` + `data-theme`)
- [ ] Update scrollbar styles to use CSS variables
- [ ] Update prose styles to use CSS variables
- [ ] Create `src/components/ThemeToggle.tsx`
- [ ] Add initial theme application in `App.tsx` (prevent FOUC)
- [ ] Add toggle to `Layout.tsx` header navigation
- [ ] Migrate `Datenschutz.tsx` colors
- [ ] Migrate `Impressum.tsx` colors
- [ ] Migrate `ContentContext.tsx` colors
- [ ] Migrate `Huettennutzung.tsx` colors
- [ ] Migrate `Activities.tsx` colors
- [ ] Migrate `About.tsx` colors
- [ ] Migrate `Home.tsx` colors
- [ ] Migrate `Layout.tsx` colors
- [ ] Migrate `Admin.tsx` colors
- [ ] Test light mode visual parity
- [ ] Test dark mode on all pages
- [ ] Test theme toggle persistence
- [ ] Test OS preference detection

### 2.10 Future Extensions

This foundation enables:

- **Per-deployment theming:** Customers can override tokens via a CSS file or environment configuration
- **Seasonal themes:** Holiday-specific color schemes toggleable via admin panel
- **High-contrast mode:** Add `@media (prefers-contrast: high)` rules for accessibility
- **Reduced motion:** Add `@media (prefers-reduced-motion: reduce)` to disable animations
- **Brand customization:** Expose a subset of tokens in the admin UI for non-technical users

The token-based approach means any future visual change requires only updating CSS variable values — no component code changes needed.

---

*End of Chapter 2.*
