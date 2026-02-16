"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createSupabaseBrowserClient } from "../../lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setInfo(null);
    setStatus("saving");

    const formData = new FormData(event.currentTarget);
    const password = String(formData.get("password") ?? "");
    const confirmPassword = String(formData.get("confirmPassword") ?? "");

    if (!password || !confirmPassword) {
      setError("Enter and confirm your new password.");
      setStatus("idle");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      setStatus("idle");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setStatus("idle");
      return;
    }

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });

      if (updateError) {
        const lower = updateError.message.toLowerCase();
        if (lower.includes("auth session missing")) {
          setError("Open the password reset link from your email first.");
        } else {
          setError(updateError.message);
        }
        setStatus("idle");
        return;
      }

      setStatus("saved");
      setInfo("Password updated. Redirecting to sign in...");
      window.setTimeout(() => {
        router.replace(
          "/signin?info=Password%20updated.%20Sign%20in%20with%20your%20new%20password.",
        );
        router.refresh();
      }, 900);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to update password.");
      setStatus("idle");
    }
  };

  return (
    <section className="accountPage">
      <Link href="/account" className="backLink">
        <span aria-hidden="true">←</span>
        <span>Back to account</span>
      </Link>

      <h1 className="pageTitle">Set new password</h1>
      <p className="pageSubtitle">Use a strong password with at least 8 characters.</p>

      <div className="card">
        <form className="authForm" onSubmit={handleSubmit}>
          {error && (
            <div className="authAlert" role="alert">
              {error}
            </div>
          )}
          {info && (
            <div className="authAlert authAlertSuccess" role="status">
              {info}
            </div>
          )}

          <div className="authField">
            <label className="authLabel" htmlFor="password">
              New password
            </label>
            <input
              className="authInput"
              id="password"
              name="password"
              type="password"
              placeholder="Enter new password"
              autoComplete="new-password"
              required
            />
          </div>

          <div className="authField">
            <label className="authLabel" htmlFor="confirmPassword">
              Confirm new password
            </label>
            <input
              className="authInput"
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="Repeat new password"
              autoComplete="new-password"
              required
            />
          </div>

          <button className="authButton" type="submit" disabled={status === "saving"}>
            {status === "saving" ? "Updating password..." : "Update password"}
          </button>
        </form>
      </div>
    </section>
  );
}
