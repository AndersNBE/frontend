"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createSupabaseBrowserClient } from "../lib/supabase/client";

type AccountClientProps = {
  email: string;
  userId: string;
  emailConfirmedAt: string | null;
  createdAt: string | null;
  lastSignInAt: string | null;
};

function formatTimestamp(value: string | null): string {
  if (!value) return "Not available";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(parsed);
}

export default function AccountClient({
  email,
  userId,
  emailConfirmedAt,
  createdAt,
  lastSignInAt,
}: AccountClientProps) {
  const router = useRouter();
  const [resetStatus, setResetStatus] = useState<"idle" | "sending" | "sent">("idle");
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetInfo, setResetInfo] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  const handleSendPasswordReset = async () => {
    setResetError(null);
    setResetInfo(null);
    setResetStatus("sending");

    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/recovery`,
      });

      if (error) {
        setResetError(error.message);
        setResetStatus("idle");
        return;
      }

      setResetInfo(`We sent a password reset link to ${email}.`);
      setResetStatus("sent");
    } catch (error) {
      setResetError(error instanceof Error ? error.message : "Unable to send reset link.");
      setResetStatus("idle");
    }
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signOut();
    setSigningOut(false);

    if (error) {
      setResetError(error.message);
      return;
    }

    router.replace("/signin");
    router.refresh();
  };

  return (
    <section className="accountPage">
      <h1 className="pageTitle">Account</h1>
      <p className="pageSubtitle">Manage your login details and password security.</p>

      <div className="card">
        <h2 className="accountCardTitle">Login details</h2>
        <dl className="accountMetaList">
          <div>
            <dt>Email</dt>
            <dd>{email || "Not available"}</dd>
          </div>
          <div>
            <dt>User ID</dt>
            <dd>{userId}</dd>
          </div>
          <div>
            <dt>Email confirmed</dt>
            <dd>{emailConfirmedAt ? formatTimestamp(emailConfirmedAt) : "No"}</dd>
          </div>
          <div>
            <dt>Created</dt>
            <dd>{formatTimestamp(createdAt)}</dd>
          </div>
          <div>
            <dt>Last sign in</dt>
            <dd>{formatTimestamp(lastSignInAt)}</dd>
          </div>
        </dl>
      </div>

      <div className="card">
        <h2 className="accountCardTitle">Password</h2>
        <p className="accountText">
          Send a secure password reset link from Supabase to your account email.
        </p>

        {resetError && (
          <div className="authAlert" role="alert">
            {resetError}
          </div>
        )}
        {resetInfo && (
          <div className="authAlert authAlertInfo" role="status">
            {resetInfo}
          </div>
        )}

        <div className="accountActions">
          <button
            className="btnPrimary"
            type="button"
            onClick={handleSendPasswordReset}
            disabled={resetStatus === "sending"}
          >
            {resetStatus === "sending" ? "Sending reset email..." : "Reset password"}
          </button>
          <Link href="/account/reset-password" className="topTextLink">
            I already have a reset link
          </Link>
          <button className="topTextLink" type="button" onClick={handleSignOut} disabled={signingOut}>
            {signingOut ? "Signing out..." : "Sign out"}
          </button>
        </div>
      </div>
    </section>
  );
}
