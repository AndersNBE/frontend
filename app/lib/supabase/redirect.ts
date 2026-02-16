const ALLOWED_REDIRECT_ORIGINS = new Set<string>([
  "http://localhost:3000",
  "https://udfall.com",
  "https://www.udfall.com",
]);

function defaultOrigin() {
  return process.env.NODE_ENV === "production" ? "https://udfall.com" : "http://localhost:3000";
}

function safeRelativePath(path: string | null | undefined): string | null {
  if (!path) return null;
  if (!path.startsWith("/")) return null;
  if (path.startsWith("//")) return null;
  return path;
}

export function normalizeNextPath(path: string | null | undefined, fallback = "/markets") {
  return safeRelativePath(path) ?? fallback;
}

export function buildBrowserCallbackUrl(nextPath = "/markets"): string {
  const origin = typeof window !== "undefined" ? window.location.origin : defaultOrigin();
  const callbackUrl = new URL("/auth/callback", origin);
  callbackUrl.searchParams.set("next", normalizeNextPath(nextPath));
  return callbackUrl.toString();
}

export function resolveSafeRedirectUrl(
  request: Request,
  redirectTo: string | null,
  fallbackPath = "/markets",
): URL {
  const requestOrigin = new URL(request.url).origin;
  const trustedOrigin = ALLOWED_REDIRECT_ORIGINS.has(requestOrigin) ? requestOrigin : defaultOrigin();
  const fallbackUrl = new URL(normalizeNextPath(fallbackPath), trustedOrigin);

  const relativePath = safeRelativePath(redirectTo);
  if (relativePath) {
    return new URL(relativePath, trustedOrigin);
  }

  if (redirectTo) {
    try {
      const absoluteUrl = new URL(redirectTo);
      if (ALLOWED_REDIRECT_ORIGINS.has(absoluteUrl.origin)) {
        return absoluteUrl;
      }
    } catch {
      // Ignore malformed redirects and use fallback.
    }
  }

  return fallbackUrl;
}
