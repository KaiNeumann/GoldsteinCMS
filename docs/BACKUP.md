# Backup And Restore Guide

The website content is portable JSON stored in GitHub Gist. Backups are available through the admin UI and through automatic pre-publish Gist backup files.

## Backup Sources

Manual local backups:

- `#/admin -> Export/Import -> Inhalt exportieren`
- `#/admin -> GitHub -> Backup herunterladen`

Automatic server-side backups:

- Every successful publish creates a `backup-content-<timestamp>.json` file in the configured Gist before overwriting `content.json`.
- The app retains recent automatic backups according to the configured retention behavior in the publish helper.

Audit log:

- `audit-log.json` records timestamp, editor name, and change summary for successful publishes.
- The audit log is lightweight operational history, not a replacement for backups.

## Manual Backup Procedure

Use this before larger edits or before publishing substantial changes:

1. Open `#/admin`.
2. Log in.
3. Open `GitHub`.
4. Click `Backup herunterladen`.
5. Store the downloaded JSON file somewhere recoverable.

Alternative export:

1. Open `#/admin`.
2. Open `Export/Import`.
3. Click `Inhalt exportieren`.

Downloaded backup file names include a label and timestamp, for example:

```text
goldsteinfreunde-content-pre-publish-20260601-1430.json
```

## Restore Procedure

Use this when content was accidentally changed or corrupted:

1. Open `#/admin`.
2. Log in.
3. Open `Export/Import`.
4. In `Import`, select the backup JSON file.
5. Review the public pages in the browser.
6. Open `GitHub`.
7. Enter editor name and a clear restore summary.
8. Click `Jetzt veröffentlichen`.

The import updates the browser-local content state first. The final publish writes the restored content back to GitHub Gist for all visitors.

## Restore From Automatic Gist Backup

Use this if no downloaded JSON backup is available:

1. Open the configured GitHub Gist.
2. Locate the desired `backup-content-<timestamp>.json` file.
3. Copy or download its JSON content.
4. Save it locally as a `.json` file.
5. Follow the normal restore procedure above.

## Backup Contents

A content backup contains:

- `posts` - articles
- `siteConfig` - settings, contact data, page text, legal text, banner image
- `images` - Base64 editor image library

It does not contain Cloudflare environment variables, GitHub tokens, admin passwords, or session cookies.

## Operational Storage Routine

Recommended local storage pattern:

- Keep the latest several manual backups.
- Keep a backup before major content migrations or legal-text changes.
- Keep at least one known-good backup outside the browser download folder.
- Do not publish backup files publicly if they contain unpublished draft content.

## Recovery Checks

After any restore:

- Check the home page.
- Check `Aktivitaeten` and at least one article listing.
- Check `Über uns`, `Hüttennutzung`, `Impressum`, and `Datenschutz`.
- Check that images render where expected.
- Check `GitHub -> Letzte Veröffentlichungen` for the restore audit entry.
