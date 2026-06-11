import type { Env } from "./_shared";
import { fetchGistWithAudit, isConfigured, isValidSession, json } from "./_shared";

export async function onRequestGet(context: { request: Request; env: Env }): Promise<Response> {
  const { request, env } = context;
  if (!isConfigured(env)) {
    return json({ error: "Remote backend ist nicht konfiguriert" }, 503);
  }
  if (!(await isValidSession(request, env))) {
    return json({ error: "Sitzung abgelaufen. Bitte erneut anmelden." }, 401);
  }

  try {
    const gist = await fetchGistWithAudit(env);
    return json({ audit: gist.audit.slice(0, 5) });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Unbekannter Fehler" }, 502);
  }
}
