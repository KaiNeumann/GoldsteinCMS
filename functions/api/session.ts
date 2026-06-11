import type { Env } from "./_shared";
import { isConfigured, isValidSession, json } from "./_shared";

export async function onRequestGet(context: { request: Request; env: Env }): Promise<Response> {
  const { request, env } = context;
  if (!isConfigured(env)) {
    return json({ authenticated: false, error: "Remote backend ist nicht konfiguriert" }, 503);
  }

  const authenticated = await isValidSession(request, env);
  return json({ authenticated });
}
