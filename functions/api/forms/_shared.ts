import { json } from "../_shared";

const MIN_SUBMIT_MS = 2000;

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function getClientIp(request: Request): string {
  const cfIp = request.headers.get("CF-Connecting-IP");
  if (cfIp) return cfIp;
  const forwarded = request.headers.get("X-Forwarded-For");
  if (forwarded) return forwarded.split(",")[0].trim();
  return "unknown";
}

export function shouldIgnoreSubmission(body: { website?: string; submittedAt?: number }): boolean {
  if (body.website) return true;
  return !!body.submittedAt && Date.now() - body.submittedAt < MIN_SUBMIT_MS;
}

export async function postWebhook(url: string, payload: unknown, errorMessage: string): Promise<Response | null> {
  try {
    const webhookRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!webhookRes.ok) {
      return json({ error: errorMessage }, 500);
    }

    return null;
  } catch {
    return json({ error: "Interner Fehler." }, 500);
  }
}
