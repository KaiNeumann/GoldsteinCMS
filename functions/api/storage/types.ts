import type { AuditEntry } from "../_shared";

export interface ContentStorage {
  fetchContent(env: any): Promise<{
    data: unknown;
    version: string;
  }>;

  fetchContentWithAudit(env: any): Promise<{
    data: unknown;
    version: string;
    audit: AuditEntry[];
    files: string[];
  }>;

  saveContent(
    env: any,
    content: unknown,
    audit?: AuditEntry[],
    extraFiles?: Record<string, string>,
    deleteFiles?: string[]
  ): Promise<void>;
}
