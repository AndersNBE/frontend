import { NextResponse } from "next/server";
import { normalizeNextPath, resolveSafeRedirectUrl } from "../../lib/supabase/redirect";
import { createSupabaseServerClient } from "../../lib/supabase/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const nextPath = normalizeNextPath(requestUrl.searchParams.get("next"));

  if (!code) {
    const signinUrl = resolveSafeRedirectUrl(request, "/signin", "/signin");
    signinUrl.searchParams.set("error", "Missing authentication code.");
    return NextResponse.redirect(signinUrl);
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    const signinUrl = resolveSafeRedirectUrl(request, "/signin", "/signin");
    signinUrl.searchParams.set("error", error.message);
    return NextResponse.redirect(signinUrl);
  }

  return NextResponse.redirect(resolveSafeRedirectUrl(request, nextPath));
}
