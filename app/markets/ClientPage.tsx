"use client";

import { type FormEvent, useEffect, useState } from "react";
import { apiFetch } from "../lib/api/client";
import MarketsView from "./MarketsView";
import type { Market } from "../lib/markets/types";

type MarketsClientPageProps = {
  waitlistUnlocked: boolean;
  waitlistEmail: string;
};

export default function MarketsClientPage({
  waitlistUnlocked,
  waitlistEmail,
}: MarketsClientPageProps) {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(waitlistUnlocked);
  const [gatePassword, setGatePassword] = useState("");
  const [gateError, setGateError] = useState<string | null>(null);
  const [isUnlocking, setIsUnlocking] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const data = await apiFetch<Market[]>("/markets");
        if (!cancelled) {
          setMarkets(data);
          setError(null);
        }
      } catch (e: unknown) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Unknown error");
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleUnlock = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!gatePassword.trim()) {
      setGateError("Enter the access code.");
      return;
    }

    setIsUnlocking(true);
    setGateError(null);

    try {
      const response = await fetch("/api/waitlist/unlock", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password: gatePassword }),
      });

      const body = (await response.json().catch(() => null)) as
        | { error?: string }
        | null;

      if (!response.ok) {
        setGateError(body?.error ?? "Could not verify access code.");
        return;
      }

      setIsUnlocked(true);
      setGatePassword("");
      setGateError(null);
    } catch {
      setGateError("Network error. Try again.");
    } finally {
      setIsUnlocking(false);
    }
  };

  return (
    <div className="marketsGateShell">
      <div className={isUnlocked ? undefined : "marketsGateBlocked"}>
        <MarketsView initialMarkets={markets} initialError={error} />
      </div>

      {!isUnlocked && (
        <section className="marketsGateOverlay" aria-live="polite">
          <div className="marketsGateMessage">
            <span className="marketsGateBadge">Waitlist Access</span>
            <h2>You are on the waitlist</h2>
            <p>
              Thanks for creating an account. We will contact you at{" "}
              <strong>{waitlistEmail || "your email"}</strong> as soon as access is ready.
            </p>
            <p>
              You can watch live markets in the background, but trading is locked
              until you are granted access.
            </p>
            <div className="marketsGateFacts">
              <div className="marketsGateFact">
                <span>Status</span>
                <strong>Queued for rollout</strong>
              </div>
              <div className="marketsGateFact">
                <span>Access</span>
                <strong>Invite code required</strong>
              </div>
              <div className="marketsGateFact">
                <span>Contact</span>
                <strong>{waitlistEmail || "Email on file"}</strong>
              </div>
            </div>
          </div>

          <div className="marketsGateUnlockDock">
            <form onSubmit={handleUnlock} className="marketsGateUnlockForm">
              <div className="marketsGateUnlockHeader">
                <label htmlFor="markets-access-code">Have an access code?</label>
                <span>Internal and early access members</span>
              </div>
              <div className="marketsGateUnlockRow">
                <input
                  id="markets-access-code"
                  type="password"
                  value={gatePassword}
                  onChange={(event) => setGatePassword(event.target.value)}
                  placeholder="Enter access code"
                  autoComplete="off"
                  disabled={isUnlocking}
                />
                <button type="submit" className="marketsGateUnlockButton" disabled={isUnlocking}>
                  {isUnlocking ? "Checking..." : "Unlock access"}
                </button>
              </div>
              {gateError && <p className="marketsGateError">{gateError}</p>}
            </form>
          </div>
        </section>
      )}
    </div>
  );
}
