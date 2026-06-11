# GoldsteinCMS

A lightweight, configurable CMS for small organizations, built on React, Vite, Tailwind CSS, and Cloudflare Pages.

GoldsteinCMS is the evolution of the GoldsteinfreundeWebsite — redesigned from a single-purpose site into a flexible, multi-customer content management system. It honors its roots while enabling deployment for any small association, club, or organization.

## What It Is

- **Static frontend** — React SPA served via Cloudflare Pages, fast and secure
- **Lightweight admin** — password-protected editor for articles, images, and page content
- **Pluggable storage** — content stored in GitHub Gist or Cloudflare KV, switchable per deployment
- **Config-driven structure** — navigation, sidebar, footer, and pages defined in `site.json`
- **Themeable** — CSS Custom Properties with dark mode support, customizable per customer
- **Zero dependencies for hosting** — Cloudflare Pages free tier + GitHub free tier

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:5173` — the dev server runs with a local fallback admin password.

## Deployment

Push to `main` and Cloudflare Pages builds automatically. See `docs/DEPLOY.md` for environment variables and domain setup.

## Customization

Deploying for a new customer requires:

1. Edit `site.json` — navigation, sidebar, footer, pages, hero
2. Adjust colors in `src/index.css` — override CSS Custom Properties in the `@theme` block
3. Add custom page components (if needed) — create in `src/pages/`, register in `src/pageRegistry.ts`
4. Configure storage backend — set Gist or KV environment variables
5. Push to deploy

See `docs/USER-GUIDE.md` for the full editor and administrator guide.

## Architecture

```text
Visitor browser
  → Cloudflare Pages (static React app)
  → /api/content (Pages Function)
  → Storage backend (GitHub Gist or Cloudflare KV)

Editor browser
  → #/admin
  → /api/auth, /api/session, /api/publish, /api/audit
  → Storage backend

Developer
  → GitHub repository → Cloudflare Pages build → dist/
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, TypeScript, Vite 7 |
| Styling | Tailwind CSS 4, CSS Custom Properties |
| Routing | React Router (hash-based) |
| Backend | Cloudflare Pages Functions |
| Storage | GitHub Gist or Cloudflare KV |
| Testing | Playwright (E2E smoke tests) |
| Deployment | Cloudflare Pages (auto-build from GitHub) |

## Project Structure

```text
GoldsteinCMS/
  site.json                  ← Site structure config (per-customer)
  src/
    siteConfig.ts            ← TypeScript types for site.json
    pageRegistry.ts          ← Route-to-component mapping
    components/
      Layout.tsx             ← Config-driven page layout
      ThemeToggle.tsx        ← Dark/light mode toggle
      CmsContent.tsx         ← CMS content wrapper (Phase 4)
      widgets/               ← Sidebar widget components
      footer/                ← Footer column components
    pages/                   ← Page components (one per route)
    context/                 ← React context providers
    content/                 ← Content schema and defaults
  functions/
    api/
      storage/               ← Pluggable storage adapters
        types.ts             ← ContentStorage interface
        gist.ts              ← GitHub Gist adapter
        kv.ts                ← Cloudflare KV adapter
      _shared.ts             ← Auth, sanitization, helpers
      content.ts             ← Public content endpoint
      publish.ts             ← Authenticated publish endpoint
      auth.ts                ← Admin login endpoint
      session.ts             ← Session check endpoint
      audit.ts               ← Audit log endpoint
  docs/
    DEPLOY.md                ← Deployment procedures
    BACKUP.md                ← Backup and restore
    USER-GUIDE.md            ← Editor and admin guide
    todo/                    ← Design documents
```

## Key Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Build production output to `dist/` |
| `npm run preview` | Preview production build locally |
| `npm run test:smoke` | Run Playwright E2E tests |

## Documentation

- `docs/DEPLOY.md` — deployment and environment variables
- `docs/BACKUP.md` — backup and restore procedures
- `docs/USER-GUIDE.md` — editor and administrator guide
- `docs/implementation-plan.md` — migration roadmap
- `docs/todo/` — design documents for planned features

## License

Licensed under the [GNU Affero General Public License v3.0](LICENSE) (AGPL-3.0-or-later).

This means you can use, modify, and distribute this software, but any network use must provide recipients access to the complete source code. See the LICENSE file for full terms.
