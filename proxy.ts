/**
 * Next.js 16 Proxy (ex middleware).
 *
 * Intercetta le route di pagina disabilitate dai feature flag V2
 * e redirecta a /overview. Le API route non passano da qui —
 * usano early return 404 nei propri handler.
 *
 * Ref: node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getDisabledRoutes } from "@/lib/feature-flags";

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const disabledRoutes = getDisabledRoutes();

  if (disabledRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.redirect(new URL("/overview", request.url));
  }

  return NextResponse.next();
}

/**
 * Matcher statico (letto a build time).
 * Elenca tutti i path che POTREBBERO essere disabilitati dai flag.
 * La logica a runtime in `proxy()` decide se redirectare o meno.
 */
// Se aggiungi path a getDisabledRoutes() in lib/feature-flags.ts,
// aggiungi qui anche il matcher corrispondente, altrimenti il proxy
// non intercetta la richiesta a build time.
export const config = {
  matcher: ["/reconciliation/:path*"],
};
