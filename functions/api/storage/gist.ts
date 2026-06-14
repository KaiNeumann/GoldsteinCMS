import type { AuditEntry } from "../_shared";
import type { ContentStorage } from "./types";

export const gistStorage: ContentStorage = {
  async fetchContent(env): Promise<{ data: unknown; version: string }> {
    const { data, version } = await this.fetchContentWithAudit(env);
    return { data, version };
  },

  async fetchContentWithAudit(env): Promise<{ data: unknown; version: string; audit: AuditEntry[]; files: string[] }> {
    const res = await fetch(`https://api.github.com/gists/${env.GITHUB_GIST_ID}`, {
      headers: {
        Authorization: `Bearer ${env.GITHUB_TOKEN}`,
        "User-Agent": "goldsteinfreunde-cms",
        Accept: "application/vnd.github+json",
      },
    });

    if (!res.ok) {
      throw new Error(`Gist kann nicht geladen werden (${res.status})`);
    }

    const gist = await res.json() as {
      updated_at?: string;
      files?: Record<string, { content?: string }>;
    };
    const contentFile = gist.files?.["content.json"];
    if (!contentFile?.content) throw new Error("content.json fehlt im Gist");

    const auditFile = gist.files?.["audit-log.json"];
    let audit: AuditEntry[] = [];
    if (auditFile?.content) {
      try {
        const parsed = JSON.parse(auditFile.content) as AuditEntry[];
        if (Array.isArray(parsed)) audit = parsed;
      } catch {
        audit = [];
      }
    }

    return {
      data: JSON.parse(contentFile.content),
      version: gist.updated_at || "",
      audit,
      files: Object.keys(gist.files || {}),
    };
  },

  async saveContent(env, content, audit?, extraFiles?, deleteFiles?): Promise<void> {
    const files: Record<string, { content: string } | null> = {
      "content.json": { content: JSON.stringify(content, null, 2) },
    };
    if (audit) {
      files["audit-log.json"] = { content: JSON.stringify(audit, null, 2) };
    }
    for (const [name, fileContent] of Object.entries(extraFiles || {})) {
      files[name] = { content: fileContent };
    }
    for (const name of deleteFiles || []) {
      files[name] = null;
    }

    const res = await fetch(`https://api.github.com/gists/${env.GITHUB_GIST_ID}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${env.GITHUB_TOKEN}`,
        "Content-Type": "application/json",
        "User-Agent": "goldsteinfreunde-cms",
        Accept: "application/vnd.github+json",
      },
      body: JSON.stringify({
        files,
      }),
    });

    if (!res.ok) {
      throw new Error(`Fehler beim Speichern (${res.status})`);
    }
  },
};
