import type { Env } from "./types";
import { fromBase64Url, parseCookie, signPayload, toBase64Url } from "./session";

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
