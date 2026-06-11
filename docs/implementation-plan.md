# GoldsteinCMS — Migration Implementation Plan

**Project:** GoldsteinfreundeWebsite → GoldsteinCMS  
**Date:** 2026-06-11  
**Author:** Kai Uwe Neumann  
**Status:** Ready to Execute  

---

## 1. Executive Summary

This plan details the migration of the GoldsteinfreundeWebsite (a single-purpose German nature association website) into GoldsteinCMS, a flexible, multi-customer content management system. The migration is structured across 4 phases, ordered by dependency and risk, with an estimated total duration of **3-4 weeks** for a developer familiar with the codebase.

### Guiding Principles

1. **Incremental delivery** — each phase produces a working, deployable system
2. **No breaking changes** — existing site renders identically after each phase
3. **Minimal new dependencies** — leverage existing stack (React, Vite, Tailwind 4)
4. **Test after each phase** — Playwright smoke tests + manual verification
5. **Commit after each phase** — clean version history for rollback

---

## 2. Implementation Phases

### Phase 1: Pluggable Storage Adapters
**Duration:** 3-4 days  
**Risk:** Medium (backend changes, no UI impact)  
**Dependencies:** None  

#### Goals
- Extract Gist storage logic into a standalone adapter
- Implement Cloudflare KV adapter
- Add automatic backend selection based on environment variables
- Preserve all existing behavior (backup rotation, audit logging, conflict detection)

#### Deliverables

| # | Task | File(s) | Est. Lines |
|---|------|---------|------------|
| 1.1 | Create `ContentStorage` interface | `functions/api/storage/types.ts` | ~25 |
| 1.2 | Extract Gist adapter from `_shared.ts` | `functions/api/storage/gist.ts` | ~80 |
| 1.3 | Implement KV adapter | `functions/api/storage/kv.ts` | ~90 |
| 1.4 | Add `selectStorage()` to `_shared.ts` | `functions/api/_shared.ts` | ~15 (new) |
| 1.5 | Update `isConfigured()` | `functions/api/_shared.ts` | ~5 |
| 1.6 | Update `content.ts` to use adapter | `functions/api/content.ts` | ~3 |
| 1.7 | Update `publish.ts` to use adapter | `functions/api/publish.ts` | ~5 |
| 1.8 | Update `audit.ts` to use adapter | `functions/api/audit.ts` | ~3 |
| 1.9 | Document KV setup in `DEPLOY.md` | `docs/DEPLOY.md` | ~30 |

#### Verification Checklist
- [ ] Existing Gist-based publish flow works unchanged
- [ ] KV-based publish flow works end-to-end
- [ ] Removing KV binding falls back to Gist (if configured)
- [ ] Removing both bindings returns 503
- [ ] Backup rotation works for both adapters (30 snapshots)
- [ ] Audit log retrieval works for both adapters
- [ ] Version conflict detection works for both adapters
- [ ] Playwright smoke tests pass

---

### Phase 2: Multi-Customer Site Configuration
**Duration:** 2-3 days  
**Risk:** Low (structural refactoring, no new features)  
**Dependencies:** None (parallel with Phase 1)  

#### Goals
- Extract hardcoded sidebar/footer components into reusable widgets
- Create `site.json` config file with TypeScript type definitions
- Make Layout, App, and Home pages config-driven
- Establish `pageRegistry` pattern for route-to-component mapping

#### Deliverables

| # | Task | File(s) | Est. Lines |
|---|------|---------|------------|
| 2.1 | Extract `ContactWidget` | `src/components/widgets/ContactWidget.tsx` | ~35 |
| 2.2 | Extract `BankAccountWidget` | `src/components/widgets/BankAccountWidget.tsx` | ~15 |
| 2.3 | Extract `QuickInfoWidget` | `src/components/widgets/QuickInfoWidget.tsx` | ~35 |
| 2.4 | Extract `BrandColumn` | `src/components/footer/BrandColumn.tsx` | ~10 |
| 2.5 | Extract `NavColumn` | `src/components/footer/NavColumn.tsx` | ~12 |
| 2.6 | Extract `ContactColumn` | `src/components/footer/ContactColumn.tsx` | ~12 |
| 2.7 | Create `site.json` | `site.json` | ~40 |
| 2.8 | Create `src/siteConfig.ts` | `src/siteConfig.ts` | ~40 |
| 2.9 | Create `src/pageRegistry.ts` | `src/pageRegistry.ts` | ~20 |
| 2.10 | Modify `Layout.tsx` for config-driven rendering | `src/components/Layout.tsx` | ~309 → ~200 |
| 2.11 | Modify `App.tsx` for pageRegistry | `src/App.tsx` | ~31 → ~40 |
| 2.12 | Modify `Home.tsx` for homeBlocks config | `src/pages/Home.tsx` | ~110 → ~115 |
| 2.13 | Document onboarding in `DEPLOY.md` | `docs/DEPLOY.md` | ~20 |

#### Verification Checklist
- [ ] Existing site renders identically before/after (visual comparison)
- [ ] Navigation items match `site.json` config
- [ ] Sidebar widgets match `site.json` config
- [ ] Footer columns match `site.json` config
- [ ] Home page blocks render in config order
- [ ] Route generation works from config
- [ ] Adding a hypothetical new page via config only works
- [ ] Playwright smoke tests pass

---

### Phase 3: Theming Support with Dark Mode
**Duration:** 3-4 days  
**Risk:** Low (visual changes only, no logic changes)  
**Dependencies:** None (parallel with Phases 1-2)  

#### Goals
- Define design tokens as CSS Custom Properties via Tailwind 4 `@theme`
- Implement dark mode with OS preference detection + manual override
- Migrate ~99 hardcoded hex colors across 10 files
- Add theme toggle component to header

#### Deliverables

| # | Task | File(s) | Est. Lines |
|---|------|---------|------------|
| 3.1 | Add `@theme` block with design tokens | `src/index.css` | ~60 |
| 3.2 | Add dark mode rules | `src/index.css` | ~30 |
| 3.3 | Create `ThemeToggle` component | `src/components/ThemeToggle.tsx` | ~50 |
| 3.4 | Add initial theme application in `App.tsx` | `src/App.tsx` | ~10 |
| 3.5 | Add toggle to `Layout.tsx` header | `src/components/Layout.tsx` | ~15 |
| 3.6 | Migrate `Datenschutz.tsx` colors | `src/pages/Datenschutz.tsx` | 2 |
| 3.7 | Migrate `Impressum.tsx` colors | `src/pages/Impressum.tsx` | 2 |
| 3.8 | Migrate `ContentContext.tsx` colors | `src/context/ContentContext.tsx` | 1 |
| 3.9 | Migrate `Huettennutzung.tsx` colors | `src/pages/Huettennutzung.tsx` | 4 |
| 3.10 | Migrate `Activities.tsx` colors | `src/pages/Activities.tsx` | 5 |
| 3.11 | Migrate `About.tsx` colors | `src/pages/About.tsx` | 6 |
| 3.12 | Migrate `Home.tsx` colors | `src/pages/Home.tsx` | 10 |
| 3.13 | Migrate `Layout.tsx` colors | `src/components/Layout.tsx` | 25 |
| 3.14 | Migrate `Admin.tsx` colors | `src/pages/Admin.tsx` | 55 |

#### Color Mapping Reference

| Hardcoded Value | Token | Tailwind Class |
|-----------------|-------|----------------|
| `#2d6a1e` | `--color-primary` | `bg-primary`, `text-primary` |
| `#1a4d0f` | `--color-primary-dark` | `bg-primary-dark`, `text-primary-dark` |
| `#4a8c34` | `--color-primary-light` | `bg-primary-light`, `text-primary-light` |
| `#ffffff` (cards) | `--color-surface-card` | `bg-surface-card` |
| `#f9fafb` | `--color-surface-alt` | `bg-surface-alt` |
| `#333` / `#1f2937` | `--color-text` | `text-text` |
| `#6b7280` | `--color-text-muted` | `text-text-muted` |
| `#e5e7eb` | `--color-border` | `border-border` |

#### Verification Checklist
- [ ] Light mode matches current visual appearance exactly
- [ ] Dark mode renders correctly on all pages
- [ ] Theme toggle persists across page reloads
- [ ] OS preference is respected in auto mode
- [ ] No flash of unstyled content on initial load
- [ ] Scrollbar uses theme colors
- [ ] Admin panel colors are consistent in both modes
- [ ] Playwright smoke tests pass

---

### Phase 4: Semantic CMS Components
**Duration:** 7-8 days  
**Risk:** Medium-High (new interactive features, most complex phase)  
**Dependencies:** Phases 1-3 complete  

#### Goals
- Add DOM enhancement module for CMS content elements
- Implement 8 semantic components (lightbox, slider, gallery, collapsible, accordion, callout, table wrapper, submenu)
- Create Component Builder modal for admin UI
- Integrate with existing HTML editor

#### Deliverables

**Phase 4.1: Foundation (Day 1)**

| # | Task | File(s) | Est. Lines |
|---|------|---------|------------|
| 4.1.1 | Create `CmsContent` wrapper | `src/components/CmsContent.tsx` | ~25 |
| 4.1.2 | Create `cms-enhance.ts` scaffold | `src/components/cms-enhance.ts` | ~50 |
| 4.1.3 | Replace `dangerouslySetInnerHTML` in 8 files | `src/pages/*.tsx`, `Admin.tsx` | ~10 |

**Phase 4.2: Lightbox (Day 2-3)**

| # | Task | File(s) | Est. Lines |
|---|------|---------|------------|
| 4.2.1 | Implement lightbox overlay | `src/components/cms-enhance.ts` | ~150 |
| 4.2.2 | Add keyboard navigation | `src/components/cms-enhance.ts` | ~30 |
| 4.2.3 | Add touch swipe support | `src/components/cms-enhance.ts` | ~40 |

**Phase 4.3: Gallery + Slider (Day 4-5)**

| # | Task | File(s) | Est. Lines |
|---|------|---------|------------|
| 4.3.1 | Implement gallery grid | `src/components/cms-enhance.ts` | ~100 |
| 4.3.2 | Implement image slider | `src/components/cms-enhance.ts` | ~200 |
| 4.3.3 | Add slider touch handling | `src/components/cms-enhance.ts` | ~50 |

**Phase 4.4: Collapsible + Accordion (Day 6)**

| # | Task | File(s) | Est. Lines |
|---|------|---------|------------|
| 4.4.1 | Enhance `<details>` with animation | `src/components/cms-enhance.ts` | ~50 |
| 4.4.2 | Implement accordion group behavior | `src/components/cms-enhance.ts` | ~40 |
| 4.4.3 | Add CSS for collapsible animation | `src/index.css` | ~30 |

**Phase 4.5: Callout + Table + Submenu (Day 6-7)**

| # | Task | File(s) | Est. Lines |
|---|------|---------|------------|
| 4.5.1 | Implement callout box enhancement | `src/components/cms-enhance.ts` | ~40 |
| 4.5.2 | Implement table wrapper | `src/components/cms-enhance.ts` | ~20 |
| 4.5.3 | Add submenu support to Layout | `src/components/Layout.tsx` | ~80 |

**Phase 4.6: Component Builder (Day 8)**

| # | Task | File(s) | Est. Lines |
|---|------|---------|------------|
| 4.6.1 | Create ComponentBuilder modal | `src/components/ComponentBuilder.tsx` | ~350 |
| 4.6.2 | Add image picker integration | `src/components/ComponentBuilder.tsx` | ~50 |
| 4.6.3 | Integrate into Admin.tsx | `src/pages/Admin.tsx` | ~30 |

#### Verification Checklist
- [ ] `<CmsContent>` wrapper works for all pages
- [ ] Lightbox opens on image click, navigates with arrows/keyboard
- [ ] Gallery renders responsive grid with lightbox grouping
- [ ] Slider autoplays, navigates, supports touch swipe
- [ ] Collapsible sections animate open/close
- [ ] Accordion closes siblings when one opens
- [ ] Callout boxes render with correct type styling
- [ ] Tables scroll horizontally on mobile
- [ ] Submenu dropdowns work on desktop and mobile
- [ ] Component Builder modal opens, generates correct HTML
- [ ] Image picker in Builder pre-fills copyright
- [ ] All components survive HTML sanitization
- [ ] All components are accessible (keyboard, ARIA)
- [ ] Playwright smoke tests pass

---

## 3. Cross-Phase Dependencies

```
Phase 1 (Storage)  ──────────────────────────────────┐
                                                       │
Phase 2 (Site Config) ────────────────────────────────┼──→ Phase 4 (CMS Components)
                                                       │
Phase 3 (Theming) ────────────────────────────────────┘
```

- **Phases 1-3** can be developed in parallel (independent concerns)
- **Phase 4** depends on all three being complete (uses storage for content, config for structure, theming for visual consistency)
- Within Phase 4, sub-phases have linear dependencies (foundation → features → builder)

---

## 4. Risk Mitigation

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Storage adapter breaks publish flow | Medium | High | Playwright smoke tests after each adapter change; manual publish verification |
| Site config refactor introduces visual regression | Low | Medium | Visual comparison before/after; Playwright screenshot tests |
| Dark mode colors look wrong on some pages | Medium | Low | Systematic page-by-page review; CSS variable fallbacks |
| CMS components break existing HTML content | Low | High | DOM enhancement is additive; existing content renders unchanged |
| Component Builder is too complex | Medium | Medium | Phase delivery (simple → advanced); consider splitting into 2 PRs |
| KV free tier limits are hit | Low | Low | Monitor via Cloudflare dashboard; upgrade path is straightforward |
| Single-file bundle size grows too large | Low | Medium | Monitor bundle size; keep total under 500KB compressed |

---

## 5. Testing Strategy

### 5.1 Automated Tests (Playwright)

**Existing:** `tests/smoke/app.smoke.spec.ts` covers routes, admin login, publish flow

**New tests to add:**

| Test | Phase | Purpose |
|------|-------|---------|
| Storage adapter fallback | 1 | Verify 503 when no backend configured |
| Site config rendering | 2 | Verify nav, sidebar, footer match config |
| Theme toggle persistence | 3 | Verify localStorage and visual change |
| Lightbox interaction | 4 | Click image → overlay opens |
| Slider navigation | 4 | Arrow buttons change slides |
| Accordion behavior | 4 | Only one section open at a time |

### 5.2 Manual Testing Checklist

After each phase, verify:
- [ ] Dev server starts without errors
- [ ] Build completes without errors
- [ ] All routes load correctly
- [ ] Admin login works
- [ ] Publish flow works
- [ ] Mobile responsive layout works
- [ ] No console errors in browser

### 5.3 Visual Regression

For Phase 3 (Theming), capture screenshots:
- Light mode: all 6 public pages + admin
- Dark mode: all 6 public pages + admin
- Compare with pre-migration screenshots

---

## 6. Commit Strategy

Each phase should be committed as a single, well-described commit (or small PR):

| Phase | Commit Message | Files Changed |
|-------|----------------|---------------|
| 1 | `feat: add pluggable storage adapters (Gist + KV)` | ~8 files |
| 2 | `feat: add multi-customer site configuration` | ~12 files |
| 3 | `feat: add theming support with dark mode` | ~12 files |
| 4.1-4.5 | `feat: add semantic CMS components with DOM enhancement` | ~6 files |
| 4.6 | `feat: add Component Builder modal for admin` | ~3 files |

---

## 7. New Customer Onboarding (Post-Migration)

After all phases are complete, deploying for a new customer requires:

1. **Fork/copy the GoldsteinCMS repo**
2. **Edit `site.json`** — navigation, sidebar, footer, hero, pages
3. **Adjust theming** — edit CSS custom properties in `index.css` (or override via `site.json` extension)
4. **Adjust content** — via admin panel or by editing `content.json` in storage
5. **Add custom pages** (if needed) — create React component, add to `pageRegistry`
6. **Configure storage** — set up Gist or KV backend
7. **Deploy** — push to Cloudflare Pages

Steps 2-4 require **zero React code changes** for standard sites.

---

## 8. Future Extensions (Not in Scope)

These are enabled by the migration but not part of the initial implementation:

| Extension | Depends On | Complexity |
|-----------|------------|------------|
| Turso/SQLite storage adapter | Phase 1 | Low |
| Supabase storage adapter | Phase 1 | Low |
| Content schema extensions per customer | Phase 2 | Medium |
| i18n for admin UI | Phase 3 | Medium |
| Seasonal themes | Phase 3 | Low |
| High-contrast accessibility mode | Phase 3 | Low |
| Customer-specific component library | Phase 4 | Medium |
| Block registry system | Phase 2 (Option B) | High |

---

## 9. File Structure (Post-Migration)

```
GoldsteinCMS/
  site.json                          ← NEW: Site structure config
  src/
    siteConfig.ts                    ← NEW: TypeScript types + import
    pageRegistry.ts                  ← NEW: Component-to-route mapping
    components/
      CmsContent.tsx                 ← NEW: CMS content wrapper
      cms-enhance.ts                 ← NEW: DOM enhancement module
      ComponentBuilder.tsx           ← NEW: Admin component builder
      ThemeToggle.tsx                ← NEW: Theme toggle button
      Layout.tsx                     ← MODIFIED: Config-driven rendering
      widgets/
        ContactWidget.tsx            ← NEW: Extracted from Layout
        BankAccountWidget.tsx        ← NEW: Extracted from Layout
        QuickInfoWidget.tsx          ← NEW: Extracted from Layout
      footer/
        BrandColumn.tsx              ← NEW: Extracted from Layout
        NavColumn.tsx                ← NEW: Extracted from Layout
        ContactColumn.tsx            ← NEW: Extracted from Layout
    index.css                        ← MODIFIED: Theme tokens + dark mode
  functions/
    api/
      storage/
        types.ts                     ← NEW: ContentStorage interface
        gist.ts                      ← NEW: Gist adapter
        kv.ts                        ← NEW: KV adapter
      _shared.ts                     ← MODIFIED: Adapter selection
      content.ts                     ← MODIFIED: Use adapter
      publish.ts                     ← MODIFIED: Use adapter
      audit.ts                       ← MODIFIED: Use adapter
```

---

## 10. Timeline Summary

| Week | Phase | Focus | Deliverable |
|------|-------|-------|-------------|
| **Week 1** | Phase 1 + 2 | Storage + Site Config | Pluggable backends + config-driven layout |
| **Week 2** | Phase 3 | Theming | Dark mode + token-based colors |
| **Week 3** | Phase 4.1-4.5 | CMS Components | Lightbox, gallery, slider, collapsible, etc. |
| **Week 4** | Phase 4.6 + Testing | Component Builder + Polish | Complete admin builder + full test coverage |

**Total: 4 weeks** (adjustable based on available time and complexity tolerance)

---

*End of Implementation Plan.*
