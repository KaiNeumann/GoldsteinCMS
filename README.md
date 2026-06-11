# Goldsteinfreunde Website

Static website and lightweight content-management workflow for `www.goldsteinfreunde.de`.

The site replaces the previous WordPress setup with a low-maintenance Cloudflare Pages deployment. Public visitors receive a static React/Vite site. Trusted editors manage articles, images, contact data, legal-page text, and page content through the built-in admin area.

## Goal

- Keep the public website fast, simple, and inexpensive to operate.
- Avoid the maintenance and security burden of WordPress for a small association website.
- Let non-technical trusted editors update content without code changes or deployments.
- Keep secrets and GitHub credentials out of browser-side code.
- Preserve operational resilience through JSON export/import, Gist backups, and an audit log.

## Benefits

- Static public site with a small attack surface.
- Cloudflare Pages hosting with automatic builds from GitHub.
- Server-side Pages Functions for admin auth and GitHub Gist access.
- Content updates go live through the admin UI without redeploying source code.
- No visitor tracking, analytics, or public contact form.
- External map/calendar embeds are click-to-load instead of loaded automatically.
- Content is portable JSON, not tied to a database server.

## Architecture

```text
Visitor browser
  -> Cloudflare Pages static app
  -> /api/content Pages Function
  -> GitHub Gist content.json

Editor browser
  -> #/admin
  -> /api/auth, /api/session, /api/publish, /api/audit Pages Functions
  -> GitHub Gist content.json, audit-log.json, backup-content-*.json

Developer
  -> GitHub repository main branch
  -> Cloudflare Pages build: npm run build
  -> dist output
```

Important implementation details:

- Hash routing (`#/...`) keeps the app compatible with static hosting and simple CDN behavior.
- Production build uses `vite-plugin-singlefile`; JS and CSS are inlined into `dist/index.html`.
- Static public assets live in `public/` and are copied to `dist/` during build.
- Cloudflare Pages Functions live in `functions/api/` and are not bundled into the browser app.

## Public Pages

- `#/` - home page, welcome content, latest article, older article links
- `#/ueber-uns` - editable association text, local image, click-to-load OpenStreetMap
- `#/aktivitaeten` - article archive with pagination
- `#/huettennutzung` - editable hut-usage text, click-to-load Google Calendar
- `#/impressum` - editable legal notice content
- `#/datenschutz` - editable privacy content
- `#/admin` - password-protected editor/admin area

## Content Model

Stored in GitHub Gist `content.json`:

- `posts` - articles with date, author, title, and sanitized HTML content
- `siteConfig` - association name, contact data, board, registry data, banner image, legal/page text
- `images` - editor-uploaded images stored as Base64 data URLs

Additional Gist files:

- `audit-log.json` - recent publish audit entries with timestamp, editor name, and summary
- `backup-content-<timestamp>.json` - automatic server-side backups before publish, with retention

## Editor Flow

1. Open `https://www.goldsteinfreunde.de/#/admin` or the current Cloudflare Pages domain during pre-cutover operation.
2. Log in with the shared editor/admin password.
3. Edit content in the relevant tab:
   - `Beiträge` for articles
   - `Einstellungen` for contact data, banner, and page text
   - `Bilder` for image uploads and image library management
   - `Export/Import` for manual JSON backup and restore
4. Review the public pages locally in the browser.
5. Open `GitHub`, enter editor name and change summary, then click `Jetzt veröffentlichen`.
6. If a conflict warning appears, click `Von GitHub laden`, review again, then publish.

## Admin Capabilities

- Create, edit, and delete articles.
- Edit homepage welcome text and static page content with HTML helper buttons and preview.
- Upload article images and banner image.
- Export all content as JSON.
- Import a previous JSON backup.
- Publish current content to GitHub Gist.
- Refresh local content from GitHub Gist.
- View recent publish audit entries.
- Log out, clearing the server-side session cookie.

## Security Considerations

- The public website is static and has no WordPress/PHP/database runtime.
- GitHub token is stored only in Cloudflare Pages environment variables.
- The browser never receives the GitHub token.
- Admin login is handled by Cloudflare Pages Functions.
- Authenticated sessions use a signed HttpOnly cookie.
- Login attempts are rate-limited with temporary lockout after repeated failures.
- Publish requests require a valid admin session.
- Published HTML is sanitized server-side and client-side.
- Unsafe tags and attributes such as scripts, iframes, inline event handlers, forms, unsafe data URLs, and inline styles are stripped.
- Admin editors are trusted; there is no role system or approval workflow.
- Editor names in the audit log are self-entered and intended for lightweight accountability, not identity verification.
- No visitor analytics/tracking code is included.
- OpenStreetMap and Google Calendar only load after visitor interaction.
- Public metadata includes `robots.txt`, `sitemap.xml`, canonical link, and sitemap link header.

## Local Development

Requirements:

- Node.js 20+
- npm

Install dependencies:

```bash
npm install
```

Run the Vite dev server:

```bash
npm run dev
```

Build production output:

```bash
npm run build
```

Preview production build locally:

```bash
npm run preview
```

Run smoke tests:

```bash
npm run test:smoke
```

Development admin fallback:

- Create `.env.local` with `VITE_DEV_ADMIN_PASSWORD=your-local-password`.
- This is only used by `npm run dev` / local Vite builds.
- Production admin auth uses `CMS_ADMIN_PASSWORD` in Cloudflare Pages, not this value.
- Plain Vite does not run Cloudflare Pages Functions; GitHub refresh/publish endpoints require the deployed Pages environment or a compatible local Functions setup.

Smoke-test note:

- The Playwright tests mock `/api/*` responses for route and admin-flow checks.
- If `VITE_DEV_ADMIN_PASSWORD` is set, local fallback auth can bypass mocked `/api/auth`; run tests with the expected test password when needed.

## Deployment

Cloudflare Pages builds from the GitHub repository.

Build settings:

- Build command: `npm run build`
- Output directory: `dist`
- Functions directory: `functions`

Required Cloudflare Pages environment variables:

- `CMS_ADMIN_PASSWORD`
- `CMS_SESSION_SECRET`
- `GITHUB_GIST_ID`
- `GITHUB_TOKEN`

Deployment behavior:

- Code changes require a Git commit and push to `main`.
- Cloudflare Pages automatically rebuilds and deploys after push.
- Content changes through `#/admin` do not require a code deployment.

See `docs/DEPLOY.md` for detailed deployment and domain metadata procedures.

## Backup And Restore

The system supports three recovery layers:

- Manual JSON export from `Export/Import`.
- Manual pre-publish download from the `GitHub` tab.
- Automatic server-side Gist backups before publish.

See `docs/BACKUP.md` for the operating routine and restore procedure.

## Important Files

- `src/pages/Admin.tsx` - admin dashboard and editor UI
- `src/context/ContentContext.tsx` - content state, API calls, normalization, local persistence
- `src/content/defaultContent.ts` - schema and fallback/migration defaults
- `functions/api/_shared.ts` - shared auth, Gist, sanitization, backup helpers
- `functions/api/content.ts` - public content endpoint
- `functions/api/publish.ts` - authenticated publish endpoint
- `functions/api/auth.ts` - admin login endpoint
- `functions/api/session.ts` - session check endpoint
- `functions/api/audit.ts` - authenticated audit-log endpoint
- `public/robots.txt` - crawler discovery metadata
- `public/sitemap.xml` - sitemap metadata
- `public/_headers` - Cloudflare Pages response headers
- `docs/DEPLOY.md` - deployment and domain procedures
- `docs/BACKUP.md` - backup and restore operations
