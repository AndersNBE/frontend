"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { createSupabaseBrowserClient } from "../lib/supabase/client";
import { buildBrowserCallbackUrl, normalizeNextPath } from "../lib/supabase/redirect";

export default function SignUpPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = normalizeNextPath(searchParams.get("next"));
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setInfo(null);
    setStatus("loading");

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get("name") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const password = String(formData.get("password") ?? "");

    if (!email || !password) {
      setError("Enter both email and password.");
      setStatus("idle");
      return;
    }

    try {
      const supabase = createSupabaseBrowserClient();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: name ? { full_name: name } : undefined,
          emailRedirectTo: buildBrowserCallbackUrl(nextPath),
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        setStatus("idle");
        return;
      }

      if (data.session) {
        setStatus("success");
        router.replace(nextPath);
        router.refresh();
        return;
      }

      setStatus("success");
      setInfo("Check your email to confirm your account.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sign-up failed. Try again.";
      setError(message || "Sign-up failed. Try again.");
      setStatus("idle");
    }
  };

  return (
    <section className="authPage">
      <div className="authHero">
        <div className="authHeroGlow" aria-hidden="true" />
        <div className="authHeroGrid" aria-hidden="true" />

        <div className="authHeroInner">
          <span className="authBadge">Foresee Access</span>
          <h1 className="authTitle">Create your Foresee account</h1>
          <p className="authCopy">
            Build watchlists, get instant probability alerts, and move with the best signal in the market.
          </p>
        </div>

        <div className="authTicker">
          <div className="authTickerItem">
            <span className="authTickerLabel">Inflation below 3% by Q3</span>
            <span className="authTickerValue up">54%</span>
          </div>
          <div className="authTickerItem">
            <span className="authTickerLabel">US election turnout hits record</span>
            <span className="authTickerValue down">41%</span>
          </div>
          <div className="authTickerItem">
            <span className="authTickerLabel">Oil under $70 by summer</span>
            <span className="authTickerValue up">63%</span>
          </div>
        </div>

        <div className="authStats">
          <div className="authStat">
            <span className="authStatValue">24k</span>
            <span className="authStatLabel">Active forecasters</span>
          </div>
          <div className="authStat">
            <span className="authStatValue">3 min</span>
            <span className="authStatLabel">Average response time</span>
          </div>
          <div className="authStat">
            <span className="authStatValue">92%</span>
            <span className="authStatLabel">Alert accuracy</span>
          </div>
        </div>
      </div>

      <div className="authCard">
        <div className="authCardHeader">
          <h2>Start forecasting</h2>
          <p>Create an account to unlock private markets and alerts.</p>
        </div>

        <form className="authForm" onSubmit={handleSubmit}>
          {error && (
            <div className="authAlert" role="alert">
              {error}
            </div>
          )}
          {status === "success" && (
            <div className="authAlert authAlertSuccess" role="status">
              {info ?? "Account created. Redirecting..."}
            </div>
          )}
          <div className="authField">
            <label className="authLabel" htmlFor="name">
              Full name
            </label>
            <input className="authInput" id="name" name="name" placeholder="Alex Morgan" />
          </div>

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
              placeholder="Create a password"
              autoComplete="new-password"
              required
            />
          </div>

          <button className="authButton" type="submit" disabled={status === "loading"}>
            {status === "loading" ? "Creating account..." : "Create account"}
          </button>
        </form>

        <div className="authFooter">
          <span>Already have an account?</span>
          <Link className="authLinkStrong" href="/signin">
            Sign in
          </Link>
        </div>
      </div>
    </section>
  );
}
