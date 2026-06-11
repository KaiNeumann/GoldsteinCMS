import type { Env } from "./_shared";
import { fetchGist, isConfigured, json } from "./_shared";

export async function onRequestGet(context: { env: Env }): Promise<Response> {
  const { env } = context;
  if (!isConfigured(env)) {
    return json({ error: "Remote backend ist nicht konfiguriert" }, 503);
  }

  try {
    const remote = await fetchGist(env);
    return json(remote);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Unbekannter Fehler" }, 502);
  }
}
