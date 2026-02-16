"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { createSupabaseBrowserClient } from "../lib/supabase/client";
import { buildBrowserCallbackUrl, normalizeNextPath } from "../lib/supabase/redirect";

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = normalizeNextPath(searchParams.get("next"));
  const callbackError = searchParams.get("error");
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setInfo(null);
    setStatus("loading");

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    if (!email || !password) {
      setError("Enter both email and password.");
      setStatus("idle");
      return;
    }

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

      if (signInError) {
        setError(signInError.message);
        setStatus("idle");
        return;
      }

      setStatus("success");
      router.replace(nextPath);
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sign-in failed. Try again.";
      setError(message || "Sign-in failed. Try again.");
      setStatus("idle");
    }
  };

  const handlePasskey = () => {
    setError(null);
    setInfo("Passkey sign-in is not configured yet.");
  };

  const handleMagicLink = async () => {
    const emailInput = document.getElementById("email");
    const email = emailInput instanceof HTMLInputElement ? emailInput.value.trim() : "";
    if (!email) {
      setError("Enter your email to receive a one-time link.");
      setInfo(null);
      return;
    }

    setError(null);
    setInfo("Sending one-time link...");
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: false,
          emailRedirectTo: buildBrowserCallbackUrl(nextPath),
        },
      });

      if (otpError) {
        setError(otpError.message);
        setInfo(null);
        return;
      }

      setInfo("One-time link sent. Check your email.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to send one-time link.");
      setInfo(null);
    }
  };

  return (
    <section className="authPage">
      <div className="authHero">
        <div className="authHeroGlow" aria-hidden="true" />
        <div className="authHeroGrid" aria-hidden="true" />

        <div className="authHeroInner">
          <span className="authBadge">Foresee Access</span>
          <h1 className="authTitle">Sign in to your market desk</h1>
          <p className="authCopy">
            Keep watchlists private, react to probability shifts, and move faster with smart alerts.
          </p>
        </div>

        <div className="authTicker">
          <div className="authTickerItem">
            <span className="authTickerLabel">US recession in 2025</span>
            <span className="authTickerValue up">38%</span>
          </div>
          <div className="authTickerItem">
            <span className="authTickerLabel">Nvidia hits 1T by Q4</span>
            <span className="authTickerValue down">46%</span>
          </div>
          <div className="authTickerItem">
            <span className="authTickerLabel">Euro rate cut by June</span>
            <span className="authTickerValue up">62%</span>
          </div>
        </div>

        <div className="authStats">
          <div className="authStat">
            <span className="authStatValue">144</span>
            <span className="authStatLabel">Active markets</span>
          </div>
          <div className="authStat">
            <span className="authStatValue">12</span>
            <span className="authStatLabel">Alerts queued</span>
          </div>
          <div className="authStat">
            <span className="authStatValue">4.7m kr</span>
            <span className="authStatLabel">Volume today</span>
          </div>
        </div>
      </div>

      <div className="authCard">
        <div className="authCardHeader">
          <h2>Welcome back</h2>
          <p>Sign in to continue forecasting markets.</p>
        </div>

        <form className="authForm" onSubmit={handleSubmit}>
          {(error ?? callbackError) && (
            <div className="authAlert" role="alert">
              {error ?? callbackError}
            </div>
          )}
          {info && (
            <div className="authAlert authAlertInfo" role="status">
              {info}
            </div>
          )}
          {status === "success" && (
            <div className="authAlert authAlertSuccess" role="status">
              Signed in. Redirecting...
            </div>
          )}
          <div className="authField">
            <label className="authLabel" htmlFor="email">
              Email
            </label>
            <input
              className="authInput"
              id="email"
              name="email"
              type="email"
              placeholder="you@foresee.ai"
              autoComplete="email"
              required
            />
          </div>

          <div className="authField">
            <label className="authLabel" htmlFor="password">
              Password
            </label>
            <input
              className="authInput"
              id="password"
              name="password"
              type="password"
              placeholder="Enter your password"
              autoComplete="current-password"
              required
            />
          </div>

          <div className="authMetaRow">
            <label className="authCheckbox">
              <input type="checkbox" name="remember" defaultChecked />
              <span>Remember me</span>
            </label>
            <Link className="authLink" href="/forgot-password">
              Forgot password?
            </Link>
          </div>

          <button className="authButton" type="submit" disabled={status === "loading"}>
            {status === "loading" ? "Signing in..." : "Sign in"}
          </button>

          <div className="authDivider">
            <span>or</span>
          </div>

          <div className="authAltRow">
            <button className="authAltButton" type="button" onClick={handlePasskey}>
              Use passkey
            </button>
            <button className="authAltButton" type="button" onClick={handleMagicLink}>
              One-time link
            </button>
          </div>
        </form>

        <div className="authFooter">
          <span>New to Foresee?</span>
          <Link className="authLinkStrong" href="/signup">
            Create account
          </Link>
        </div>
      </div>
    </section>
  );
}
