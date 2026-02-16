const ALLOWED_REDIRECT_ORIGINS = new Set<string>([
  "http://localhost:3000",
  "https://udfall.com",
  "https://www.udfall.com",
]);

const PRIMARY_APP_ORIGIN = "https://udfall.com";

function defaultOrigin() {
  return process.env.NODE_ENV === "production" ? PRIMARY_APP_ORIGIN : "http://localhost:3000";
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

export function buildBrowserCallbackUrl(
  nextPath = "/markets",
  flow: "magiclink" | "signup" | "recovery" | null = null,
): string {
  const origin = typeof window !== "undefined" ? window.location.origin : defaultOrigin();
  const callbackUrl = new URL("/auth/callback", origin);
  callbackUrl.searchParams.set("next", normalizeNextPath(nextPath));
  if (flow) {
    callbackUrl.searchParams.set("flow", flow);
  }
  return callbackUrl.toString();
}

export function buildBrowserRecoveryCallbackUrl(): string {
  const origin = typeof window !== "undefined" ? window.location.origin : defaultOrigin();
  return new URL("/auth/recovery", origin).toString();
}

export function buildSignupEmailRedirectUrl(): string {
  return new URL("/auth/callback", PRIMARY_APP_ORIGIN).toString();
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
