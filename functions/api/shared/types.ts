export interface Env {
  GITHUB_GIST_ID: string;
  GITHUB_TOKEN: string;
  CMS_ADMIN_PASSWORD: string;
  CMS_SESSION_SECRET: string;
  CONTENT_KV: KVNamespace;
}

export interface AuditEntry {
  timestamp: string;
  editor: string;
  summary: string;
}
