import type { Env } from "./_shared";
import { createBackupFiles, fetchGist, fetchGistWithAudit, isConfigured, isValidSession, json, sanitizeContentData, saveGist, type AuditEntry } from "./_shared";

interface PublishBody {
  data?: unknown;
  baseVersion?: string;
  editor?: string;
  summary?: string;
}

export async function onRequestPost(context: { request: Request; env: Env }): Promise<Response> {
  const { request, env } = context;
  if (!isConfigured(env)) {
    return json({ error: "Remote backend ist nicht konfiguriert" }, 503);
  }
  if (!(await isValidSession(request, env))) {
    return json({ error: "Sitzung abgelaufen. Bitte erneut anmelden." }, 401);
  }

  const body = await request.json().catch(() => null) as PublishBody | null;
  if (!body?.data) return json({ error: "Inhalt fehlt" }, 400);
  if (!body.editor?.trim()) return json({ error: "Name der bearbeitenden Person fehlt" }, 400);
  if (!body.summary?.trim()) return json({ error: "Kurzbeschreibung der Änderung fehlt" }, 400);

  try {
    const remote = await fetchGist(env);
    if (body.baseVersion && remote.version && body.baseVersion !== remote.version) {
      return json({ error: "Zwischenzeitliche Änderung erkannt. Bitte zuerst 'Von GitHub laden' klicken." }, 409);
    }

    const withAudit = await fetchGistWithAudit(env);
    const sanitizedData = sanitizeContentData(body.data);
    const timestamp = new Date().toISOString();
    const auditEntry: AuditEntry = {
      timestamp,
      editor: body.editor.trim(),
      summary: body.summary.trim(),
    };
    const audit = [auditEntry, ...withAudit.audit].slice(0, 300);
    const { extraFiles, deleteFiles } = createBackupFiles(withAudit.data, withAudit.files, timestamp);

    await saveGist(env, sanitizedData, audit, extraFiles, deleteFiles);
    const latest = await fetchGist(env);
    return json({ ok: true, version: latest.version });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Unbekannter Fehler" }, 502);
  }
}
