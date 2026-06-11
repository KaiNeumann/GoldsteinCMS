# Design Document — GoldsteinCMS

This document records architectural decisions and design plans for the GoldsteinCMS.

---

## Chapter 5: Shared Core Architecture

**Status:** Proposed
**Date:** 2026-06-11
**Goal:** Define a shared core pattern that balances code reuse, customer independence, and safe update propagation across multiple CMS deployments.

### 5.1 Motivation

The current GoldsteinCMS architecture is fork-based: each customer gets a full copy of the repository. This provides maximum isolation but creates maintenance overhead — a bug fix or security patch must be applied to every fork individually.

As the number of customer instances grows, two competing pressures emerge:

1. **Code reuse** — Duplicating the same logic across 10+ forks is wasteful and error-prone.
2. **Blast radius** — A shared dependency that auto-deploys can break all customers simultaneously.

The goal is a middle ground: shared code that customers can adopt at their own pace, with full ownership of their instance.

### 5.2 Design Constraints

| Constraint | Rationale |
|---|---|
| **Customers may own their repos** | Some customers will want the code in their own GitHub organization, outside the developer's direct control |
| **No forced updates** | A customer should never receive an update they didn't explicitly adopt |
| **AGPL license follows the code** | Attribution and source-sharing requirements are enforced by license, not by code ownership |
| **Simple for <5 customers** | The solution should not introduce build complexity that isn't justified by scale |
| **Upgrade path from forking** | The transition from full forks to shared core should be incremental, not a rewrite |

### 5.3 Architecture Options

#### Option A: Pure Forking (Current)

Each customer has a complete, independent copy of the repository.

```text
customer-a/          ← Full fork, independent
customer-b/          ← Full fork, independent
```

**Pros:** Maximum isolation, zero blast radius, customers can own their repos.
**Cons:** Duplicated maintenance, manual propagation of fixes, easy to diverge.

**When to use:** Fewer than 5 customers, low update frequency.

---

#### Option B: Git Submodule Core

Extract shared code into a separate repository. Each customer repo references it as a git submodule pinned to a specific commit.

```text
goldstein-core/           ← Shared repo (private)
  src/components/
  src/context/
  functions/api/
  src/siteConfig.ts

customer-a/               ← Customer repo
  core/                   ← Submodule → goldstein-core@abc123
  site.json
  src/pages/              ← Customer-specific pages
  src/index.css           ← Customer theme overrides
```

**Pros:** Single source of truth for shared code, pinned updates, no build system changes.
**Cons:** Git submodules are confusing for many developers, manual update process, submodule state can get out of sync.

---

#### Option C: npm Package Core

Publish shared code as a private npm package. Each customer imports from it.

```text
@goldstein/core@1.2.0     ← Private npm package

customer-a/
  package.json            ← "@goldstein/core": "^1.2.0"
  site.json
  src/pages/
  src/index.css
```

**Pros:** Familiar dependency model, semantic versioning, CI/CD can automate updates.
**Cons:** Requires npm publishing infrastructure, version resolution complexity, customers need npm access.

---

#### Option D: Git Submodule + Version Tagging (Recommended)

Hybrid approach: git submodule for code sharing, semantic version tags for update control.

```text
goldstein-core/           ← Shared repo
  v1.2.0                  ← Git tag
  v1.1.0                  ← Previous stable
  src/
  functions/

customer-a/
  core/                   ← Submodule @v1.2.0
  site.json
  src/pages/
  src/index.css
```

**Pros:** Simple tooling (git only), clear version semantics, customers update when ready.
**Cons:** Manual update process (intentional, not a bug), submodule ergonomics.

### 5.4 Recommended Approach: Option D (Submodule + Tags)

#### Why Not Pure Forking?

At <5 customers, forking works. Beyond that, propagating a security fix to 10+ forks is:
- Time-consuming (10 separate PRs)
- Error-prone (easy to miss one)
- Inconsistent (some customers update, others don't)

#### Why Not npm?

The added infrastructure (private registry, version resolution, build integration) isn't justified for a small CMS with <20 customers. Git submodules are simpler and more transparent.

#### Why Submodule + Tags?

- **Customers see exactly what version they're on** — `git submodule status` shows the pinned commit
- **Updates are explicit** — `cd core && git fetch && git checkout v1.3.0 && cd .. && git commit`
- **No auto-deploy risk** — the customer repo's commit is the deploy trigger
- **Works with customer-owned repos** — submodule points to your public or private core repo

### 5.5 Core/Custom Boundary

What lives in the shared core vs. the customer repo?

| Location | Contents |
|---|---|
| **Shared Core** (`core/`) | Reusable components, context providers, API functions, storage adapters, theming foundation, site config types |
| **Customer Repo** | `site.json` (structure), `src/index.css` (theme overrides), `src/pages/` (custom pages), `public/` (customer images) |

**Shared core includes:**

```text
core/
  src/
    components/
      Layout.tsx             ← Config-driven layout
      ThemeToggle.tsx        ← Theme switcher
      widgets/               ← Sidebar widgets
      footer/                ← Footer columns
    context/
      ContentContext.tsx      ← Content state management
    content/
      defaultContent.ts      ← Schema and defaults
    siteConfig.ts            ← TypeScript types
    pageRegistry.ts          ← Route mapping
    utils/
      cn.ts                  ← Class name utility
  functions/
    api/
      storage/               ← Storage adapters
      _shared.ts             ← Auth, sanitization
      content.ts, publish.ts, auth.ts, session.ts, audit.ts, logout.ts
  docs/
    DEPLOY.md
    BACKUP.md
    USER-GUIDE.md
```

**Customer repo includes:**

```text
customer-repo/
  core/                      ← Git submodule
  site.json                  ← Site structure config
  src/
    index.css                ← Theme overrides (@theme block)
    pages/                   ← Customer-specific page components
    App.tsx                  ← Entry point (imports from core)
  public/
    images/                  ← Customer-specific images
  index.html                 ← SPA entry point
  package.json               ← Dependencies (includes core)
  vite.config.ts             ← Build config
```

### 5.6 Onboarding Workflow

#### New Customer Setup

```bash
# 1. Create customer repo (from template or fresh)
gh repo create customer-org/website --private

# 2. Clone and initialize
git clone https://github.com/customer-org/website.git
cd website

# 3. Add core submodule
git submodule add https://github.com/KaiNeumann/goldstein-core.git core
cd core && git checkout v1.2.0 && cd ..

# 4. Create site.json (copy template, customize)
cp core/templates/site.json.example site.json
# Edit site.json — navigation, sidebar, footer, hero, pages

# 5. Create theme overrides
# Edit src/index.css — override @theme CSS custom properties

# 6. Add custom pages (if needed)
# Create src/pages/MyPage.tsx, register in core/pageRegistry.ts

# 7. Install dependencies
npm install

# 8. Configure Cloudflare Pages
#    - Connect repo
#    - Set env vars: CMS_ADMIN_PASSWORD, CMS_SESSION_SECRET
#    - Set storage: GIST_ID + TOKEN or KV binding

# 9. Deploy
git push origin main
```

#### Template Site.json

```jsonc
{
  "navigation": [
    { "label": "Home", "path": "/" },
    { "label": "About", "path": "/about" }
  ],
  "sidebar": ["contact", "quickInfo"],
  "footer": {
    "columns": ["brand", "navigation", "contact"],
    "credit": "Website: Your Name",
    "showAdminLink": true
  },
  "homeBlocks": ["welcome", "latestPost", "olderPosts"],
  "hero": {
    "headline": "Welcome",
    "subtitle": "Your tagline here",
    "showTrees": false
  },
  "pages": {
    "/": { "component": "Home", "title": "Home" },
    "/about": { "component": "About", "title": "About" }
  }
}
```

### 5.7 Update Workflow

#### Security Fix (All Customers)

```bash
# 1. Fix in core repo
cd goldstein-core
git checkout -b fix/xss-sanitization
# ... make fix ...
git commit -m "fix: prevent XSS via img onerror"

# 2. Test on one customer
cd ../customer-a
cd core && git fetch && git checkout fix/xss-sanitization && cd ..
npm run build  # Verify it works
npm run test:smoke

# 3. Merge and tag in core
cd ../goldstein-core
git checkout main
git merge fix/xss-sanitization
git tag v1.2.1
git push origin main --tags

# 4. Update remaining customers
for customer in customer-b customer-c customer-d; do
  cd ../$customer
  cd core && git fetch && git checkout v1.2.1 && cd ..
  git add core
  git commit -m "chore: update core to v1.2.1 (security fix)"
  git push
done
```

#### Feature Update (Opt-In)

```bash
# 1. Release new version in core
cd goldstein-core
git tag v1.3.0
git push origin main --tags

# 2. Notify customers
# "v1.3.0 available: submenu navigation, dark mode improvements"

# 3. Customer updates when ready
cd customer-a
cd core && git fetch && git checkout v1.3.0 && cd ..
git add core
git commit -m "chore: update core to v1.3.0"
git push
```

### 5.8 Automated Update PRs

When managing customer repos yourself, automated update PRs provide CI validation and audit trails without manual scripting.

#### How It Works

```text
1. You release core v1.3.0 (tag + release notes)
        │
2. Dependabot detects new tag (daily check)
        │
3. PR opened in each customer repo:
   - customer-a: "Update core to v1.3.0"
   - customer-b: "Update core to v1.3.0"
   - customer-c: "Update core to v1.3.0"
        │
4. CI runs on each PR (build + smoke tests)
        │
5. You review and merge
        │
6. Cloudflare Pages auto-deploys per customer
```

#### Dependabot Configuration

Create `.github/dependabot.yml` in each customer repo:

```yaml
version: 2
updates:
  - package-ecosystem: "gitsubmodule"
    directory: "/"
    schedule:
      interval: "daily"
    labels:
      - "core-update"
    commit-message:
      prefix: "chore"
```

#### Why Dependabot Over Manual Scripts

| Manual Script | Dependabot |
|---------------|------------|
| You remember to run it | Runs automatically |
| No CI check on PR | Build + tests run before merge |
| No audit trail | PR history shows what changed when |
| Easy to skip | PR sitting there reminds you |
| No review step | You review before merging |

The CI check is the real value. The PR tells you "this update will break customer B's build" before you merge it.

#### Your Release Process

```bash
# 1. Make changes in goldstein-core
git checkout -b feature/new-widget
# ... implement ...
git commit -m "feat: add callout widget"

# 2. Merge and tag
git checkout main
git merge feature/new-widget
git tag -a v1.3.0 -m "Add callout widget, fix dark mode colors"
git push origin main --tags

# 3. Release notes (GitHub Releases)
# Describe what changed, any breaking changes, migration steps

# 4. Dependabot handles the rest
# PRs appear in customer repos automatically
```

#### Semantic Versioning Strategy

| Change | Tag | Example |
|--------|-----|---------|
| Bug fix | `v1.2.1` | Fix XSS in sanitizer |
| Feature | `v1.3.0` | Add callout widget |
| Breaking | `v2.0.0` | Change `site.json` schema |

For major versions, the bot still opens PRs, but release notes clearly state "Breaking: migration required."

#### Key Design Decisions

| Decision | Recommendation | Why |
|----------|----------------|-----|
| **Automerge?** | No | Review before deploying to customers |
| **Which version to pin?** | Exact tag (`v1.3.0`) | Submodule should be deterministic |
| **PR frequency** | Daily check | Low volume, no spam |
| **Breaking changes** | Major tag (`v2.0.0`) | Customers can ignore minor/patch if busy |
| **Release notes** | Required | Need to know what changed |

#### Cost

- **Dependabot:** Free on GitHub
- **Your time:** Tag a release, write notes — 5 minutes per update

### 5.9 Customer-Owned Repos

When a customer wants the code in their own GitHub organization:

```bash
# 1. Customer creates their own repo
# 2. You transfer or they clone
git clone https://github.com/customer-org/website.git

# 3. Submodule still points to your core repo
#    (public or they need access to private core)

# 4. If core is private, customer needs read access
#    gh repo add-collaborator KaiNeumann/goldstein-core customer-dev --permission pull

# 5. Customer can revoke your access to their repo
#    But AGPL license still applies to the code
```

**License implications:**

| Scenario | AGPL Requirement |
|---|---|
| Customer runs your code unmodified | Nothing (private use) |
| Customer modifies and offers as network service | Must share source |
| Customer removes your copyright/license | Violation — enforceable |
| Customer revokes your repo access | You lose write access, license survives |

### 5.10 Migration from Pure Forks

For existing forked customers, migrate incrementally:

```bash
# 1. Extract shared code into goldstein-core repo
# 2. In each customer fork, replace shared files with submodule
cd customer-a
git rm -r src/components src/context functions/api src/siteConfig.ts
git submodule add https://github.com/KaiNeumann/goldstein-core.git core
# Move customer-specific files out of core's path
# Update imports to reference core/
git add .
git commit -m "refactor: migrate to shared core submodule"
```

This can be done one customer at a time, with no rush.

### 5.11 File Changes Summary

| File | Action | Description |
|---|---|---|
| `docs/todo/shared-core-design.md` | **New** | This design document |
| `templates/site.json.example` | **New** | Template site config for new customers |
| `templates/package.json.example` | **New** | Template package.json with core dependency |

**Lines of code estimate:** ~150 lines across 3 new files (documentation + templates).

### 5.12 What Does NOT Change

- **Existing forks continue to work** — migration is optional and incremental
- **Admin panel** — unchanged
- **Content model** — unchanged
- **Build system** — unchanged (Vite still builds from customer repo)
- **Deployment** — unchanged (Cloudflare Pages still auto-deploys from customer repo)

### 5.13 Future Extensions

| Extension | Depends On | Complexity |
|---|---|---|
| Core version dashboard (see which customers are on which version) | Option D | Low |
| npm package fallback (for customers who prefer npm over git submodules) | Option C | Medium |
| Renovate for more granular update control | Option D | Low |

---

*End of Chapter 5.*
