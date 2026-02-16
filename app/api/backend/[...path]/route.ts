const DEV_DEFAULT_API_URL = "http://127.0.0.1:8000";

function getApiBaseUrl(): string | null {
  if (process.env.API_URL) return process.env.API_URL;
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  if (process.env.NODE_ENV !== "production") return DEV_DEFAULT_API_URL;
  return null;
}

function buildUpstreamUrl(pathSegments: string[], requestUrl: string, baseUrl: string): URL {
  const trimmedBase = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
  const joinedPath = pathSegments.join("/");
  const upstreamUrl = new URL(joinedPath, trimmedBase);
  const incomingUrl = new URL(requestUrl);
  upstreamUrl.search = incomingUrl.search;
  return upstreamUrl;
}

async function forward(request: Request, pathSegments: string[]): Promise<Response> {
  const apiBaseUrl = getApiBaseUrl();

  if (!apiBaseUrl) {
    return Response.json(
      {
        detail:
          "Missing API base URL. Set API_URL (preferred) or NEXT_PUBLIC_API_URL on the frontend.",
      },
      { status: 500 },
    );
  }

  const upstreamUrl = buildUpstreamUrl(pathSegments, request.url, apiBaseUrl);
  const contentType = request.headers.get("content-type");
  const authorization = request.headers.get("authorization");

  const upstreamHeaders = new Headers();
  if (contentType) upstreamHeaders.set("content-type", contentType);
  if (authorization) upstreamHeaders.set("authorization", authorization);

  const hasBody = request.method !== "GET" && request.method !== "HEAD";
  const body = hasBody ? await request.arrayBuffer() : undefined;

  try {
    const upstreamResp = await fetch(upstreamUrl, {
      method: request.method,
      headers: upstreamHeaders,
      body,
      cache: "no-store",
    });

    const responseHeaders = new Headers();
    const upstreamContentType = upstreamResp.headers.get("content-type");
    if (upstreamContentType) responseHeaders.set("content-type", upstreamContentType);
    responseHeaders.set("cache-control", "no-store");

    const responseBody = await upstreamResp.arrayBuffer();
    return new Response(responseBody, {
      status: upstreamResp.status,
      headers: responseHeaders,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown upstream error";
    return Response.json(
      {
        detail: `Backend request failed: ${message}`,
        upstream: upstreamUrl.toString(),
      },
      { status: 502 },
    );
  }
}

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { path } = await context.params;
  return forward(request, path);
}

export async function POST(request: Request, context: RouteContext) {
  const { path } = await context.params;
  return forward(request, path);
}

export async function PUT(request: Request, context: RouteContext) {
  const { path } = await context.params;
  return forward(request, path);
}

export async function PATCH(request: Request, context: RouteContext) {
  const { path } = await context.params;
  return forward(request, path);
}

export async function DELETE(request: Request, context: RouteContext) {
  const { path } = await context.params;
  return forward(request, path);
}
