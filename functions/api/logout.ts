import type { Env } from "./_shared";
import { clearSessionCookie } from "./_shared";

export async function onRequestPost(_context: { env: Env }): Promise<Response> {
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Set-Cookie": clearSessionCookie(),
    },
  });
}
