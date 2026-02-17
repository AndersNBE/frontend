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
      setGateError("Indtast adgangskoden.");
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
        setGateError(body?.error ?? "Kunne ikke verificere adgangskoden.");
        return;
      }

      setIsUnlocked(true);
      setGatePassword("");
      setGateError(null);
    } catch {
      setGateError("Netvaerksfejl. Proev igen.");
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
            <h2>Du er tilfoejet til waitlist</h2>
            <p>
              Tak for at oprette en konto. Vi kontakter dig paa{" "}
              <strong>{waitlistEmail || "din email"}</strong>, saa snart din adgang
              er klar.
            </p>
            <p>
              Du kan se live markets i baggrunden, men handel er laast indtil du
              faar adgang.
            </p>
          </div>

          <div className="marketsGateUnlockDock">
            <form onSubmit={handleUnlock} className="marketsGateUnlockForm">
              <label htmlFor="markets-access-code">Har du adgangskode?</label>
              <div className="marketsGateUnlockRow">
                <input
                  id="markets-access-code"
                  type="password"
                  value={gatePassword}
                  onChange={(event) => setGatePassword(event.target.value)}
                  placeholder="Indtast adgangskode"
                  autoComplete="off"
                  disabled={isUnlocking}
                />
                <button type="submit" className="btnPrimary" disabled={isUnlocking}>
                  {isUnlocking ? "Tjekker..." : "Aaben adgang"}
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
