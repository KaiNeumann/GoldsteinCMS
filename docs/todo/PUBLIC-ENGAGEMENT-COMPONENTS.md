# Design Document — Public Engagement Components

**Status:** Proposed  
**Date:** 2026-06-12  
**Goal:** Add reusable CMS components for social media links, contact forms, and newsletter subscriptions while keeping the system lightweight and avoiding a full CRM/newsletter platform inside GoldsteinCMS.

---

## 1. Motivation

Most customer websites need a small set of public engagement features:

- Links to social media profiles
- A contact form or contact call-to-action
- Newsletter subscription form

The current GoldsteinCMS can display links and HTML, but these features are not modeled as reusable components. Floral Manufaktur is a good example: the site has Facebook/Instagram links, a contact form, and a newsletter form. GoldsteinCMS can display those visually, but it currently cannot submit contact/newsletter data anywhere.

The goal is to add reusable frontend/admin primitives and minimal backend handoff points without building a complete marketing automation system.

Rich editorial components such as YouTube embeds, PDF readers, service cards, and process-step cards are covered separately in `docs/todo/RICH-CONTENT-COMPONENTS.md`.

---

## 2. Scope

### In Scope

- Social media link component/widget.
- Config-driven social profile list.
- Contact form component with pluggable submission strategies.
- Newsletter subscription component with pluggable handoff strategies.
- Consent/privacy text support for forms.
- Honeypot/rate-limit basics for form endpoints.
- Preparation for handoff to external/open-source newsletter tools.

### Out Of Scope

- Newsletter authoring.
- Newsletter campaign delivery.
- Subscriber management UI.
- CRM/ticketing system.
- Payment/order handling.
- Full anti-spam service integration unless configured per deployment.

---

## 3. Design Constraints

| Constraint | Rationale |
|---|---|
| Static-first | The public site should remain mostly static and fast. |
| Cloudflare Pages compatible | Backend features should use Pages Functions when needed. |
| Pluggable submission | Different customers will use different email/newsletter providers. |
| No secrets in frontend | API keys and SMTP credentials must remain server-side. |
| Minimal default behavior | A deployment should not accidentally collect personal data without configuration. |
| DSGVO-aware | Forms need purpose text, required consent checkbox where appropriate, and Datenschutz links. |

---

## 4. Shared Configuration

These components should use the proposed schema-driven content fields where possible.

Example field values:

```json
{
  "social.links": [
    { "platform": "facebook", "label": "Facebook", "url": "https://facebook.com/floralmanufaktur" },
    { "platform": "instagram", "label": "Instagram", "url": "https://instagram.com/floralmanufaktur" }
  ],
  "contact.recipientLabel": "Floral Manufaktur",
  "contact.email": "brodda@floralmanufaktur.de",
  "forms.contact.enabled": true,
  "forms.contact.privacyText": "Ihre Angaben werden ausschließlich zur Bearbeitung Ihrer Anfrage verwendet.",
  "forms.newsletter.enabled": true,
  "forms.newsletter.provider": "brevo",
  "forms.newsletter.privacyText": "Sie können den Newsletter jederzeit wieder abbestellen."
}
```

Deployment-only secrets and provider details should stay in environment variables.

---

## 5. Social Media Links

### 5.1 Component

Add a reusable component:

```tsx
<SocialLinks variant="icons" />
```

Supported variants:

- `icons`: icon buttons with accessible labels.
- `list`: text links for footer/legal contexts.
- `cards`: larger CTA cards for homepage sections.

### 5.2 CMS Markup

Allow editor-authored insertion:

```html
<div class="gf-social-links" data-variant="icons"></div>
```

The DOM enhancer can replace this with links from `social.links`, or this can be rendered through a React page/widget when used in structured layout.

### 5.3 Platform Handling

Start with a small internal icon map:

- Facebook
- Instagram
- LinkedIn
- YouTube
- TikTok
- Pinterest
- Mastodon
- Website/link fallback

Avoid adding icon libraries if possible. Use inline SVGs for common platforms and a generic external-link icon as fallback.

### 5.4 Validation

- URL must be `https:` unless explicitly configured otherwise.
- `platform` should be normalized lowercase.
- Render external links with `rel="noopener noreferrer"`.
- Add accessible `aria-label`, e.g. `Floral Manufaktur auf Instagram öffnen`.

---

## 6. Contact Form

### 6.1 Component

```tsx
<ContactForm formId="default" />
```

Initial fields:

- Name
- Email
- Phone optional
- Subject optional
- Message
- Privacy consent checkbox
- Honeypot field hidden from users

### 6.2 Submission Strategies

Support multiple strategies through config.

| Strategy | Description | Suitable For |
|---|---|---|
| `mailto` | Opens user's email client with prefilled content. | Lowest complexity, no backend. |
| `cloudflare-email` | Pages Function sends email via configured provider/API. | Most small business sites. |
| `webhook` | POST to configured endpoint. | CRM/helpdesk integrations. |
| `disabled` | Render contact details only. | Sites avoiding forms. |

Recommendation: implement `mailto` and `webhook` first, then add an email provider once selected.

### 6.3 Backend Endpoint

For backend-backed forms:

```text
POST /api/forms/contact
```

Payload:

```json
{
  "formId": "default",
  "name": "Jane Doe",
  "email": "jane@example.org",
  "phone": "",
  "subject": "Anfrage",
  "message": "Hallo...",
  "privacyAccepted": true,
  "website": ""
}
```

The `website` field is a honeypot. If filled, return success without sending.

### 6.4 Server-Side Validation

- Required fields present.
- Email format plausible.
- Message length within limit.
- Privacy checkbox accepted if configured.
- Honeypot empty.
- Rate limit by IP/session where possible.
- Never return detailed provider errors to the public client.

### 6.5 Privacy

The form must link to Datenschutz and include purpose text. If using the cookie consent system, contact form processing should also be represented in the Datenschutz page, but it is usually not a cookie-consent category because the user explicitly submits the form.

---

## 7. Newsletter Subscription

### 7.1 Component

```tsx
<NewsletterSignup formId="default" />
```

Initial fields:

- Email
- Name optional
- Privacy/consent checkbox
- Honeypot field

The component should make clear that submission is a subscription request and may require double opt-in depending on provider.

### 7.2 Backend Endpoint

```text
POST /api/forms/newsletter
```

Payload:

```json
{
  "formId": "default",
  "email": "jane@example.org",
  "name": "Jane Doe",
  "privacyAccepted": true,
  "website": ""
}
```

### 7.3 Handoff Strategies

| Strategy | Description |
|---|---|
| `mailto` | Sends subscription request by email. Simple but manual. |
| `webhook` | POST subscriber data to a configured endpoint. |
| `csv-export` | Store pending subscribers for manual export. Requires careful privacy handling. |
| `listmonk` | Handoff to Listmonk API. |
| `mailtrain` | Handoff to Mailtrain API. |
| `mautic` | Handoff to Mautic contact API. |
| `brevo` | Handoff to Brevo API. Commercial but common in Germany/EU. |
| `mailchimp` | Handoff to Mailchimp API. Common but less ideal for privacy-sensitive EU customers. |

Recommendation: design the provider adapter interface first and implement only `webhook` plus one concrete provider when a real customer requires it.

### 7.4 Open-Source Newsletter Tools

GoldsteinCMS should prepare clean handoff adapters for popular open-source tools instead of building newsletter delivery.

Good candidates:

- Listmonk: lightweight, self-hosted, strong API, newsletter-focused.
- Mailtrain: self-hosted newsletter platform, more complex.
- Mautic: full marketing automation, heavier but widely used.

Adapter shape:

```ts
interface NewsletterAdapter {
  subscribe(input: NewsletterInput): Promise<NewsletterResult>;
}
```

Environment variables should hold provider secrets:

```text
NEWSLETTER_PROVIDER=listmonk
NEWSLETTER_API_URL=https://newsletter.example.org
NEWSLETTER_API_KEY=...
NEWSLETTER_LIST_ID=...
```

### 7.5 Double Opt-In

Do not implement double opt-in inside GoldsteinCMS initially. Delegate it to the newsletter provider whenever possible.

If using `webhook` or custom storage, mark the submitted address as `pending` and require a future DOI implementation before sending newsletters.

---

## 8. Component Builder Integration

Add new component types to the builder:

- `socialLinks`
- `contactForm`
- `newsletterSignup`

Generated markup examples:

```html
<div class="gf-social-links" data-variant="icons"></div>
```

```html
<div class="gf-contact-form" data-form-id="default"></div>
```

```html
<div class="gf-newsletter-signup" data-form-id="default"></div>
```

The DOM enhancer can mount lightweight React components or progressively enhance plain HTML placeholders.

Prefer rendering through React components where possible, because forms have state, validation, loading, and error handling.

---

## 9. Form Configuration

Add a `forms` config section to `site.json` or content fields.

```jsonc
{
  "forms": {
    "contact": {
      "enabled": true,
      "strategy": "webhook",
      "endpointEnv": "CONTACT_WEBHOOK_URL",
      "requirePrivacyConsent": true,
      "maxMessageLength": 4000
    },
    "newsletter": {
      "enabled": true,
      "strategy": "listmonk",
      "requirePrivacyConsent": true,
      "providerEnvPrefix": "NEWSLETTER"
    }
  }
}
```

Do not put secrets in `site.json`.

---

## 10. Anti-Spam And Abuse Protection

Start simple:

- Honeypot field.
- Minimum submit time, e.g. ignore submissions faster than 2 seconds after render.
- Server-side length limits.
- Basic IP rate limiting using Cloudflare primitives where available.
- Optional Turnstile integration later.

Cloudflare Turnstile should be considered a future enhancement, not a required first version. If added, it must be documented in the Datenschutzerklärung and possibly consent configuration depending on implementation and legal review.

---

## 11. Accessibility And UX

- All fields need labels.
- Errors should be associated with fields.
- Success and error messages should be announced to screen readers.
- Forms must work on mobile.
- Loading state should prevent duplicate submissions.
- Privacy text should be visible near the submit button.

---

## 12. Security

- Sanitize and validate all server-side inputs.
- Escape submitted values in email templates.
- Do not expose recipient email/API keys if using provider-backed delivery.
- Do not store submissions unless explicitly configured.
- Do not log full message bodies by default.
- Return generic public errors.

---

## 13. Datenschutz Alignment

The components should expose enough metadata to keep the privacy page accurate:

- Contact form purpose and retention hint.
- Newsletter provider, purpose, double opt-in behavior, unsubscribe behavior.
- Data categories collected.
- External provider privacy URL if applicable.

This metadata can feed the proposed cookie/privacy service summary, but contact/newsletter processing should still have dedicated Datenschutz sections because it involves intentionally submitted personal data.

---

## 14. Estimated Implementation

| Task | Files | Complexity |
|---|---|---|
| Add social link fields/types | `siteConfig.ts`, content schema | Low |
| Create `SocialLinks` component | `src/components/SocialLinks.tsx` | Low |
| Add social widget/footer option | layout/widget registry | Low |
| Create contact form component | `src/components/forms/ContactForm.tsx` | Medium |
| Create newsletter form component | `src/components/forms/NewsletterSignup.tsx` | Medium |
| Add form endpoints | `functions/api/forms/contact.ts`, `newsletter.ts` | Medium |
| Add provider adapter interfaces | `functions/api/forms/adapters/*` | Medium |
| Add webhook adapter | backend adapter | Low-Medium |
| Add Component Builder entries | `ComponentBuilder.tsx` | Medium |
| Add docs and Datenschutz guidance | docs/templates | Low |

---

## 15. Implementation Order

1. Social links component and config.
2. Contact form frontend with `mailto` strategy.
3. Contact form backend with `webhook` strategy.
4. Newsletter signup frontend with `webhook` strategy.
5. Newsletter provider adapter interface.
6. Add one real provider adapter when a deployment needs it.
7. Add Component Builder integration.

---

## 16. Open Questions

- Should form configuration live in `site.json` or editable content fields?
- Which first email delivery provider should be supported, if any?
- Should form submissions ever be stored in KV/Gist, or should GoldsteinCMS avoid storing personal data by default?
- Should newsletter signup support tags/interests in the first version?
- Should Turnstile be added before deploying any public forms?

---

## 17. Recommendation

Add social links first because they are low-risk and purely presentational. For contact and newsletter, implement reusable frontend components plus pluggable backend strategies, but avoid becoming a newsletter or CRM product. Prefer handoff to dedicated systems such as Listmonk, Mailtrain, Mautic, or customer-selected commercial providers.
