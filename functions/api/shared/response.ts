import type { ContentStorage } from "../storage/types";
import { gistStorage } from "../storage/gist";
import { kvStorage } from "../storage/kv";
import type { Env } from "./types";

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

export function isConfigured(env: Env): boolean {
  const hasKv = !!env.CONTENT_KV;
  const hasGist = !!env.GITHUB_GIST_ID && !!env.GITHUB_TOKEN;
  return (hasKv || hasGist) && !!env.CMS_ADMIN_PASSWORD && !!env.CMS_SESSION_SECRET;
}

export function selectStorage(env: Env): ContentStorage {
  if (env.CONTENT_KV) return kvStorage;
  if (env.GITHUB_GIST_ID && env.GITHUB_TOKEN) return gistStorage;
  throw new Error("Kein Storage-Backend konfiguriert");
}
