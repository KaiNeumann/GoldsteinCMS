# Design Document — Lightweight Cookie Consent Management

**Status:** Proposed  
**Date:** 2026-06-12  
**Goal:** Add a first-party, lightweight cookie/external-service consent system that fits GoldsteinCMS' static architecture and can help keep the public cookie UI aligned with the site's Datenschutzerklärung.

---

## 1. Motivation

Customer websites often need to embed third-party services:

- Google Maps or OpenStreetMap
- YouTube or Vimeo
- Instagram/Facebook links or feeds
- Newsletter providers
- Analytics
- External shop widgets

The current Floral Manufaktur site uses Usercentrics. GoldsteinCMS does not currently include a consent layer. Without one, customer deployments must either avoid all consent-relevant embeds or integrate an external consent-management platform per site.

GoldsteinCMS should support a smaller first-party alternative for simple sites: explicit consent categories, service descriptions, blocked placeholders, and a cookie settings dialog.

---

## 2. Scope

### In Scope

- First-party consent banner/dialog.
- Configurable consent categories and services.
- Store consent choices locally in the visitor browser.
- Block external embeds/scripts until consent is granted.
- Render service placeholders with an explicit "load" action.
- Provide a reusable "Cookie-Einstellungen" link/component.
- Generate or insert a service summary that can be reused in the Datenschutzerklärung.
- No external dependency.

### Out Of Scope

- Legal guarantee of DSGVO compliance.
- IAB TCF support.
- Vendor database synchronization.
- Geo/IP-based behavior.
- Server-side consent logging.
- Complex A/B testing or advertising consent stacks.
- Automatic legal text generation without human review.

---

## 3. Design Constraints

| Constraint | Rationale |
|---|---|
| Static frontend compatible | Must work on Cloudflare Pages without a traditional backend. |
| No new dependency by default | Keep bundle small and simple. |
| Explicit over clever | Editors/admins should understand which services are blocked and why. |
| Consent before network request | External iframes/scripts must not load before consent. |
| Works in CMS HTML content | Embedded components can appear inside editor-authored content. |
| German UI first | Existing CMS UI is German. |
| Not a legal authority | The tool supports legal documentation but does not replace legal review. |

---

## 4. Recommended Architecture

Use a small consent registry configured in `site.json` and a client-side consent manager.

```text
site.json consent config
  -> ConsentProvider loads config
  -> Banner/Dialog reads services/categories
  -> Components ask consent manager before loading embeds/scripts
  -> Datenschutzerklärung can render service summaries from same config
```

---

## 5. Consent Configuration

Add a `consent` section to `site.json`.

```jsonc
{
  "consent": {
    "enabled": true,
    "version": "2026-06-12",
    "privacyPagePath": "/datenschutz",
    "categories": [
      {
        "id": "necessary",
        "label": "Notwendig",
        "description": "Erforderlich für den sicheren Betrieb der Website.",
        "required": true
      },
      {
        "id": "externalMedia",
        "label": "Externe Medien",
        "description": "Erlaubt das Laden externer Karten, Videos oder Social-Media-Inhalte.",
        "required": false
      },
      {
        "id": "analytics",
        "label": "Statistik",
        "description": "Hilft uns zu verstehen, wie die Website genutzt wird.",
        "required": false
      }
    ],
    "services": [
      {
        "id": "openstreetmap",
        "category": "externalMedia",
        "label": "OpenStreetMap",
        "provider": "OpenStreetMap Foundation",
        "purpose": "Anzeige interaktiver Karten und Wegbeschreibungen.",
        "privacyUrl": "https://wiki.osmfoundation.org/wiki/Privacy_Policy",
        "hosts": ["www.openstreetmap.org", "www.openstreetmap.de"]
      },
      {
        "id": "youtube",
        "category": "externalMedia",
        "label": "YouTube",
        "provider": "Google Ireland Limited",
        "purpose": "Anzeige eingebetteter Videos.",
        "privacyUrl": "https://policies.google.com/privacy",
        "hosts": ["www.youtube-nocookie.com", "www.youtube.com"]
      }
    ]
  }
}
```

---

## 6. Stored Consent Format

Use `localStorage` with a versioned payload.

Key:

```text
goldstein_consent
```

Value:

```json
{
  "version": "2026-06-12",
  "decidedAt": "2026-06-12T10:30:00.000Z",
  "categories": {
    "necessary": true,
    "externalMedia": true,
    "analytics": false
  },
  "services": {
    "openstreetmap": true,
    "youtube": false
  }
}
```

If the configured consent `version` changes, show the banner again.

---

## 7. Public UI

### 7.1 Banner

Show a compact bottom banner when no current consent exists.

Actions:

- `Alle akzeptieren`
- `Nur notwendige`
- `Einstellungen`

### 7.2 Settings Dialog

The dialog should list categories and services with toggles.

Required categories are visible but locked.

Actions:

- Save selection
- Accept all
- Reject optional

### 7.3 Cookie Settings Link

Expose a component and a global event:

```tsx
<CookieSettingsLink />
```

And for CMS HTML content:

```html
<button class="gf-cookie-settings">Cookie-Einstellungen</button>
```

The DOM enhancer can attach a click handler to `.gf-cookie-settings`.

---

## 8. Blocking External Content

### 8.1 Preferred Pattern: Consent-Aware Components

Create React components that only load external content after consent:

```tsx
<ConsentEmbed service="openstreetmap" src="https://www.openstreetmap.org/export/embed.html?..." title="Karte" />
```

Before consent, render a placeholder:

```text
Karte von OpenStreetMap laden?
Dabei werden Daten an OpenStreetMap übertragen.
[Einmalig laden] [Dauerhaft erlauben]
```

### 8.2 CMS HTML Pattern

For editor-authored content, allow semantic placeholders:

```html
<div
  class="gf-consent-embed"
  data-service="openstreetmap"
  data-src="https://www.openstreetmap.org/export/embed.html?..."
  data-title="Karte zur Floral Manufaktur">
</div>
```

The DOM enhancer turns this into an iframe after consent.

### 8.3 Script Loading

For analytics or external scripts, use an explicit loader:

```ts
registerConsentScript({
  service: "matomo",
  src: "https://analytics.example.org/matomo.js",
  init: () => { /* optional */ }
});
```

Do not allow arbitrary script tags inside CMS-authored HTML.

---

## 9. Alignment With Datenschutzerklärung

The consent config should become the source of truth for the visible service list, but not for the complete legal text.

Add a reusable component:

```tsx
<ConsentServiceSummary />
```

And CMS markup:

```html
<div class="gf-consent-service-summary"></div>
```

The generated section should list:

- Service label
- Provider
- Purpose
- Category
- Privacy policy URL
- Hosts/domains, if configured

This helps avoid drift between the actual consent configuration and the Datenschutz page.

Important: the Datenschutzerklärung should still contain human-reviewed legal text for hosting, contact forms, newsletter, and business-specific processing.

---

## 10. Admin Integration

Initial implementation can keep consent config in `site.json` only.

Later admin support could include:

- Enable/disable consent system.
- Edit service labels and purposes.
- Add map/video embed blocks through the Component Builder, especially consent-aware YouTube blocks.
- Warn when a CMS HTML field contains an external iframe without consent wrapper.
- Insert consent service summary into Datenschutz content.

Recommendation: start with config-only consent. Add admin editing only after real deployments reveal which fields need editor access.

---

## 11. Sanitization Rules

The sanitizer should allow the consent placeholder markup but not arbitrary iframes/scripts.

Allowed for CMS embeds:

- `div.gf-consent-embed`
- `div.gf-youtube`
- `data-service`
- `data-src`
- `data-title`
- `data-height`
- `data-width`
- `data-video-id`
- `data-aspect`

Validation:

- `data-service` must match configured service ID.
- `data-src` host must match the service `hosts` allowlist.
- Protocol must be `https:`.
- YouTube video IDs must be parsed into `youtube-nocookie.com` embed URLs instead of accepting arbitrary iframe URLs.
- Reject `javascript:`, `data:`, unknown hosts, and inline script/event handlers.

---

## 12. Accessibility

- Banner/dialog must be keyboard navigable.
- Dialog should trap focus while open.
- Buttons need clear labels.
- Placeholders should explain what will load and why consent is needed.
- Do not rely on color alone to indicate enabled/disabled state.

---

## 13. Limitations

This system is intentionally lightweight. It is suitable for small brochure sites with a limited number of external services. It is not a replacement for enterprise CMP platforms when customers need:

- IAB TCF
- ad networks
- vendor auto-discovery
- detailed consent logs
- multi-region privacy logic

For those cases, support external CMP integration as a deployment-specific customization.

---

## 14. Estimated Implementation

| Task | Files | Complexity |
|---|---|---|
| Add consent types to site config | `src/siteConfig.ts`, `site.json` | Low |
| Create consent state/provider | `src/context/ConsentContext.tsx` | Medium |
| Add banner/dialog components | `src/components/consent/*` | Medium |
| Add consent-aware embed component | `src/components/consent/ConsentEmbed.tsx` | Low-Medium |
| Enhance CMS placeholders | `src/components/cms-enhance.ts` | Medium |
| Add service summary renderer | `src/components/consent/ConsentServiceSummary.tsx` | Low |
| Add sanitizer/validation checks | client/server sanitizer helpers | Medium |
| Update Datenschutz guidance | docs/user guide/templates | Low |

---

## 15. Open Questions

- Should consent be category-based only, or allow per-service toggles from the start?
- Should one-time loading of a single embed be stored only in memory, or also persisted?
- Should necessary cookies be listed even when the public site uses no visitor cookies?
- Should the admin warn if the Datenschutz page lacks the service summary component?
- Should Cloudflare Web Analytics, if ever added, be treated as necessary or statistics?

---

## 16. Recommendation

Implement a first-party consent system with category and service configuration in `site.json`, local browser storage, consent-aware embed components, and an auto-rendered service summary for the Datenschutz page. Keep it intentionally small and allow external CMPs as a customer-specific alternative when legal or vendor requirements exceed this scope.
