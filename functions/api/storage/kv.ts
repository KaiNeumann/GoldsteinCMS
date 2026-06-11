import type { AuditEntry } from "../_shared";
import type { ContentStorage } from "./types";

const BACKUP_PREFIX = "backup-content-";
const MAX_BACKUPS = 30;

export const kvStorage: ContentStorage = {
  async fetchContent(env): Promise<{ data: unknown; version: string }> {
    const kv = env.CONTENT_KV as KVNamespace;

    const content = await kv.get("content");
    if (!content) throw new Error("content fehlt im KV");

    const { value: _, metadata } = await kv.getWithMetadata<{ version?: string }>("content");

    return {
      data: JSON.parse(content),
      version: metadata?.version || "",
    };
  },

  async fetchContentWithAudit(env): Promise<{ data: unknown; version: string; audit: AuditEntry[]; files: string[] }> {
    const kv = env.CONTENT_KV as KVNamespace;

    const content = await kv.get("content");
    if (!content) throw new Error("content fehlt im KV");

    const { value: _, metadata } = await kv.getWithMetadata<{ version?: string }>("content");

    const auditContent = await kv.get("audit");
    let audit: AuditEntry[] = [];
    if (auditContent) {
      try {
        const parsed = JSON.parse(auditContent) as AuditEntry[];
        if (Array.isArray(parsed)) audit = parsed;
      } catch {
        audit = [];
      }
    }

    const backupsList = await kv.list({ prefix: BACKUP_PREFIX });
    const files = backupsList.keys.map((k) => k.name);

    return {
      data: JSON.parse(content),
      version: metadata?.version || "",
      audit,
      files,
    };
  },

  async saveContent(env, content, audit?, extraFiles?, deleteFiles?): Promise<void> {
    const kv = env.CONTENT_KV as KVNamespace;
    const version = new Date().toISOString();

    await kv.put("content", JSON.stringify(content, null, 2), {
      metadata: { version },
    });

    if (audit) {
      await kv.put("audit", JSON.stringify(audit, null, 2));
    }

    if (extraFiles) {
      for (const [name, fileContent] of Object.entries(extraFiles)) {
        await kv.put(name, fileContent);
      }
    }

    if (deleteFiles) {
      for (const name of deleteFiles) {
        await kv.delete(name);
      }
    }

    const backupsList = await kv.list({ prefix: BACKUP_PREFIX });
    const backupKeys = backupsList.keys.map((k) => k.name).sort().reverse();
    if (backupKeys.length > MAX_BACKUPS) {
      const toDelete = backupKeys.slice(MAX_BACKUPS);
      for (const key of toDelete) {
        await kv.delete(key);
      }
    }
  },
};
