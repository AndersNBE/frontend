"use client";

import { type FormEvent, useEffect, useMemo, useState } from "react";
import { apiFetch } from "../lib/api/client";
import MarketsView from "./MarketsView";
import type { Market } from "../lib/markets/types";

type MarketsClientPageProps = {
  waitlistUnlocked: boolean;
  waitlistEmail: string;
};

type WaitlistPreviewMarket = {
  id: string;
  title: string;
  category: string;
  probabilityPct: number;
  mover: number;
  volume: number;
  chartLinePath: string;
  chartAreaPath: string;
};

function formatKrShort(value: number) {
  if (!Number.isFinite(value)) return "0 kr";
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M kr`;
  if (abs >= 1_000) return `${(value / 1_000).toFixed(1)}k kr`;
  return `${Math.round(value)} kr`;
}

function normalizeProbability(rawPrice: number) {
  if (!Number.isFinite(rawPrice)) return 0.5;
  if (rawPrice > 1) {
    return Math.max(0, Math.min(1, rawPrice / 100));
  }
  return Math.max(0, Math.min(1, rawPrice));
}

function clampProbability(value: number) {
  return Math.max(0.02, Math.min(0.98, value));
}

function hashString(input: string) {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function buildMiniSeries(market: Market): number[] {
  const seed = hashString(market.id);
  const phase = (seed % 19) * 0.19;
  const driftSeed = (seed % 27) * 0.08;
  const base = normalizeProbability(market.yesPrice);
  const mover = (base - 0.5) * 0.18;
  const points: number[] = [];

  for (let i = 0; i < 26; i += 1) {
    const t = i / 25;
    const wave = Math.sin(t * Math.PI * 2.4 + phase) * 0.05;
    const micro = Math.cos(t * Math.PI * 5.4 + driftSeed) * 0.015;
    const drift = (t - 0.5) * mover;
    points.push(clampProbability(base + wave + micro + drift));
  }

  return points;
}

function buildChartPaths(points: number[]): {
  chartLinePath: string;
  chartAreaPath: string;
} {
  if (points.length === 0) {
    return { chartLinePath: "", chartAreaPath: "" };
  }

  const last = points.length - 1;
  const coords = points.map((value, index) => ({
    x: last === 0 ? 0 : (index / last) * 100,
    y: (1 - value) * 100,
  }));

  const chartLinePath = coords
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");
  const chartAreaPath = `${chartLinePath} L 100 100 L 0 100 Z`;

  return { chartLinePath, chartAreaPath };
}

function toCategoryLabel(category: Market["category"]) {
  if (!category) return "Finance";
  return category.charAt(0).toUpperCase() + category.slice(1);
}

function buildWaitlistPreviewMarkets(markets: Market[]): WaitlistPreviewMarket[] {
  if (markets.length === 0) return [];

  const maxVolume = Math.max(...markets.map((market) => market.volumeKr ?? 0), 1);
  const ranked = markets
    .map((market) => {
      const volume = market.volumeKr ?? 0;
      const probability = normalizeProbability(market.yesPrice);
      const mover = Math.round((probability - 0.5) * 200);
      const trendScore =
        (volume / maxVolume) * 0.72 +
        (Math.abs(mover) / 100) * 0.22 +
        (market.status === "open" ? 0.06 : 0);

      return {
        market,
        trendScore,
        probabilityPct: Math.round(probability * 100),
        mover,
        volume,
      };
    })
    .sort((a, b) => b.trendScore - a.trendScore || b.volume - a.volume)
    .slice(0, 6);

  return ranked.map((item) => {
    const series = buildMiniSeries(item.market);
    const { chartLinePath, chartAreaPath } = buildChartPaths(series);
    return {
      id: item.market.id,
      title: item.market.title,
      category: toCategoryLabel(item.market.category),
      probabilityPct: item.probabilityPct,
      mover: item.mover,
      volume: item.volume,
      chartLinePath,
      chartAreaPath,
    };
  });
}

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
  const [previewIndex, setPreviewIndex] = useState(0);

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

  const previewMarkets = useMemo(() => buildWaitlistPreviewMarkets(markets), [markets]);

  useEffect(() => {
    if (previewMarkets.length === 0) {
      setPreviewIndex(0);
      return;
    }

    setPreviewIndex((current) => current % previewMarkets.length);
  }, [previewMarkets.length]);

  useEffect(() => {
    if (isUnlocked || previewMarkets.length < 2) return;

    const timer = window.setInterval(() => {
      setPreviewIndex((current) => (current + 1) % previewMarkets.length);
    }, 3800);

    return () => {
      window.clearInterval(timer);
    };
  }, [isUnlocked, previewMarkets.length]);

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

          <div className="marketsGatePreview" aria-live="off">
            <div className="marketsGatePreviewHeader">
              <h3>While you wait, think about...</h3>
              <p>Top trending markets right now</p>
            </div>

            {previewMarkets.length > 0 ? (
              <>
                <div className="marketsGateCarousel">
                  <div
                    className="marketsGateCarouselTrack"
                    style={{ transform: `translateX(-${previewIndex * 100}%)` }}
                  >
                    {previewMarkets.map((item) => (
                      <article key={item.id} className="marketsGateSlide">
                        <div className="marketsGateSlideTop">
                          <span className="marketsGateSlideCategory">{item.category}</span>
                          <span className="marketsGateSlideVolume">{formatKrShort(item.volume)} volume</span>
                        </div>

                        <h4>{item.title}</h4>

                        <div className="marketsGateSlideStats">
                          <span>{item.probabilityPct}% yes</span>
                          <span
                            className={
                              item.mover >= 0
                                ? "marketsGateSlideMove marketsGateSlideMoveUp"
                                : "marketsGateSlideMove marketsGateSlideMoveDown"
                            }
                          >
                            {item.mover >= 0 ? "+" : ""}
                            {item.mover} pts
                          </span>
                        </div>

                        <div className="marketsGateMiniChart" aria-hidden="true">
                          <svg viewBox="0 0 100 100" preserveAspectRatio="none">
                            <path className="marketsGateMiniArea" d={item.chartAreaPath} />
                            <path className="marketsGateMiniLine" d={item.chartLinePath} />
                          </svg>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>

                <div className="marketsGateDots" aria-hidden="true">
                  {previewMarkets.map((item, index) => (
                    <span
                      key={`dot-${item.id}`}
                      className={
                        index === previewIndex
                          ? "marketsGateDot marketsGateDotActive"
                          : "marketsGateDot"
                      }
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className="marketsGatePreviewEmpty">Loading trending markets...</div>
            )}
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
