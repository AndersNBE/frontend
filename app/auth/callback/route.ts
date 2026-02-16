import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { normalizeNextPath, resolveSafeRedirectUrl } from "../../lib/supabase/redirect";
import { createSupabaseServerClient } from "../../lib/supabase/server";

const SIGNUP_CONFIRMED_INFO = "Email confirmed. You can now sign in.";

const EMAIL_OTP_TYPES: EmailOtpType[] = [
  "signup",
  "invite",
  "magiclink",
  "recovery",
  "email_change",
  "email",
];

function parseEmailOtpType(value: string | null): EmailOtpType | null {
  if (!value) return null;
  return EMAIL_OTP_TYPES.includes(value as EmailOtpType) ? (value as EmailOtpType) : null;
}

function toSigninRedirect(
  request: Request,
  params: {
    error?: string;
    info?: string;
  },
) {
  const signinUrl = resolveSafeRedirectUrl(request, "/signin", "/signin");
  if (params.error) {
    signinUrl.searchParams.set("error", params.error);
  }
  if (params.info) {
    signinUrl.searchParams.set("info", params.info);
  }
  return NextResponse.redirect(signinUrl);
}

function isCodeVerifierError(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("code verifier") ||
    normalized.includes("both auth code and code verifier should be non-empty")
  );
}

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const tokenHash = requestUrl.searchParams.get("token_hash");
  const otpType = parseEmailOtpType(requestUrl.searchParams.get("type"));
  const flow = requestUrl.searchParams.get("flow");
  const isSignupFlow = flow === "signup" || otpType === "signup";
  const nextPath = normalizeNextPath(requestUrl.searchParams.get("next"));
  const supabase = await createSupabaseServerClient();

  if (tokenHash && otpType) {
    const { error } = await supabase.auth.verifyOtp({
      type: otpType,
      token_hash: tokenHash,
    });

    if (error) {
      return toSigninRedirect(request, { error: error.message });
    }

    if (isSignupFlow) {
      return toSigninRedirect(request, { info: SIGNUP_CONFIRMED_INFO });
    }

    return NextResponse.redirect(resolveSafeRedirectUrl(request, nextPath));
  }

  if (!code) {
    return toSigninRedirect(request, { error: "Missing authentication code." });
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (!error) {
    if (isSignupFlow) {
      return toSigninRedirect(request, { info: SIGNUP_CONFIRMED_INFO });
    }
    return NextResponse.redirect(resolveSafeRedirectUrl(request, nextPath));
  }

  if (isCodeVerifierError(error.message)) {
    if (flow === "magiclink") {
      return toSigninRedirect(request, {
        error: "Open the one-time link on the same device where you requested it.",
      });
    }

    return toSigninRedirect(request, { info: SIGNUP_CONFIRMED_INFO });
  }

  return toSigninRedirect(request, { error: error.message });
}
