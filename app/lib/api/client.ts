// app/lib/api/client.ts
export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.status = status;
    this.details = details;
  }
}

const INTERNAL_API_PREFIX = "/api/backend";

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  headers?: Record<string, string>;
  body?: unknown;
  signal?: AbortSignal;
  credentials?: RequestCredentials;
};

function readErrorMessage(payload: unknown): string | null {
  if (typeof payload === "string" && payload.length > 0) {
    return payload;
  }

  if (
    payload &&
    typeof payload === "object" &&
    "detail" in payload &&
    typeof payload.detail === "string" &&
    payload.detail.length > 0
  ) {
    return payload.detail;
  }

  return null;
}

export async function apiFetch<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = `${INTERNAL_API_PREFIX}${normalizedPath}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(opts.headers ?? {}),
  };

  const resp = await fetch(url, {
    method: opts.method ?? "GET",
    headers,
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
    signal: opts.signal,
    credentials: opts.credentials,
    cache: "no-store",
  });

  const contentType = resp.headers.get("content-type") ?? "";
  const isJson = contentType.includes("application/json");

  const payload = isJson
    ? await resp.json().catch(() => null)
    : await resp.text().catch(() => "");

  if (!resp.ok) {
    const msg = readErrorMessage(payload) ?? `Request failed: ${resp.status} ${resp.statusText}`;
    throw new ApiError(msg, resp.status, payload);
  }

  return payload as T;
}
