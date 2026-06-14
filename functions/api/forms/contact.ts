import { json } from "../_shared";
import { getClientIp, isValidEmail, postWebhook, shouldIgnoreSubmission } from "./_shared";

interface ContactPayload {
  formId?: string;
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  privacyAccepted?: boolean;
  website?: string;
  submittedAt?: number;
}

const MAX_MESSAGE_LENGTH = 4000;

export const onRequestPost: PagesFunction = async (context) => {
  const request = context.request;
  const env = context.env as any;

  let body: ContactPayload;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Ungültige Anfrage." }, 400);
  }

  if (shouldIgnoreSubmission(body)) {
    return json({ success: true });
  }

  if (!body.name?.trim()) {
    return json({ error: "Name ist erforderlich." }, 400);
  }
  if (!body.email?.trim() || !isValidEmail(body.email)) {
    return json({ error: "Gültige E-Mail-Adresse ist erforderlich." }, 400);
  }
  if (!body.message?.trim()) {
    return json({ error: "Nachricht ist erforderlich." }, 400);
  }
  if (body.message.length > MAX_MESSAGE_LENGTH) {
    return json({ error: "Nachricht ist zu lang." }, 400);
  }

  if (env.CONTACT_WEBHOOK_URL) {
    const webhookError = await postWebhook(env.CONTACT_WEBHOOK_URL, {
      formId: body.formId || "default",
      name: body.name,
      email: body.email,
      phone: body.phone || "",
      subject: body.subject || "Kontaktanfrage",
      message: body.message,
      timestamp: new Date().toISOString(),
      ip: getClientIp(request),
    }, "Nachricht konnte nicht gesendet werden.");

    if (webhookError) return webhookError;
    return json({ success: true });
  }

  if (env.CONTACT_EMAIL_RECIPIENT) {
    return json({ error: "E-Mail-Versand ist noch nicht implementiert." }, 501);
  }

  return json({ error: "Kein Ziel konfiguriert. Bitte kontaktieren Sie den Website-Betreiber." }, 500);
};
