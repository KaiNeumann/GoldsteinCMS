# Design Document — Goldsteinfreunde CMS

This document records architectural decisions and design plans for the Goldsteinfreunde website CMS.

---

## Chapter 1: Pluggable Storage Adapters

**Status:** Implemented  
**Date:** 2026-06-11  
**Goal:** Make the content storage layer switchable so each customer deployment can use either GitHub Gist (current) or Cloudflare KV, with the backend selected automatically based on configured environment variables.

### 1.1 Motivation

The current CMS uses a single GitHub Gist as its content database. While the customer never interacts with GitHub directly (only the developer needs a GitHub account), replicating this setup for other customers requires each customer to either have a GitHub account or rely on the developer's GitHub infrastructure. A pluggable storage layer allows:

- Customers to use Cloudflare KV (no GitHub account needed)
- Future storage backends to be added with minimal effort
- Each deployment to choose the backend that fits its constraints

### 1.2 Current Architecture

The storage layer lives entirely in `functions/api/_shared.ts` with three functions:

| Function | Lines | HTTP Method | Purpose |
|---|---|---|---|
| `fetchGist(env)` | 102–126 | GET GitHub API | Reads `content.json` from the Gist. Returns parsed data + version timestamp. |
| `fetchGistWithAudit(env)` | 128–165 | GET GitHub API | Reads `content.json` + `audit-log.json` + lists all files in the Gist. |
| `saveGist(env, content, audit?, extraFiles?, deleteFiles?)` | 167–197 | PATCH GitHub API | Writes `content.json`, `audit-log.json`, backup files; deletes old backups. |

Helper functions `createBackupFiles()` (lines 221–233) manage the 30-snapshot backup rotation. These are called by `publish.ts` and the resulting `extraFiles`/`deleteFiles` are passed to `saveGist()`.

**Callers:**

| File | Calls |
|---|---|
| `functions/api/content.ts` | `fetchGist(env)` |
| `functions/api/publish.ts` | `fetchGist(env)`, `fetchGistWithAudit(env)`, `saveGist(env, ...)` |
| `functions/api/audit.ts` | `fetchGistWithAudit(env)` |

### 1.3 Proposed Architecture

#### 1.3.1 Adapter Interface

```typescript
// functions/api/storage/types.ts

import type { AuditEntry } from "../_shared";

export interface ContentStorage {
  fetchContent(env: any): Promise<{
    data: unknown;
    version: string;
  }>;

  fetchContentWithAudit(env: any): Promise<{
    data: unknown;
    version: string;
    audit: AuditEntry[];
    files: string[];
  }>;

  saveContent(
    env: any,
    content: unknown,
    audit?: AuditEntry[],
    extraFiles?: Record<string, string>,
    deleteFiles?: string[]
  ): Promise<void>;
}
```

The interface matches the existing function signatures exactly. The `files` array returned by `fetchContentWithAudit` represents the list of backup files (used by `createBackupFiles` for pruning).

#### 1.3.2 Adapter Selection

A `selectStorage(env)` function in `_shared.ts` returns the correct adapter based on what environment variables/bindings are present:

```typescript
export function selectStorage(env: Env): ContentStorage {
  if (env.CONTENT_KV) return kvStorage;
  if (env.GITHUB_GIST_ID && env.GITHUB_TOKEN) return gistStorage;
  throw new Error("Kein Storage-Backend konfiguriert");
}
```

Priority: KV takes precedence if both are configured (allows migration by simply adding the KV binding).

#### 1.3.3 Updated `isConfigured()`

```typescript
export function isConfigured(env: Env): boolean {
  const hasKv = !!env.CONTENT_KV;
  const hasGist = !!env.GITHUB_GIST_ID && !!env.GITHUB_TOKEN;
  return (hasKv || hasGist) && !!env.CMS_ADMIN_PASSWORD && !!env.CMS_SESSION_SECRET;
}
```

### 1.4 Gist Adapter

**File:** `functions/api/storage/gist.ts`

This is a direct extraction of the existing code from `_shared.ts`. The logic is identical:

- `fetchContent()` → calls GitHub API, parses `content.json`, returns `{ data, version: updated_at }`
- `fetchContentWithAudit()` → same, plus parses `audit-log.json` and returns `Object.keys(files)`
- `saveContent()` → PATCHes the Gist with `content.json`, `audit-log.json`, extra backup files, and deletes old backups

Constants `BACKUP_PREFIX` and `MAX_BACKUPS` move here from `_shared.ts`.

### 1.5 KV Adapter

**File:** `functions/api/storage/kv.ts`

Uses Cloudflare Workers KV bindings (`KVNamespace`).

**Key Schema:**

| KV Key | Value | Purpose |
|---|---|---|
| `content` | JSON string of all site content | Primary content store |
| `audit` | JSON string of `AuditEntry[]` | Publish history |
| `backup:<timestamp>` | JSON string of content snapshot | Pre-publish backup |
| `backups:index` | JSON string of `string[]` (sorted timestamps) | Tracks which backups exist |

**Method Mapping:**

| Interface Method | KV Operations |
|---|---|
| `fetchContent()` | `kv.get("content")` + `kv.getWithMetadata("content")` for version |
| `fetchContentWithAudit()` | `kv.get("content")` + `kv.get("audit")` + `kv.list({ prefix: "backup:" })` |
| `saveContent()` | `kv.put("content", ...)`, `kv.put("audit", ...)`, `kv.put("backup:<ts>", ...)`, `kv.delete("backup:<ts>")` for pruning |

**Version Tracking:**

Use KV key metadata. On each `put()` to `content`, set metadata `{ version: new Date().toISOString() }`. On `getWithMetadata()`, read `metadata.version` for the version string.

**Backup Pruning:**

Same logic as Gist: keep 30 most recent backups. Read `backups:index` (array of timestamps), append new timestamp, sort descending, delete keys for timestamps beyond position 30, update index.

**KV Limits (Free Tier):**

| Limit | Value | Impact |
|---|---|---|
| Reads/day | 100,000 | ~3,300 page views/day — sufficient for a small association site |
| Writes/day | 1,000 | ~33 publishes/day — more than enough |
| Storage | 1 GB | Content.json is ~50–200 KB; 30 backups adds ~6 MB max |
| Key size | 512 bytes | `backup:2026-06-11T12-00-00-000Z` is ~40 bytes — fine |
| Value size | 25 MiB | Content + Base64 images well within limit |

### 1.6 File Changes Summary

| File | Action | Description |
|---|---|---|
| `functions/api/storage/types.ts` | **New** | `ContentStorage` interface |
| `functions/api/storage/gist.ts` | **New** | Gist adapter (extracted from `_shared.ts`) |
| `functions/api/storage/kv.ts` | **New** | KV adapter |
| `functions/api/_shared.ts` | **Modified** | Remove Gist functions, add `CONTENT_KV` to `Env`, add `selectStorage()`, update `isConfigured()` |
| `functions/api/content.ts` | **Modified** | Replace `fetchGist(env)` with `selectStorage(env).fetchContent(env)` |
| `functions/api/publish.ts` | **Modified** | Replace Gist calls with adapter calls |
| `functions/api/audit.ts` | **Modified** | Replace `fetchGistWithAudit(env)` with adapter call |
| `functions/api/auth.ts` | Unchanged | |
| `functions/api/session.ts` | Unchanged | |
| `functions/api/logout.ts` | Unchanged | |
| `DEPLOY.md` | **Modified** | Document both Gist and KV setup paths |

**Lines of code estimate:**
- Adapter interface: ~25 lines
- Gist adapter: ~80 lines (direct extraction)
- KV adapter: ~90 lines (new logic for key management)
- `_shared.ts` changes: net -60 lines (removed) + 15 lines (added) = net -45 lines
- API endpoint changes: ~5 lines each (3 files)

**Total new code: ~210 lines across 3 new files.**

### 1.7 What Does NOT Change

- **Client-side code:** `ContentContext.tsx`, `Admin.tsx` — the browser never knows which backend is used
- **Session/auth logic:** HMAC-signed cookies, login throttling, rate limiting
- **HTML sanitization:** `sanitizeContentData()`, `sanitizeHtml()`
- **Build configuration:** `vite.config.ts`, `package.json`
- **Content schema:** `content.json` structure is backend-agnostic
- **Backup semantics:** Same 30-snapshot rotation for both adapters

### 1.8 Deployment Comparison

**Gist (current):**
1. Create a GitHub Gist with an empty `content.json`
2. Create a GitHub PAT with `gist` scope
3. Set `GITHUB_GIST_ID` and `GITHUB_TOKEN` in Cloudflare Pages env vars
4. Set `CMS_ADMIN_PASSWORD` and `CMS_SESSION_SECRET`

**KV (new):**
1. Create a KV namespace in Cloudflare Dashboard → Workers & Pages → KV
2. Bind it to the Pages project as `CONTENT_KV`
3. Set `CMS_ADMIN_PASSWORD` and `CMS_SESSION_SECRET`
4. No GitHub account needed

### 1.9 Testing Strategy

- **Gist adapter:** Verify existing behavior is preserved (smoke test publish flow)
- **KV adapter:** Deploy to a test Pages project with KV binding, run same publish flow
- **Fallback:** Remove KV binding → app should fall back to Gist (if configured) or return 503
- **Conflict detection:** Both adapters return a `version` string; publish.ts checks `baseVersion !== remote.version` — this works identically

### 1.10 Future Extensions

This adapter pattern makes it straightforward to add:

- **Turso/SQLite adapter** — for customers wanting a proper database
- **Supabase adapter** — for customers in the Supabase ecosystem
- **JSONBin.io adapter** — if 100 KB record limit is acceptable (remove Base64 images from JSON)

Each new adapter is a single file implementing `ContentStorage`, plus updating `selectStorage()` with a new condition.

---

*End of Chapter 1.*
