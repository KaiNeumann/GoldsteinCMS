# Deployment And Operations Guide

This document describes how the Goldsteinfreunde website is deployed and operated on Cloudflare Pages.

## Deployment Architecture

```text
www.goldsteinfreunde.de
  -> Cloudflare DNS
  -> Cloudflare Pages static deployment
  -> Cloudflare Pages Functions under /api/*
  -> GitHub Gist for editable content
```

Repository:

- GitHub repository: `https://github.com/KaiNeumann/GoldsteinfreundeWebsite.git`
- Main branch: `main`
- Build command: `npm run build`
- Output directory: `dist`
- Functions directory: `functions`

## Cloudflare Pages Setup

1. Open Cloudflare Dashboard.
2. Go to `Workers & Pages`.
3. Create or open the Pages project connected to the GitHub repository.
4. Configure build settings:
   - Framework preset: none or Vite-compatible default
   - Build command: `npm run build`
   - Build output directory: `dist`
5. Ensure Pages Functions are enabled from the repository `functions/` directory.
6. Deploy from `main`.

## Required Environment Variables

Configure these in Cloudflare Pages under project settings and environment variables:

- `CMS_ADMIN_PASSWORD` - shared password for trusted editors/admins
- `CMS_SESSION_SECRET` - long random secret used to sign admin session cookies
- `GITHUB_GIST_ID` - GitHub Gist id containing `content.json` (required for Gist backend)
- `GITHUB_TOKEN` - GitHub token with `gist` scope (required for Gist backend)

Operational rules:

- Never commit these values.
- Rotate `CMS_ADMIN_PASSWORD` by changing the Cloudflare variable.
- Rotate `GITHUB_TOKEN` in GitHub and Cloudflare if exposure is suspected.
- Use a strong random `CMS_SESSION_SECRET`; changing it invalidates existing sessions.

## Storage Backends

The CMS supports two storage backends for content. The backend is selected automatically based on configured environment variables.

### Cloudflare KV (Recommended)

KV is the recommended backend for new deployments. It requires no external accounts and is fully managed by Cloudflare.

Setup steps:

1. Open Cloudflare Dashboard → Workers & Pages → KV.
2. Create a new KV namespace (e.g., `goldsteinfreunde-content`).
3. Go to your Pages project → Settings → Bindings.
4. Add a KV namespace binding with variable name `CONTENT_KV`.
5. Set `CMS_ADMIN_PASSWORD` and `CMS_SESSION_SECRET` in environment variables.
6. No GitHub account or tokens required.

### GitHub Gist (Legacy)

The Gist backend is retained for backward compatibility. It stores content in a GitHub Gist.

Expected Gist files:

- `content.json` - primary content data
- `audit-log.json` - publish history, created/updated by the app
- `backup-content-<timestamp>.json` - automatic pre-publish backups, retained by the app

Setup steps:

1. Create a GitHub Gist with an empty `content.json` file.
2. Create a GitHub Personal Access Token with `gist` scope.
3. Set `GITHUB_GIST_ID` and `GITHUB_TOKEN` in Cloudflare Pages environment variables.
4. Set `CMS_ADMIN_PASSWORD` and `CMS_SESSION_SECRET`.

The Gist is accessed only by Cloudflare Pages Functions. The browser calls `/api/*`; it does not call GitHub directly and does not receive the GitHub token.

### Backend Selection

If both `CONTENT_KV` and `GITHUB_GIST_ID`/`GITHUB_TOKEN` are configured, KV takes precedence. To migrate from Gist to KV:

1. Create a KV namespace and bind it as `CONTENT_KV`.
2. Deploy the updated code.
3. The CMS will automatically use KV for all subsequent reads/writes.
4. Remove the `GITHUB_GIST_ID` and `GITHUB_TOKEN` variables once migration is confirmed.

## Code Deployment Flow

Use this flow for source-code changes:

1. Make the code change locally.
2. Run `npm run build`.
3. Run `npm run test:smoke` when relevant.
4. Commit the intended files.
5. Push to `main`.
6. Cloudflare Pages builds and deploys automatically.
7. Check the Pages deployment status in Cloudflare.

## Content Publishing Flow

Use this flow for editor/admin content changes:

1. Open `#/admin`.
2. Log in with the editor/admin password.
3. Make edits in `Beiträge`, `Einstellungen`, or `Bilder`.
4. Review public pages in the browser before publishing.
5. Open `GitHub`.
6. Enter editor name and change summary.
7. Use `Backup herunterladen` for a local pre-publish copy when desired.
8. Click `Jetzt veröffentlichen`.

Publishing writes content to GitHub Gist and appends an audit entry. It does not trigger a Cloudflare Pages rebuild.

## Domain And DNS Operation

During production operation, Cloudflare should serve:

- `www.goldsteinfreunde.de`
- optionally the bare/apex domain if configured

DNS considerations:

- Keep email-related records such as MX records intact if email remains with another provider.
- Remove obsolete WordPress/Strato web-hosting A/CNAME records during final cutover.
- Let Cloudflare Pages manage the custom-domain records where possible.

## Public Domain Metadata

These files contain absolute public URLs and must match the currently intended public domain:

- `index.html` - canonical URL
- `public/robots.txt` - sitemap URL
- `public/sitemap.xml` - page URLs
- `public/_headers` - sitemap `Link` header URL

The repository may temporarily point these values to the Cloudflare Pages preview domain before DNS cutover. For final production operation, update them to `https://www.goldsteinfreunde.de/` and rebuild/deploy.

## Local Development

Install dependencies:

```bash
npm install
```

Start Vite:

```bash
npm run dev
```

Build:

```bash
npm run build
```

Preview build:

```bash
npm run preview
```

Run smoke tests:

```bash
npm run test:smoke
```

Local admin fallback:

- `.env.local` may contain `VITE_DEV_ADMIN_PASSWORD=...` for local-only admin login.
- Plain Vite does not run the Cloudflare Pages Functions; `/api/content`, `/api/publish`, and `/api/audit` require the deployed Pages environment or compatible local Functions tooling.
- If Vite serves HTML for an `/api/*` request, the app reports that remote content is unavailable instead of parsing HTML as JSON.

## Security Operation

Admin auth:

- Admin login is server-side via `/api/auth`.
- Sessions use a signed HttpOnly cookie.
- `/api/session` verifies the current session.
- `/api/logout` clears the session.
- Login attempts are throttled with temporary lockout.

Publishing security:

- `/api/publish` requires a valid admin session.
- Published HTML is sanitized before it is stored.
- A pre-publish backup is created automatically.
- An audit entry is written with timestamp, editor name, and summary.
- Publish conflict detection prevents blindly overwriting newer Gist content.

Visitor privacy:

- No analytics or tracking scripts are included.
- No public contact form is included.
- OpenStreetMap and Google Calendar embeds are click-to-load.
- External Google Fonts are not loaded; the site uses local/system font stacks.

## Common Operations

### Change Admin Password

1. Update `CMS_ADMIN_PASSWORD` in Cloudflare Pages environment variables.
2. Save the variable.
3. Redeploy if Cloudflare requires it for the new variable to be active.

### Rotate GitHub Token

1. Create a new GitHub token with `gist` scope.
2. Replace `GITHUB_TOKEN` in Cloudflare Pages environment variables.
3. Save and redeploy if required.
4. Revoke the old token in GitHub.

### Restore Content

Use the procedure in `BACKUP.md`.

### Inspect Publish History

1. Open `#/admin`.
2. Open `GitHub`.
3. Review `Letzte Veröffentlichungen`.

### Verify Deployment Output

Run:

```bash
npm run build
```

Expected output includes:

- `dist/index.html`
- `dist/robots.txt`
- `dist/sitemap.xml`
- `dist/_headers`

## Cost And Limits

Typical free-tier fit:

- Cloudflare Pages bandwidth and build limits are sufficient for the association website.
- GitHub Gist file size is sufficient for JSON content plus modest Base64 image storage.
- The app enforces a 500 KB image-upload limit for editor-uploaded images.
- Recommended image size is 800-1200 px wide, JPEG or WebP.
