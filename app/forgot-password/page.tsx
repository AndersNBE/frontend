"use client";

import Link from "next/link";
import { useState } from "react";
import { createSupabaseBrowserClient } from "../lib/supabase/client";
import { buildBrowserCallbackUrl } from "../lib/supabase/redirect";

export default function ForgotPasswordPage() {
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setStatus("loading");

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();

    if (!email) {
      setError("Enter your account email.");
      setStatus("idle");
      return;
    }

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: buildBrowserCallbackUrl("/account/reset-password", "recovery"),
      });

      if (resetError) {
        setError(resetError.message);
        setStatus("idle");
        return;
      }

      setStatus("success");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Request failed. Try again.";
      setError(message);
      setStatus("idle");
    }
  };

  return (
    <section className="authPage">
      <div className="authHero">
        <div className="authHeroGlow" aria-hidden="true" />
        <div className="authHeroGrid" aria-hidden="true" />

        <div className="authHeroInner">
          <span className="authBadge">Account Help</span>
          <h1 className="authTitle">Reset your password</h1>
          <p className="authCopy">
            We will send a secure reset link to the email connected to your Udfall account.
          </p>
        </div>

        <div className="authTicker">
          <div className="authTickerItem">
            <span className="authTickerLabel">Alert response time</span>
            <span className="authTickerValue up">2.8 min</span>
          </div>
          <div className="authTickerItem">
            <span className="authTickerLabel">Accounts protected</span>
            <span className="authTickerValue up">99.9%</span>
          </div>
          <div className="authTickerItem">
            <span className="authTickerLabel">Security checks daily</span>
            <span className="authTickerValue down">14</span>
          </div>
        </div>

        <div className="authStats">
          <div className="authStat">
            <span className="authStatValue">24/7</span>
            <span className="authStatLabel">Monitoring</span>
          </div>
          <div className="authStat">
            <span className="authStatValue">2 min</span>
            <span className="authStatLabel">Reset delivery</span>
          </div>
          <div className="authStat">
            <span className="authStatValue">128-bit</span>
            <span className="authStatLabel">Encryption</span>
          </div>
        </div>
      </div>

      <div className="authCard">
        <div className="authCardHeader">
          <h2>Forgot your password?</h2>
          <p>Enter your email and we will send a reset link.</p>
        </div>

        <form className="authForm" onSubmit={handleSubmit}>
          {error && (
            <div className="authAlert" role="alert">
              {error}
            </div>
          )}
          {status === "success" && (
            <div className="authAlert authAlertSuccess" role="status">
              Check your inbox for a reset link.
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
              placeholder="you@udfall.com"
              autoComplete="email"
              required
            />
          </div>

          <button className="authButton" type="submit" disabled={status === "loading"}>
            {status === "loading" ? "Sending link..." : "Send reset link"}
          </button>
        </form>

        <div className="authFooter">
          <span>Remembered your password?</span>
          <Link className="authLinkStrong" href="/signin">
            Back to sign in
          </Link>
        </div>
      </div>
    </section>
  );
}
