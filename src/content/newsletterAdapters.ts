export interface NewsletterInput {
  email: string;
  name?: string;
  formId?: string;
}

export interface NewsletterResult {
  success: boolean;
  error?: string;
}

export interface NewsletterAdapter {
  subscribe(input: NewsletterInput): Promise<NewsletterResult>;
}

export interface WebhookConfig {
  endpointUrl: string;
  headers?: Record<string, string>;
}

export class WebhookAdapter implements NewsletterAdapter {
  private config: WebhookConfig;

  constructor(config: WebhookConfig) {
    this.config = config;
  }

  async subscribe(input: NewsletterInput): Promise<NewsletterResult> {
    try {
      const res = await fetch(this.config.endpointUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...this.config.headers,
        },
        body: JSON.stringify(input),
      });

      if (!res.ok) {
        return { success: false, error: `Webhook error ${res.status}` };
      }

      return { success: true };
    } catch (err) {
      return { success: false, error: "Webhook-Anfrage fehlgeschlagen." };
    }
  }
}

export class MailtoAdapter implements NewsletterAdapter {
  private recipientEmail: string;

  constructor(recipientEmail: string) {
    this.recipientEmail = recipientEmail;
  }

  async subscribe(input: NewsletterInput): Promise<NewsletterResult> {
    const subject = `Newsletter-Anmeldung: ${input.email}`;
    const body = `Neue Newsletter-Anmeldung:\n\nE-Mail: ${input.email}\nName: ${input.name || "nicht angegeben"}\nFormular-ID: ${input.formId || "default"}`;
    const mailtoUrl = `mailto:${this.recipientEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
    return { success: true };
  }
}

export function createAdapter(
  strategy: string,
  envPrefix?: string
): NewsletterAdapter | null {
  switch (strategy) {
    case "webhook": {
      const url = typeof globalThis !== "undefined"
        ? (globalThis as any)[`${envPrefix || "NEWSLETTER"}_WEBHOOK_URL`]
        : undefined;
      if (!url) return null;
      return new WebhookAdapter({ endpointUrl: url });
    }
    case "mailto":
      return new MailtoAdapter(
        (globalThis as any)?.SITE_EMAIL || "info@example.de"
      );
    default:
      return null;
  }
}
