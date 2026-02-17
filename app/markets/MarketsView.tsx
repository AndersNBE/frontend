"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Market } from "../lib/markets/types";

type CategoryKey = "all" | "politics" | "sports" | "finance" | "entertainment";
type MarketCategory = Exclude<CategoryKey, "all">;
type SidebarSection = "trending" | "topMovers" | "new" | "highestVolume";

type RankedMarket = {
  market: Market;
  category: MarketCategory;
  volume: number;
  probability: number;
  probabilityPct: number;
  moverDelta: number;
  moverMagnitude: number;
  trendScore: number;
  isOpen: boolean;
};

const categoryMeta: Record<CategoryKey, { label: string; icon: string }> = {
  all: { label: "All Markets", icon: "◻" },
  politics: { label: "Politics", icon: "🗳" },
  sports: { label: "Sports", icon: "🏆" },
  finance: { label: "Finance", icon: "📈" },
  entertainment: { label: "Entertainment", icon: "🎬" },
};

function formatDkk(price: number) {
  if (!Number.isFinite(price)) return "";
  return `${price.toFixed(2).replace(".", ",")} DKK`;
}

function formatKrShort(value: number) {
  if (!Number.isFinite(value)) return "";
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M kr`;
  if (abs >= 1_000) return `${(value / 1_000).toFixed(1)}k kr`;
  return `${Math.round(value)} kr`;
}

function formatPercent(probability: number) {
  if (!Number.isFinite(probability)) return "0%";
  return `${Math.round(probability * 100)}%`;
}

function normalizeCategory(category?: string): MarketCategory {
  if (category === "politics") return "politics";
  if (category === "sports") return "sports";
  if (category === "entertainment") return "entertainment";
  return "finance";
}

function normalizeProbability(rawPrice: number) {
  if (!Number.isFinite(rawPrice)) return 0.5;
  if (rawPrice > 1) {
    return Math.max(0, Math.min(1, rawPrice / 100));
  }
  return Math.max(0, Math.min(1, rawPrice));
}

function buildRankedMarkets(markets: Market[]): RankedMarket[] {
  if (markets.length === 0) return [];

  const maxVolume = Math.max(...markets.map((market) => market.volumeKr ?? 0), 1);

  return markets.map((market) => {
    const category = normalizeCategory(market.category);
    const volume = market.volumeKr ?? 0;
    const probability = normalizeProbability(market.yesPrice);
    const probabilityPct = Math.round(probability * 100);
    const moverDelta = Math.round((probability - 0.5) * 200);
    const moverMagnitude = Math.abs(moverDelta);
    const isOpen = market.status === "open";
    const volumeScore = volume / maxVolume;
    const trendScore = volumeScore * 0.72 + (moverMagnitude / 100) * 0.22 + (isOpen ? 0.06 : 0);

    return {
      market,
      category,
      volume,
      probability,
      probabilityPct,
      moverDelta,
      moverMagnitude,
      trendScore,
      isOpen,
    };
  });
}

function rankMarkets(markets: RankedMarket[], section: SidebarSection) {
  const ranked = markets.slice();

  if (section === "trending") {
    ranked.sort((a, b) => b.trendScore - a.trendScore || b.volume - a.volume);
  } else if (section === "topMovers") {
    ranked.sort((a, b) => b.moverMagnitude - a.moverMagnitude || b.volume - a.volume);
  } else if (section === "new") {
    ranked.sort((a, b) => {
      if (a.isOpen !== b.isOpen) return a.isOpen ? -1 : 1;
      if (a.volume !== b.volume) return a.volume - b.volume;
      return b.trendScore - a.trendScore;
    });
  } else {
    ranked.sort((a, b) => b.volume - a.volume || b.trendScore - a.trendScore);
  }

  return ranked.slice(0, 3);
}

function tagClass(category?: string) {
  if (category === "finance") return "tag tagFinance";
  if (category === "sports") return "tag tagSports";
  if (category === "politics") return "tag tagPolitics";
  if (category === "entertainment") return "tag tagEntertainment";
  return "tag";
}

export default function MarketsView({
  initialMarkets,
  initialError,
}: {
  initialMarkets: Market[];
  initialError: string | null;
}) {
  const searchParams = useSearchParams();
  const [activeCat, setActiveCat] = useState<CategoryKey>("all");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<"trending" | "title">("trending");

  const queryParam = (searchParams.get("q") ?? "").trim();

  useEffect(() => {
    setQuery(queryParam);
  }, [queryParam]);

  const categoryMarkets = useMemo(() => {
    if (activeCat === "all") return initialMarkets;
    return initialMarkets.filter((market) => normalizeCategory(market.category) === activeCat);
  }, [activeCat, initialMarkets]);

  const rankedMarkets = useMemo(() => buildRankedMarkets(categoryMarkets), [categoryMarkets]);

  const trendingTop = useMemo(() => rankMarkets(rankedMarkets, "trending"), [rankedMarkets]);
  const topMovers = useMemo(() => rankMarkets(rankedMarkets, "topMovers"), [rankedMarkets]);
  const newest = useMemo(() => rankMarkets(rankedMarkets, "new"), [rankedMarkets]);
  const highestVolume = useMemo(() => rankMarkets(rankedMarkets, "highestVolume"), [rankedMarkets]);

  const featuredMarket = trendingTop[0] ?? null;

  const rankingById = useMemo(() => {
    return new Map(rankedMarkets.map((item) => [item.market.id, item]));
  }, [rankedMarkets]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    let list = categoryMarkets.slice();

    if (q) {
      list = list.filter((m) => m.title.toLowerCase().includes(q));
    }

    if (sort === "trending") {
      list.sort((a, b) => {
        const rankA = rankingById.get(a.id)?.trendScore ?? 0;
        const rankB = rankingById.get(b.id)?.trendScore ?? 0;
        if (rankB !== rankA) return rankB - rankA;
        return (b.volumeKr ?? 0) - (a.volumeKr ?? 0);
      });
    } else {
      list.sort((a, b) => a.title.localeCompare(b.title));
    }

    return list;
  }, [categoryMarkets, query, sort, rankingById]);

  const sidebarSections = useMemo(
    () =>
      [
        { key: "trending", title: "Trending", items: trendingTop },
        { key: "topMovers", title: "Top movers", items: topMovers },
        { key: "new", title: "New", items: newest },
        { key: "highestVolume", title: "Highest volume", items: highestVolume },
      ] satisfies Array<{ key: SidebarSection; title: string; items: RankedMarket[] }>,
    [highestVolume, newest, topMovers, trendingTop],
  );

  return (
    <section>
      <h1 className="pageTitle">Markets</h1>
      <p className="pageSubtitle">Explore prediction markets across all categories</p>

      <div className="pillRow">
        {Object.entries(categoryMeta).map(([key, meta]) => {
          const k = key as CategoryKey;
          const active = k === activeCat;
          return (
            <button
              key={k}
              className={active ? "pill pillActive" : "pill"}
              onClick={() => setActiveCat(k)}
              type="button"
            >
              <span aria-hidden="true">{meta.icon}</span>
              <span>{meta.label}</span>
            </button>
          );
        })}
      </div>

      <div className="controlsRow">
        <div className="searchBar">
          <span aria-hidden="true" style={{ color: "var(--muted)" }}>⌕</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search markets..."
            aria-label="Search markets"
          />
        </div>

        <div className="sortBox">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value === "title" ? "title" : "trending")}
            aria-label="Sort"
          >
            <option value="trending">Trending</option>
            <option value="title">Title</option>
          </select>
        </div>
      </div>

      {initialError && (
        <div className="card" style={{ borderColor: "#ffc7c7", background: "#fff0f0" }}>
          <strong>API error</strong>
          <div style={{ marginTop: 6 }}>{initialError}</div>
          <div style={{ marginTop: 8, color: "var(--muted)" }}>
            Backend must respond at <code>/markets</code>.
          </div>
        </div>
      )}

      {!initialError && initialMarkets.length === 0 && (
        <div className="card">
          <strong>Loading markets...</strong>
        </div>
      )}

      {!initialError && featuredMarket && (
        <div className="marketsTopPanel">
          <Link
            href={`/markets/${encodeURIComponent(featuredMarket.market.id)}`}
            className="featuredMarketCard"
          >
            <div className="featuredMarketTop">
              <span className="featuredMarketBadge">Top Trending</span>
              <span className="featuredMarketPill">{categoryMeta[featuredMarket.category].label}</span>
            </div>

            <h2 className="featuredMarketTitle">{featuredMarket.market.title}</h2>

            <p className="featuredMarketDescription">
              {featuredMarket.market.description ??
                "Highest live momentum right now based on traded volume and probability movement."}
            </p>

            <div className="featuredMarketStats">
              <div className="featuredMarketStat">
                <span>Yes</span>
                <strong>{formatPercent(featuredMarket.probability)}</strong>
              </div>
              <div className="featuredMarketStat">
                <span>No</span>
                <strong>{formatPercent(1 - featuredMarket.probability)}</strong>
              </div>
              <div className="featuredMarketStat">
                <span>Move</span>
                <strong
                  className={
                    featuredMarket.moverDelta >= 0
                      ? "featuredMarketDelta featuredMarketDeltaUp"
                      : "featuredMarketDelta featuredMarketDeltaDown"
                  }
                >
                  {featuredMarket.moverDelta >= 0 ? "▲" : "▼"} {Math.abs(featuredMarket.moverDelta)}
                </strong>
              </div>
            </div>

            <div className="featuredMarketTrack" aria-hidden="true">
              <div
                className="featuredMarketTrackFill"
                style={{ width: `${featuredMarket.probabilityPct}%` }}
              />
            </div>

            <div className="featuredMarketFooter">
              <span>{formatKrShort(featuredMarket.volume)} volume</span>
              <span>{featuredMarket.isOpen ? "Open" : "Ended"}</span>
            </div>
          </Link>

          <aside className="marketsRail">
            {sidebarSections.map((section) => (
              <section key={section.key} className="marketsRailSection">
                <div className="marketsRailHeader">
                  <h3>{section.title}</h3>
                </div>

                <div className="marketsRailList">
                  {section.items.map((item, index) => (
                    <Link
                      key={`${section.key}-${item.market.id}`}
                      href={`/markets/${encodeURIComponent(item.market.id)}`}
                      className="marketsRailItem"
                    >
                      <div className="marketsRailMain">
                        <span className="marketsRailRank">{index + 1}</span>
                        <div className="marketsRailText">
                          <span className="marketsRailQuestion">{item.market.title}</span>
                          <span className="marketsRailMeta">{categoryMeta[item.category].label}</span>
                        </div>
                      </div>

                      <div className="marketsRailValues">
                        <span className="marketsRailPercent">{item.probabilityPct}%</span>
                        {section.key === "topMovers" ? (
                          <span
                            className={
                              item.moverDelta >= 0
                                ? "marketsRailDelta marketsRailDeltaUp"
                                : "marketsRailDelta marketsRailDeltaDown"
                            }
                          >
                            {item.moverDelta >= 0 ? "▲" : "▼"} {Math.abs(item.moverDelta)}
                          </span>
                        ) : section.key === "highestVolume" ? (
                          <span className="marketsRailSubValue">{formatKrShort(item.volume)}</span>
                        ) : (
                          <span className="marketsRailSubValue">vol {formatKrShort(item.volume)}</span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            ))}
          </aside>
        </div>
      )}

      <div className="grid">
        {filtered.map((m) => {
          const ended = m.status !== "open";
          const category = m.category ?? "finance";
          const volume = m.volumeKr ?? 0;

          return (
            <Link key={m.id} href={`/markets/${encodeURIComponent(m.id)}`} className="card">
              <div className="cardTop">
                <span className={tagClass(category)}>
                  <span aria-hidden="true">
                    {category === "finance" && "📈"}
                    {category === "sports" && "🏆"}
                    {category === "politics" && "🗳"}
                    {category === "entertainment" && "🎬"}
                  </span>
                  <span>{category}</span>
                </span>

                <span className="ended">
                  <span aria-hidden="true">🕒</span>
                  <span>{ended ? "Ended" : "Open"}</span>
                </span>
              </div>

              <div className="cardTitle">{m.title}</div>

              <div className="priceRow">
                <span className="priceBtn priceYes">
                  <span>Yes</span>
                  <span>{formatDkk(m.yesPrice)}</span>
                </span>
                <span className="priceBtn priceNo">
                  <span>No</span>
                  <span>{formatDkk(m.noPrice)}</span>
                </span>
              </div>

              <div className="cardBottom">
                <span aria-hidden="true">↗</span>
                <span>{formatKrShort(volume)}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
