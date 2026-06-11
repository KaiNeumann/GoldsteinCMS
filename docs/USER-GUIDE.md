# GoldsteinCMS — User Guide

This guide covers day-to-day use of GoldsteinCMS for editors and administrators.

---

## Accessing the Admin Panel

Open your site and append `#/admin` to the URL:

```
https://www.example.de/#/admin
```

Log in with the admin password provided by your site administrator.

---

## Dashboard Overview

The admin panel has six tabs:

| Tab | Purpose |
|-----|---------|
| **Beiträge** | Create, edit, and delete articles |
| **Einstellungen** | Edit contact data, association info, and page content |
| **Bilder** | Upload and manage the image library |
| **Veröffentlichen** | Publish changes to the live site |
| **Export/Import** | Export or import content as JSON backups |
| **Deployment** | Static deployment instructions |

---

## Writing Articles

1. Go to the **Beiträge** tab.
2. Click **Neuer Beitrag** to create a new article.
3. Fill in:
   - **Titel** — article headline
   - **Autor** — author name (displayed publicly)
   - **Inhalt** — article body (HTML with formatting toolbar)
4. Use the formatting toolbar for bold, italic, headings, lists, and links.
5. Click **Speichern** to save as a draft locally.

Articles are stored locally until you publish. They appear on the home page and under **Aktivitäten**.

### Formatting Tips

- Use the **Fett** and **Kursiv** buttons for emphasis.
- Use heading levels for structure (H2, H3).
- Use the **Link** button to insert hyperlinks.
- Use the **Bild** buttons to insert images from the library.
- Switch between **Editor** and **Vorschau** to see formatted output.

---

## Editing Page Content

1. Go to the **Einstellungen** tab.
2. Expand the **Seiteninhalt** section.
3. Edit the HTML content for each page:
   - **Startseite** — welcome box text
   - **Über uns** — association description
   - **Hüttennutzung** — hut usage introduction
   - **Impressum** — legal notice
   - **Datenschutz** — privacy policy
4. Use the preview toggle to check formatting.
5. Click **Speichern** to save locally.

---

## Managing Images

1. Go to the **Bilder** tab.
2. Click **Bild hochladen** to add an image.
3. Enter a name and copyright attribution (required).
4. The image appears in the library grid.
5. Click any image to copy its HTML tag for insertion into content.

### Copyright Requirement

Every image **must** have a copyright attribution. This is a legal requirement (UrhG §63). The system enforces this at upload time.

---

## Editing Site Settings

In the **Einstellungen** tab, you can update:

- **Organisation** — name, short name, tagline
- **Kontakt** — email, phone, address
- **Bankverbindung** — bank account details for donations
- **Verein** — founding date, member count, registry info
- **Vorstand** — board members and roles
- **Banner** — homepage banner image and credit
- **Über uns Bild** — about page image and credit

Click **Speichern** after making changes.

---

## Publishing Changes

1. Go to the **Veröffentlichen** tab.
2. Enter your **Name** (for the audit log).
3. Enter a **Zusammenfassung** describing what changed.
4. Click **Jetzt veröffentlichen**.

Your changes are now live. The publish action:

- Saves content to the storage backend (Gist or KV)
- Creates a backup of the previous version
- Logs the publish entry with your name and summary

### Conflict Detection

If another editor published since your last refresh, you'll see a conflict warning. Click **Von GitHub laden** (or **Von Backend laden**) to load the latest version, review changes, then publish again.

---

## Backup and Restore

### Export

1. Go to **Export/Import**.
2. Click **JSON exportieren** to download all content as a JSON file.
3. Store the file safely — this is a complete backup.

### Import

1. Go to **Export/Import**.
2. Click **JSON auswählen** and choose a backup file.
3. Review the imported content.
4. Click **Importieren** to restore.

### Automatic Backups

The system automatically creates 30 rolling backups before each publish. These are stored alongside the content in the storage backend.

See `docs/BACKUP.md` for the full backup and restore procedure.

---

## Logging Out

Click **Abmelden** in the admin panel header. Your session is cleared.

Sessions expire after 8 hours. Close your browser to end the session immediately.

---

## Deployment for New Customers

Deploying GoldsteinCMS for a new customer requires:

### 1. Copy the Repository

Fork or copy the GoldsteinCMS repository.

### 2. Configure Site Structure

Edit `site.json` in the repository root:

```jsonc
{
  "navigation": [
    { "label": "Home", "path": "/" },
    { "label": "About", "path": "/about" },
    // ... your pages
  ],
  "sidebar": ["contact", "quickInfo"],
  "footer": {
    "columns": ["brand", "navigation", "contact"],
    "credit": "Website: Your Name",
    "showAdminLink": true
  },
  "hero": {
    "headline": "Welcome to Our Site",
    "subtitle": "Building something great"
  }
}
```

### 3. Adjust Theming

Edit the `@theme` block in `src/index.css` to match the customer's brand colors:

```css
@theme {
  --color-primary: #2d6a1e;        /* Main brand color */
  --color-primary-dark: #1a4d0f;   /* Darker shade */
  --color-primary-light: #4a8c34;  /* Lighter shade */
  /* ... other tokens */
}
```

### 4. Configure Storage

Set environment variables in Cloudflare Pages:

**For GitHub Gist:**
- `GITHUB_GIST_ID` — your Gist ID
- `GITHUB_TOKEN` — GitHub PAT with `gist` scope

**For Cloudflare KV:**
- Create a KV namespace
- Bind it as `CONTENT_KV` to your Pages project

Both require:
- `CMS_ADMIN_PASSWORD` — admin login password
- `CMS_SESSION_SECRET` — random string for session signing

### 5. Deploy

Push to `main` and Cloudflare Pages builds automatically.

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Can't log in | Check `CMS_ADMIN_PASSWORD` in Cloudflare Pages env vars |
| Content not saving | Check browser console for errors; try refreshing |
| Publish fails | Verify storage backend is configured (Gist or KV) |
| Conflict warning | Click "Von Backend laden" to sync, then re-publish |
| Images not showing | Ensure Base64 data URLs are within 500KB limit |
| Dark mode not working | Clear localStorage and reload; check `data-theme` attribute |

---

## Technical Reference

### Content Model

```typescript
interface ContentData {
  posts: Post[];           // Articles
  siteConfig: SiteConfig;  // All site configuration
  images: SiteImage[];     // Editor-uploaded images
}

interface Post {
  id: string;       // Auto-generated from title+date
  date: string;     // YYYY-MM-DD
  author: string;   // Free-text
  title: string;
  content: string;  // Sanitized HTML
}
```

### Storage Backends

| Backend | Use When | Notes |
|---------|----------|-------|
| GitHub Gist | Developer has GitHub account | Free, 30-snapshot backup rotation |
| Cloudflare KV | No GitHub account needed | Free tier: 100K reads/day, 1K writes/day |

### Security

- Admin sessions use HMAC-signed HttpOnly cookies
- Login attempts are rate-limited (5 attempts → 10 minute lockout)
- All published HTML is sanitized (scripts, iframes, inline styles stripped)
- No visitor tracking or analytics
- External embeds are click-to-load only

---

*End of User Guide.*
