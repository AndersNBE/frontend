"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ApiError, apiFetch } from "../lib/api/client";

type SignUpResponse = {
  redirect?: string;
};

export default function SignUpPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "loading" | "success">("idle");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
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
      const response = await apiFetch<SignUpResponse>("/auth/signup", {
        method: "POST",
        body: { name, email, password },
        credentials: "include",
      });

      setStatus("success");
      const nextPath = typeof response?.redirect === "string" ? response.redirect : "/signin";
      router.push(nextPath);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Sign-up failed. Try again.";
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
              Account created. Redirecting...
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
