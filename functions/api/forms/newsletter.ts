import { json } from "../_shared";
import { getClientIp, isValidEmail, postWebhook, shouldIgnoreSubmission } from "./_shared";

interface NewsletterPayload {
  formId?: string;
  email: string;
  name?: string;
  privacyAccepted?: boolean;
  website?: string;
  submittedAt?: number;
}

export const onRequestPost: PagesFunction = async (context) => {
  const request = context.request;
  const env = context.env as any;

  let body: NewsletterPayload;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Ungültige Anfrage." }, 400);
  }

  if (shouldIgnoreSubmission(body)) {
    return json({ success: true });
  }

  if (!body.email?.trim() || !isValidEmail(body.email)) {
    return json({ error: "Gültige E-Mail-Adresse ist erforderlich." }, 400);
  }

  const webhookUrl = env.NEWSLETTER_WEBHOOK_URL;
  if (webhookUrl) {
    const webhookError = await postWebhook(webhookUrl, {
      formId: body.formId || "default",
      email: body.email,
      name: body.name || "",
      status: "pending",
      timestamp: new Date().toISOString(),
      ip: getClientIp(request),
    }, "Anmeldung konnte nicht verarbeitet werden.");

    if (webhookError) return webhookError;
    return json({ success: true });
  }

  if (env.NEWSLETTER_API_URL && env.NEWSLETTER_API_KEY) {
    return json({ error: "Newsletter-Provider-Integration ist noch nicht implementiert." }, 501);
  }

  return json({ error: "Kein Newsletter-Backend konfiguriert. Bitte kontaktieren Sie den Website-Betreiber." }, 500);
};
