# GoldsteinCMS Shared Core Architecture

This document describes how to use the shared core pattern for deploying GoldsteinCMS to multiple customers.

## Overview

The shared core pattern extracts reusable code into a separate repository (`goldstein-core`), while each customer instance maintains its own repository with customizations. This provides:

- **Code reuse** — shared components, context, API functions, and utilities
- **Customer independence** — each customer owns their repository
- **Safe updates** — customers pin to specific core versions
- **No blast radius** — updates propagate one customer at a time

## Architecture

```text
goldstein-core/           ← Shared repository
  src/
    components/           ← Reusable UI components
    context/              ← React context providers
    content/              ← Content schema and defaults
    functions/            ← Cloudflare Pages Functions
  templates/              ← Customer onboarding templates
  docs/                   ← Documentation

customer-repo/            ← Customer instance
  core/                   ← Git submodule (pinned to core version)
  site.json               ← Site structure config
  src/
    index.css             ← Theme overrides
    pages/                ← Customer-specific pages
    App.tsx               ← Entry point (imports from core)
  public/
    images/               ← Customer-specific images
```

## Core/Custom Boundary

### What Goes in the Shared Core

| Location | Contents |
|---|---|
| `src/components/` | Layout, ThemeToggle, widgets, footer columns, CmsContent |
| `src/context/` | ContentContext provider |
| `src/content/` | Default content schema and utilities |
| `src/siteConfig.ts` | TypeScript types for site.json |
| `src/pageRegistry.ts` | Route-to-component mapping |
| `src/utils/` | Utility functions (cn, etc.) |
| `functions/api/` | All Cloudflare Pages Functions |
| `docs/` | Documentation (DEPLOY.md, BACKUP.md, USER-GUIDE.md) |
| `templates/` | Customer onboarding templates |

### What Stays in the Customer Repo

| Location | Contents |
|---|---|
| `site.json` | Site structure configuration |
| `src/index.css` | Theme overrides (CSS Custom Properties) |
| `src/pages/` | Customer-specific page components |
| `src/App.tsx` | Entry point (imports from core) |
| `public/images/` | Customer-specific images |
| `index.html` | SPA entry point |
| `package.json` | Dependencies |
| `vite.config.ts` | Build configuration |

## Onboarding a New Customer

### Prerequisites

- Node.js 20+
- npm
- Git

### Quick Start

```bash
# Clone the onboarding script
git clone https://github.com/KaiNeumann/goldstein-core.git
cd goldstein-core

# Run the onboarding script
./scripts/onboard.sh customer-name https://github.com/KaiNeumann/goldstein-core.git v1.2.0
```

### Manual Setup

```bash
# 1. Create customer directory
mkdir customer-name && cd customer-name

# 2. Initialize git
git init && git checkout -b main

# 3. Add core submodule
git submodule add https://github.com/KaiNeumann/goldstein-core.git core
cd core && git checkout v1.2.0 && cd ..

# 4. Create site.json (copy from template)
cp core/templates/site.json.example site.json

# 5. Install dependencies
npm install

# 6. Configure and deploy
# Edit site.json, src/index.css, then push to Cloudflare Pages
```

## Updating the Core

### Security Fix (All Customers)

```bash
# 1. Fix in core repo
cd goldstein-core
git checkout -b fix/xss-sanitization
# ... make fix ...
git commit -m "fix: prevent XSS via img onerror"

# 2. Test on one customer
cd ../customer-a
cd core && git fetch && git checkout fix/xss-sanitization && cd ..
npm run build

# 3. Merge and tag in core
cd ../goldstein-core
git checkout main
git merge fix/xss-sanitization
git tag v1.2.1
git push origin main --tags

# 4. Update remaining customers
for customer in customer-b customer-c; do
  cd ../$customer
  cd core && git fetch && git checkout v1.2.1 && cd ..
  git add core
  git commit -m "chore: update core to v1.2.1 (security fix)"
  git push
done
```

### Feature Update (Opt-In)

```bash
# 1. Release new version
cd goldstein-core
git tag v1.3.0
git push origin main --tags

# 2. Customer updates when ready
cd customer-a
cd core && git fetch && git checkout v1.3.0 && cd ..
git add core
git commit -m "chore: update core to v1.3.0"
git push
```

## Automated Update PRs

When managing customer repos yourself, set up Dependabot for automated update PRs.

### Dependabot Configuration

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

### How It Works

1. You release a new core version (tag + release notes)
2. Dependabot detects the new tag (daily check)
3. PR is opened in each customer repo
4. CI runs on the PR (build + smoke tests)
5. You review and merge
6. Cloudflare Pages auto-deploys

### Semantic Versioning

| Change | Tag | Example |
|--------|-----|---------|
| Bug fix | `v1.2.1` | Fix XSS in sanitizer |
| Feature | `v1.3.0` | Add callout widget |
| Breaking | `v2.0.0` | Change site.json schema |

## Customer-Owned Repos

When a customer wants the code in their own GitHub organization:

1. Customer creates their own repo
2. You transfer or they clone
3. Submodule still points to your core repo
4. If core is private, customer needs read access:
   ```bash
   gh repo add-collaborator KaiNeumann/goldstein-core customer-dev --permission pull
   ```

### License Implications

| Scenario | AGPL Requirement |
|---|---|
| Customer runs your code unmodified | Nothing (private use) |
| Customer modifies and offers as network service | Must share source |
| Customer removes your copyright/license | Violation — enforceable |
| Customer revokes your repo access | You lose write access, license survives |

## Migration from Pure Forks

For existing forked customers, migrate incrementally:

```bash
# 1. Extract shared code into goldstein-core repo
# 2. In each customer fork, replace shared files with submodule
cd customer-a
git rm -r src/components src/context functions/api src/siteConfig.ts
git submodule add https://github.com/KaiNeumann/goldstein-core.git core
# Update imports to reference core/
git add .
git commit -m "refactor: migrate to shared core submodule"
```

## Troubleshooting

| Issue | Solution |
|---|---|
| Submodule not found | Run `git submodule update --init --recursive` |
| Build fails after update | Check core version compatibility, check import paths |
| Core changes not reflected | Run `cd core && git pull && cd .. && git add core` |
| TypeScript errors | Ensure `vite.config.ts` has correct aliases for `goldstein-core` |

## Further Reading

- `docs/todo/shared-core-design.md` — Full design document
- `docs/todo/cms-components-design.md` — CMS component architecture
- `docs/implementation-plan.md` — Migration roadmap
