export interface Env {
  GITHUB_GIST_ID: string;
  GITHUB_TOKEN: string;
  CMS_ADMIN_PASSWORD: string;
  CMS_SESSION_SECRET: string;
}

export interface AuditEntry {
  timestamp: string;
  editor: string;
  summary: string;
}

const BACKUP_PREFIX = "backup-content-";
const MAX_BACKUPS = 30;

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

export function isConfigured(env: Env): boolean {
  return !!env.GITHUB_GIST_ID && !!env.GITHUB_TOKEN && !!env.CMS_ADMIN_PASSWORD && !!env.CMS_SESSION_SECRET;
}

const SESSION_COOKIE = "gf_admin_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value: string): Uint8Array {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((value.length + 3) % 4);
  const binary = atob(padded);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) out[i] = binary.charCodeAt(i);
  return out;
}

async function importHmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

function parseCookie(request: Request, name: string): string | null {
  const cookieHeader = request.headers.get("Cookie") || "";
  const parts = cookieHeader.split(";").map((v) => v.trim());
  const match = parts.find((p) => p.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}

export async function createSessionToken(env: Env): Promise<string> {
  const payload = { exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS };
  const payloadEncoded = toBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  const key = await importHmacKey(env.CMS_SESSION_SECRET);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payloadEncoded));
  const signatureEncoded = toBase64Url(new Uint8Array(signature));
  return `${payloadEncoded}.${signatureEncoded}`;
}

export async function isValidSession(request: Request, env: Env): Promise<boolean> {
  const token = parseCookie(request, SESSION_COOKIE);
  if (!token) return false;
  const [payloadEncoded, signatureEncoded] = token.split(".");
  if (!payloadEncoded || !signatureEncoded) return false;

  const key = await importHmacKey(env.CMS_SESSION_SECRET);
  const valid = await crypto.subtle.verify(
    "HMAC",
    key,
    fromBase64Url(signatureEncoded),
    new TextEncoder().encode(payloadEncoded)
  );
  if (!valid) return false;

  try {
    const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(payloadEncoded))) as { exp?: number };
    return typeof payload.exp === "number" && payload.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

export function sessionCookie(token: string): string {
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_MAX_AGE_SECONDS}`;
}

export function clearSessionCookie(): string {
  return `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
}

export async function fetchGist(env: Env): Promise<{ data: unknown; version: string }> {
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
  const file = gist.files?.["content.json"];
  if (!file?.content) throw new Error("content.json fehlt im Gist");

  return {
    data: JSON.parse(file.content),
    version: gist.updated_at || "",
  };
}

export async function fetchGistWithAudit(env: Env): Promise<{ data: unknown; version: string; audit: AuditEntry[]; files: string[] }> {
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
}

export async function saveGist(env: Env, content: unknown, audit?: AuditEntry[], extraFiles?: Record<string, string>, deleteFiles?: string[]): Promise<void> {
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
}

export function sanitizeContentData(input: unknown): unknown {
  const data = JSON.parse(JSON.stringify(input)) as {
    posts?: { content?: string }[];
    siteConfig?: { pageContent?: Record<string, string> };
  };

  if (Array.isArray(data.posts)) {
    data.posts = data.posts.map((post) => ({
      ...post,
      content: sanitizeHtml(post.content || ""),
    }));
  }

  if (data.siteConfig?.pageContent) {
    data.siteConfig.pageContent = Object.fromEntries(
      Object.entries(data.siteConfig.pageContent).map(([key, value]) => [key, sanitizeHtml(value || "")])
    );
  }

  return data;
}

export function createBackupFiles(currentContent: unknown, existingFiles: string[], timestamp: string): { extraFiles: Record<string, string>; deleteFiles: string[] } {
  const safeTimestamp = timestamp.replace(/[:.]/g, "-");
  const backupName = `${BACKUP_PREFIX}${safeTimestamp}.json`;
  const backups = existingFiles.filter((name) => name.startsWith(BACKUP_PREFIX) && name.endsWith(".json")).sort().reverse();
  const deleteFiles = backups.slice(Math.max(0, MAX_BACKUPS - 1));

  return {
    extraFiles: {
      [backupName]: JSON.stringify(currentContent, null, 2),
    },
    deleteFiles,
  };
}

function sanitizeHtml(html: string): string {
  let clean = html;

  clean = clean.replace(/<\s*(script|style|iframe|object|embed|form|video|audio|canvas|svg|math)[\s\S]*?<\s*\/\s*\1\s*>/gi, "");
  clean = clean.replace(/<\/?(?:script|style|iframe|object|embed|form|input|button|textarea|select|option|link|meta|base|video|audio|canvas|svg|math)[^>]*>/gi, "");
  clean = clean.replace(/\s+on[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");
  clean = clean.replace(/\s+style\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");
  clean = clean.replace(/\s+(href|src)\s*=\s*("|')\s*javascript:[\s\S]*?\2/gi, "");
  clean = clean.replace(/\s+href\s*=\s*("|')\s*data:[\s\S]*?\1/gi, "");
  clean = clean.replace(/\s+src\s*=\s*("|')\s*data:(?!image\/(?:png|jpe?g|gif|webp);base64,)[\s\S]*?\1/gi, "");

  return clean;
}

const LOGIN_COOKIE = "gf_login_attempts";
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_MINUTES = 10;

function getClientIp(request: Request): string {
  const cfIp = request.headers.get("CF-Connecting-IP");
  if (cfIp) return cfIp;
  const forwarded = request.headers.get("X-Forwarded-For");
  if (forwarded) return forwarded.split(",")[0].trim();
  return "unknown";
}

export interface LoginAttemptState {
  ip: string;
  failedCount: number;
  lockUntil: number;
}

export function readLoginAttemptState(request: Request): LoginAttemptState | null {
  const token = parseCookie(request, LOGIN_COOKIE);
  if (!token) return null;
  const [payloadEncoded] = token.split(".");
  if (!payloadEncoded) return null;
  try {
    const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(payloadEncoded))) as LoginAttemptState;
    if (typeof payload.failedCount !== "number" || typeof payload.lockUntil !== "number" || typeof payload.ip !== "string") {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

async function signPayload(payloadEncoded: string, secret: string): Promise<string> {
  const key = await importHmacKey(secret);
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payloadEncoded));
  return toBase64Url(new Uint8Array(signature));
}

export async function createLoginAttemptCookie(state: LoginAttemptState, env: Env): Promise<string> {
  const payloadEncoded = toBase64Url(new TextEncoder().encode(JSON.stringify(state)));
  const signature = await signPayload(payloadEncoded, env.CMS_SESSION_SECRET);
  const maxAge = state.lockUntil > Math.floor(Date.now() / 1000) ? LOCK_MINUTES * 60 : 60 * 60;
  return `${LOGIN_COOKIE}=${encodeURIComponent(`${payloadEncoded}.${signature}`)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`;
}

export function clearLoginAttemptCookie(): string {
  return `${LOGIN_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
}

export function getLoginThrottleState(request: Request): { locked: boolean; retryAfterSeconds: number; failedCount: number } {
  const now = Math.floor(Date.now() / 1000);
  const ip = getClientIp(request);
  const state = readLoginAttemptState(request);
  if (!state || state.ip !== ip) return { locked: false, retryAfterSeconds: 0, failedCount: 0 };
  if (state.lockUntil > now) {
    return { locked: true, retryAfterSeconds: state.lockUntil - now, failedCount: state.failedCount };
  }
  return { locked: false, retryAfterSeconds: 0, failedCount: state.failedCount };
}

export function nextFailedLoginState(request: Request): LoginAttemptState {
  const now = Math.floor(Date.now() / 1000);
  const ip = getClientIp(request);
  const current = readLoginAttemptState(request);
  const failedCount = current && current.ip === ip ? current.failedCount + 1 : 1;
  const lockUntil = failedCount >= MAX_LOGIN_ATTEMPTS ? now + LOCK_MINUTES * 60 : 0;
  return { ip, failedCount, lockUntil };
}
