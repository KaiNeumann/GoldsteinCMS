# Design Document — Media Storage Split for GoldsteinCMS

**Target path:** `docs/todo/media-storage-design.md`  
**Status:** Proposed  
**Date:** 2026-06-12  
**Related documents:** `docs/STORAGE-ADAPTERS.md`, `docs/DEPLOY.md`, `docs/BACKUP.md`, `docs/USER-GUIDE.md`

---

## 1. Summary

GoldsteinCMS currently treats editable content and editor-uploaded images as one storage problem. This works for small deployments because the content backend stores JSON documents and the current editor image limit is intentionally modest.

This design proposes splitting storage into two separate responsibilities:

```text
ContentStorage  → structured CMS data, audit log, backups
MediaStorage    → uploaded images and future binary assets
```

The goal is to allow larger and more numerous images without making the CMS feel heavier for small customers.

The recommended default path is:

```text
Cloudflare Pages
+ Pages Functions
+ Cloudflare KV for content
+ Cloudflare R2 for media
```

Gist remains a legacy/simple content backend. Media storage should not depend on Gist.

---

## 2. Motivation

### 2.1 Current situation

GoldsteinCMS already has a pluggable `ContentStorage` abstraction with GitHub Gist and Cloudflare KV backends. KV is the recommended backend for new deployments, while Gist is retained for backward compatibility.

At the moment, images are effectively part of the content-management problem. This keeps the initial system simple, but it creates predictable limits:

- large smartphone photos are too big for JSON-oriented storage
- Base64-encoded images inflate storage size
- content backups become heavier than necessary
- storage limits for content and binary media are mixed
- moving content to a different backend also implicitly moves media handling

### 2.2 Design goal

Keep the deployment model simple for small organizations, but avoid forcing binary assets through the same path as text content.

The CMS should remain usable as:

```text
One Cloudflare Pages project
One admin UI
One content backend
One optional media backend
```

The editor should not need to understand Git, object storage, buckets, S3, or CDN concepts.

---

## 3. Non-goals

This document does not propose:

- building a full digital asset management system
- supporting video hosting in the first iteration
- replacing the existing `ContentStorage` abstraction
- requiring a database
- requiring a customer GitHub account
- requiring self-hosting
- requiring paid infrastructure for small deployments

---

## 4. Proposed architecture

### 4.1 Separate interfaces

Introduce a new `MediaStorage` interface beside the existing `ContentStorage` interface.

```typescript
export interface MediaObject {
  id: string;
  filename: string;
  contentType: string;
  size: number;
  width?: number;
  height?: number;
  createdAt: string;
  updatedAt?: string;
  alt?: string;
  title?: string;
  storageKey: string;
  publicUrl: string;
  variants?: MediaVariant[];
}

export interface MediaVariant {
  kind: "original" | "thumbnail" | "web" | "hero";
  width?: number;
  height?: number;
  contentType: string;
  size: number;
  storageKey: string;
  publicUrl: string;
}

export interface MediaStorage {
  listMedia(env: Env): Promise<MediaObject[]>;
  getMedia(env: Env, id: string): Promise<MediaObject | null>;

  createUpload(
    env: Env,
    input: {
      filename: string;
      contentType: string;
      size: number;
      alt?: string;
      title?: string;
    }
  ): Promise<{
    media: MediaObject;
    uploadUrl?: string;
    uploadHeaders?: Record<string, string>;
  }>;

  saveMediaObject(env: Env, media: MediaObject, body: ArrayBuffer): Promise<MediaObject>;
  deleteMedia(env: Env, id: string): Promise<void>;
}
```

The exact method names can be changed during implementation. The important point is the separation:

```text
ContentStorage stores content documents.
MediaStorage stores binary files and media metadata.
```

### 4.2 Content references media by id

CMS content should reference media by stable id, not by embedded Base64 data.

Example:

```json
{
  "type": "article",
  "title": "Sommerfest",
  "image": {
    "mediaId": "media_2026_06_12_abc123",
    "alt": "Besucher beim Sommerfest"
  }
}
```

The frontend resolves the id to a public URL using the media index returned by the API.

---

## 5. Storage backends

### 5.1 Recommended backend: Cloudflare R2

For Cloudflare-based deployments, R2 is the most natural media backend.

```text
ContentStorage → Cloudflare KV
MediaStorage   → Cloudflare R2
```

Advantages:

- same Cloudflare account as Pages and KV
- no customer GitHub requirement
- S3-compatible API
- suitable for larger images
- avoids bloating content JSON
- keeps binary storage separate from backups and audit logs

Recommended bindings:

```text
CONTENT_KV      → existing content namespace
MEDIA_BUCKET    → R2 bucket binding
MEDIA_BASE_URL  → public media URL or custom domain
```

Suggested object layout:

```text
media/
  originals/
    2026/
      06/
        media_2026_06_12_abc123.jpg
  variants/
    2026/
      06/
        media_2026_06_12_abc123_web.webp
        media_2026_06_12_abc123_thumb.webp
```

### 5.2 Generic S3-compatible backend

A generic S3 adapter should be considered after the R2 adapter.

Compatible targets may include:

- Cloudflare R2
- MinIO
- Garage
- Backblaze B2
- Hetzner Object Storage
- other S3-compatible providers

For GoldsteinCMS this is strategically valuable because one adapter can support several storage providers.

The implementation should avoid provider-specific behavior where possible.

### 5.3 Filesystem backend

Useful for a future self-hosted or local deployment mode.

```text
data/
  content/
  media/
```

Advantages:

- very simple
- easy to back up
- no vendor lock-in

Disadvantages:

- not directly usable in Cloudflare Pages Functions
- requires a server or local runtime
- customer/operator must manage backups

This is not a first-priority backend for the current Cloudflare Pages deployment model.

### 5.4 Git backend

A Git-backed media adapter may be useful for technical users, but should not be the default.

Advantages:

- portable
- versioned
- customer owns files directly

Disadvantages:

- repository size grows quickly
- binary history is inefficient
- image replacement creates permanent bloat
- non-technical customers should not be exposed to Git workflows

Recommendation: support Git only as an advanced/export-oriented backend, not as the normal customer media backend.

### 5.5 WebDAV backend

WebDAV could be attractive for users with Nextcloud or similar storage.

Advantages:

- familiar to self-hosters
- customer-owned
- works with existing file storage

Disadvantages:

- auth and permission setup varies widely
- public URL generation is inconsistent
- CDN behavior is provider-specific
- slower and less predictable than object storage

Recommendation: consider later, after R2/S3.

---

## 6. API design

### 6.1 New endpoints

Add media-specific endpoints under `/api/media`.

Initial minimal set:

```text
GET    /api/media
POST   /api/media
DELETE /api/media/:id
```

Optional future endpoints:

```text
PATCH  /api/media/:id
POST   /api/media/:id/variants
GET    /api/media/:id
```

### 6.2 Upload flow

For the first implementation, keep upload server-mediated through Pages Functions.

```text
Editor browser
  → POST /api/media
  → Pages Function validates auth, size, MIME type
  → Pages Function writes object to MediaStorage
  → Pages Function updates media index
  → Browser receives MediaObject
```

This is simpler than presigned uploads and avoids exposing storage implementation details.

A future direct-upload flow may be added later for larger files:

```text
Editor browser
  → POST /api/media/upload-request
  → receives presigned upload URL
  → uploads directly to object storage
  → POST /api/media/complete
```

Do not start with direct uploads unless Pages Function upload limits become a real problem.

---

## 7. Media metadata

Media metadata should be stored separately from the binary object.

For the first implementation, the simplest option is to store a media index in the existing content backend:

```text
CONTENT_KV key: media:index
```

or as part of content state:

```json
{
  "content": { "...": "..." },
  "media": [
    {
      "id": "media_2026_06_12_abc123",
      "filename": "sommerfest.jpg",
      "contentType": "image/jpeg",
      "size": 2458123,
      "width": 1600,
      "height": 1067,
      "storageKey": "media/originals/2026/06/media_2026_06_12_abc123.jpg",
      "publicUrl": "https://media.example.org/media/originals/2026/06/media_2026_06_12_abc123.jpg",
      "alt": "Besucher beim Sommerfest",
      "createdAt": "2026-06-12T08:00:00.000Z"
    }
  ]
}
```

Recommendation:

- keep binary files in `MediaStorage`
- keep media metadata in `ContentStorage`
- include media metadata in backups
- do not include binary files in content backups

---

## 8. Image handling policy

### 8.1 Accepted formats

Initial supported formats:

```text
image/jpeg
image/png
image/webp
image/gif
image/svg+xml only if sanitized or explicitly disabled
```

Recommendation: do not allow SVG upload in the first implementation unless sanitization is handled carefully.

### 8.2 Size limits

Suggested default limits:

```text
Max original upload: 10 MB
Recommended image width: 1200–2400 px
Generated web variant: max 1600 px wide
Generated thumbnail: max 400 px wide
```

The current 500 KB editor-upload limit can remain for the legacy inline/Base64 path, but the new media backend should allow larger originals.

### 8.3 Variants

A later phase should generate variants:

```text
original
web
thumbnail
hero
```

For phase 1, storing only the original is acceptable if the editor already recommends compressed images.

For phase 2, add image transformation either:

- in the browser before upload
- in a Cloudflare Worker
- during admin upload using a client-side image library

Browser-side resizing is attractive because it keeps infrastructure simple and reduces upload/storage costs.

---

## 9. Backup and restore

### 9.1 Content backups

Content backups should include:

- articles
- pages
- settings
- audit log
- media metadata/index

Content backups should not include raw media bytes.

### 9.2 Media backups

Media backup is a separate operational concern.

For R2/S3, recommended backup options:

- bucket export script
- provider lifecycle/versioning if available
- periodic mirror to another S3-compatible bucket
- manual admin export as a ZIP in a later phase

### 9.3 Restore behavior

A full restore requires:

1. restore content JSON
2. restore media metadata
3. restore media objects to expected storage keys
4. verify public URLs

If media objects are missing, the public site should degrade gracefully:

```text
show placeholder
show alt text
log missing media id in admin diagnostics
```

---

## 10. Migration path

### 10.1 From inline/Base64 images to MediaStorage

Add a migration utility:

```text
scripts/migrate-inline-images-to-media.ts
```

Responsibilities:

1. load current content JSON
2. find embedded image data
3. decode image
4. upload image to configured MediaStorage
5. create `MediaObject`
6. replace inline image with `mediaId`
7. write updated content backup

### 10.2 Migration safety

The migration must:

- create a full content backup first
- keep old inline data until the new media object is verified
- support dry-run mode
- produce a migration report

Example command:

```bash
npm run migrate:media -- --dry-run
npm run migrate:media -- --apply
```

---

## 11. Deployment configuration

### 11.1 Minimal KV + R2 deployment

Required:

```text
CMS_ADMIN_PASSWORD
CMS_SESSION_SECRET
CONTENT_KV binding
MEDIA_BUCKET binding
MEDIA_BASE_URL
```

Optional:

```text
MEDIA_MAX_UPLOAD_BYTES
MEDIA_ALLOWED_TYPES
MEDIA_VARIANTS_ENABLED
```

### 11.2 Legacy content-only deployment

Existing deployments without `MEDIA_BUCKET` should continue to work.

If no `MediaStorage` is configured:

- existing content publishing continues to work
- legacy inline image behavior may remain available
- new large-image uploads are disabled
- admin UI should show a clear configuration message

---

## 12. Admin UI changes

### 12.1 Media library

Add a simple media library screen:

```text
Admin
  → Bilder / Medien
    → upload image
    → set alt text
    → copy/select image
    → delete unused image
```

### 12.2 Image picker

Article and page editors should use a media picker instead of raw upload-per-field behavior.

Desired editor behavior:

1. click "Bild auswählen"
2. choose existing image or upload new one
3. set alt text
4. store `mediaId` in the content item

### 12.3 Unused media

The admin UI should eventually detect media objects not referenced by content.

Initial behavior:

- show "possibly unused"
- do not auto-delete
- require explicit confirmation

---

## 13. Security considerations

### 13.1 Authentication

All media write/delete endpoints require the same admin session as content publishing.

Public read access depends on deployment mode:

- public bucket/custom domain for public website images
- or proxied reads through Pages Functions if private buckets are required

For simplicity, public website media should use public read URLs.

### 13.2 Validation

Uploads must validate:

- authenticated session
- file size
- MIME type
- extension
- actual file signature where practical
- maximum dimensions if image metadata is available

### 13.3 SVG

SVG should be disabled initially.

Reason: SVG can contain scripts, external references, and other risky content. Supporting SVG safely requires sanitization and stricter headers.

### 13.4 Deletion safety

Deleting media can break existing pages.

Recommendation:

- block deletion if media is referenced by content
- allow force-delete only with explicit warning
- keep audit entries for media deletion

---

## 14. Open questions

1. Should media metadata live inside the main content JSON or in a separate `media:index` key?
2. Should public media URLs be stored permanently or derived from `MEDIA_BASE_URL + storageKey`?
3. Should image resizing happen in the browser, in a Worker, or not at all in phase 1?
4. Should media deletion be soft-delete first?
5. Should media backups be part of GoldsteinCMS or documented as provider-level operations?
6. Should variants be generated immediately or only when first needed?
7. Should WebDAV be supported for Nextcloud-like users?

---

## 15. Recommended implementation phases

### Phase 1 — Interface and R2 original uploads

- add `MediaStorage` interface
- add R2 implementation
- add `/api/media` list/upload/delete endpoints
- store original images only
- store metadata in content backend
- add basic admin upload and picker
- keep existing inline image support as legacy fallback

### Phase 2 — Media library UX

- reusable media picker
- alt/title editing
- reference detection
- safer delete flow
- media audit entries

### Phase 3 — Image optimization

- browser-side resize before upload
- web and thumbnail variants
- configurable upload limits
- optional conversion to WebP

### Phase 4 — Additional backends

- generic S3 adapter
- filesystem adapter for self-hosted deployments
- optional WebDAV adapter

### Phase 5 — Migration tooling

- dry-run migration from inline/Base64 images
- apply migration
- migration report
- rollback instructions

---

## 16. Design decision

GoldsteinCMS should keep `ContentStorage` focused on structured CMS state and introduce a separate `MediaStorage` abstraction for images and future binary assets.

The default commercial deployment should be:

```text
Cloudflare Pages + Cloudflare KV + Cloudflare R2
```

This keeps the system simple for small organizations while removing the main technical weakness of storing larger images inside content JSON or Gist/KV values.
