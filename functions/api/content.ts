import type { Env } from "./_shared";
import { isConfigured, json, selectStorage } from "./_shared";

export async function onRequestGet(context: { env: Env }): Promise<Response> {
  const { env } = context;
  if (!isConfigured(env)) {
    return json({ error: "Remote backend ist nicht konfiguriert" }, 503);
  }

  try {
    const storage = selectStorage(env);
    const remote = await storage.fetchContent(env);
    return json(remote);
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Unbekannter Fehler" }, 502);
  }
}
