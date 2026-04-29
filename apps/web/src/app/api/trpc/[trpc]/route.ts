import { cookies } from "next/headers";

import { auth } from "@/lib/auth/auth-config";
import { getEnv } from "@/lib/env";

async function proxy(req: Request): Promise<Response> {
  const session = await auth();
  if (!session?.user) {
    return Response.json({ error: "Unauthenticated" }, { status: 401 });
  }

  const cookieStore = await cookies();
  const sessionToken =
    cookieStore.get("__Secure-authjs.session-token")?.value ??
    cookieStore.get("authjs.session-token")?.value;
  if (!sessionToken) {
    return Response.json({ error: "Missing session token" }, { status: 401 });
  }

  const env = getEnv();
  const incoming = new URL(req.url);
  const subpath = incoming.pathname.replace(/^\/api\/trpc/, "");
  const target = `${env.API_URL}/trpc${subpath}${incoming.search}`;

  const headers = new Headers(req.headers);
  headers.set("authorization", `Bearer ${sessionToken}`);
  headers.delete("host");
  headers.delete("connection");
  headers.delete("content-length");

  const body = req.method === "GET" || req.method === "HEAD" ? null : await req.arrayBuffer();

  const upstream = await fetch(target, {
    method: req.method,
    headers,
    body,
  });

  const responseHeaders = new Headers(upstream.headers);
  responseHeaders.delete("content-encoding");
  responseHeaders.delete("transfer-encoding");

  return new Response(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });
}

export { proxy as GET, proxy as POST };
