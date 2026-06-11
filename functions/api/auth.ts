import type { Env } from "./_shared";
import {
  clearLoginAttemptCookie,
  createLoginAttemptCookie,
  createSessionToken,
  getLoginThrottleState,
  isConfigured,
  json,
  nextFailedLoginState,
  sessionCookie,
} from "./_shared";

export async function onRequestPost(context: { request: Request; env: Env }): Promise<Response> {
  const { request, env } = context;
  if (!isConfigured(env)) {
    return json({ error: "Remote backend ist nicht konfiguriert" }, 503);
  }

  const throttle = getLoginThrottleState(request);
  if (throttle.locked) {
    return new Response(
      JSON.stringify({ error: `Zu viele Fehlversuche. Bitte in ${Math.ceil(throttle.retryAfterSeconds / 60)} Minute(n) erneut versuchen.` }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Retry-After": String(throttle.retryAfterSeconds),
        },
      }
    );
  }

  const body = await request.json().catch(() => null) as { password?: string } | null;
  if (!body?.password) {
    return json({ error: "Passwort fehlt" }, 400);
  }

  if (body.password !== env.CMS_ADMIN_PASSWORD) {
    const attemptState = nextFailedLoginState(request);
    const setCookie = await createLoginAttemptCookie(attemptState, env);
    return new Response(JSON.stringify({ error: "Falsches Passwort" }), {
      status: 401,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Set-Cookie": setCookie,
      },
    });
  }

  const token = await createSessionToken(env);
  const headers = new Headers({
    "Content-Type": "application/json; charset=utf-8",
  });
  headers.append("Set-Cookie", sessionCookie(token));
  headers.append("Set-Cookie", clearLoginAttemptCookie());
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers,
  });
}
