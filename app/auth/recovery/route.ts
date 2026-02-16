import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { resolveSafeRedirectUrl } from "../../lib/supabase/redirect";
import { createSupabaseServerClient } from "../../lib/supabase/server";

function toSigninRedirect(request: Request, error: string) {
  const signinUrl = resolveSafeRedirectUrl(request, "/signin", "/signin");
  signinUrl.searchParams.set("error", error);
  return NextResponse.redirect(signinUrl);
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const supabase = await createSupabaseServerClient();

  if (tokenHash) {
    const type: EmailOtpType = "recovery";
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    if (error) {
      return toSigninRedirect(request, error.message);
    }
    return NextResponse.redirect(resolveSafeRedirectUrl(request, "/account/reset-password"));
  }

  if (!code) {
    return toSigninRedirect(request, "Missing password reset code.");
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (!error) {
    return NextResponse.redirect(resolveSafeRedirectUrl(request, "/account/reset-password"));
  }

  const normalized = error.message.toLowerCase();
  if (
    normalized.includes("code verifier") ||
    normalized.includes("both auth code and code verifier should be non-empty")
  ) {
    return toSigninRedirect(
      request,
      "Open the password reset link on the same device where you requested it.",
    );
  }

  return toSigninRedirect(request, error.message);
}
