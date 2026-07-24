/**
 * Resolves the public base URL of the app, for links embedded in outgoing emails.
 *
 * Server-side only: emails are rendered in route handlers, so a non-public env var
 * is fine here, but NEXT_PUBLIC_APP_URL is what is actually configured on Vercel.
 *
 * Resolution order (first non-empty wins):
 *   1. APP_URL                            — explicit override
 *   2. NEXT_PUBLIC_APP_URL                — what Vercel is configured with
 *   3. NEXTAUTH_URL                       — already required by NextAuth
 *   4. VERCEL_PROJECT_PRODUCTION_URL      — stable production domain
 *   5. VERCEL_URL                         — per-deployment domain
 *   6. http://localhost:3000              — local dev
 *
 * Never returns a trailing slash, so `${getAppUrl()}/login` is always well-formed.
 */
export function getAppUrl(): string {
  const candidates = [
    process.env.APP_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXTAUTH_URL,
    process.env.VERCEL_PROJECT_PRODUCTION_URL,
    process.env.VERCEL_URL,
  ];

  for (const raw of candidates) {
    const value = raw?.trim();
    if (!value) continue;

    // VERCEL_* vars carry a bare host with no scheme.
    const withScheme = /^https?:\/\//.test(value) ? value : `https://${value}`;
    return withScheme.replace(/\/+$/, "");
  }

  return "http://localhost:3000";
}
