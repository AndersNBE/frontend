"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { EmailOtpType } from "@supabase/supabase-js";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type RecoveryStatus = "loading" | "error";

function readRecoveryParams() {
  const url = new URL(window.location.href);
  const combined = new URLSearchParams(url.search);
  const hash = url.hash.startsWith("#") ? url.hash.slice(1) : url.hash;
  if (hash) {
    const hashParams = new URLSearchParams(hash);
    hashParams.forEach((value, key) => {
      if (!combined.has(key)) combined.set(key, value);
    });
  }
  return combined;
}

function toFriendlyError(params: URLSearchParams, fallback: string) {
  const errorCode = params.get("error_code") ?? "";
  const errorDescription = params.get("error_description") ?? "";

  if (errorCode === "otp_expired") {
    return "This reset link has expired. Request a new password reset email.";
  }
  if (errorCode === "access_denied") {
    return "This password reset link is no longer valid. Request a new one.";
  }
  if (errorDescription) {
    return errorDescription;
  }
  return fallback;
}

export default function RecoveryPage() {
  const router = useRouter();
  const didRun = useRef(false);
  const [status, setStatus] = useState<RecoveryStatus>("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (didRun.current) return;
    didRun.current = true;

    const run = async () => {
      const params = readRecoveryParams();
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!url || !anonKey) {
        setError("Supabase configuration is missing. Please contact support.");
        setStatus("error");
        return;
      }

      const supabase = createBrowserClient(url, anonKey, {
        auth: { flowType: "pkce" },
      });

      const code = params.get("code");
      const tokenHash = params.get("token_hash");

      try {
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            setError(toFriendlyError(params, exchangeError.message));
            setStatus("error");
            return;
          }
        } else if (tokenHash) {
          const { error: verifyError } = await supabase.auth.verifyOtp({
            type: "recovery" as EmailOtpType,
            token_hash: tokenHash,
          });
          if (verifyError) {
            setError(toFriendlyError(params, verifyError.message));
            setStatus("error");
            return;
          }
        } else {
          setError(toFriendlyError(params, "Missing password reset code. Request a new reset email."));
          setStatus("error");
          return;
        }

        router.replace("/account/reset-password");
        router.refresh();
      } catch (unknownError) {
        const message =
          unknownError instanceof Error ? unknownError.message : "Unable to verify reset link.";
        setError(toFriendlyError(params, message));
        setStatus("error");
      }
    };

    void run();
  }, [router]);

  if (status === "loading") {
    return (
      <section className="accountPage">
        <h1 className="pageTitle">Preparing password reset</h1>
        <p className="pageSubtitle">Please wait while we verify your reset link.</p>
        <div className="card">
          <strong>Verifying recovery token...</strong>
        </div>
      </section>
    );
  }

  return (
    <section className="accountPage">
      <h1 className="pageTitle">Reset link issue</h1>
      <p className="pageSubtitle">
        We could not validate this reset link. You can request a new one below.
      </p>
      <div className="card">
        <div className="authAlert" role="alert">
          {error ?? "Invalid password reset link."}
        </div>
        <div className="accountActions">
          <Link href="/forgot-password" className="btnPrimary">
            Request new reset email
          </Link>
          <Link href="/signin" className="topTextLink">
            Back to sign in
          </Link>
        </div>
      </div>
    </section>
  );
}
