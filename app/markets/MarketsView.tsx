"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Market } from "../lib/markets/types";

type CategoryKey = "all" | "politics" | "sports" | "finance" | "entertainment";
type MarketCategory = Exclude<CategoryKey, "all">;
type SidebarSection = "trending" | "topMovers" | "new" | "highestVolume";
type HeroChartRange = "1D" | "1W" | "1M" | "All";

type HeroChartPoint = {
  label: string;
  price: number;
};

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

const categoryMeta: Record<CategoryKey, { label: string }> = {
  all: { label: "All Markets" },
  politics: { label: "Politics" },
  sports: { label: "Sports" },
  finance: { label: "Finance" },
  entertainment: { label: "Entertainment" },
};
const HERO_CHART_RANGES: readonly HeroChartRange[] = ["1D", "1W", "1M", "All"];

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

function clampProbability(value: number) {
  return Math.max(0.01, Math.min(0.99, value));
}

function hashString(input: string) {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function buildHeroChartSeries(
  market: RankedMarket,
  range: HeroChartRange,
  anchor: Date,
): HeroChartPoint[] {
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const configs: Record<HeroChartRange, { points: number; stepHours: number }> = {
    "1D": { points: 25, stepHours: 1 },
    "1W": { points: 22, stepHours: 8 },
    "1M": { points: 20, stepHours: 36 },
    All: { points: 24, stepHours: 96 },
  };

  const seed = hashString(market.market.id);
  const phase = (seed % 17) * 0.21;
  const micro = (seed % 31) * 0.13;
  const trendBias = Math.max(-0.08, Math.min(0.08, market.moverDelta / 100));
  const { points, stepHours } = configs[range];

  const series: HeroChartPoint[] = [];
  for (let i = 0; i < points; i += 1) {
    const ratio = points === 1 ? 0 : i / (points - 1);
    const wave = Math.sin(ratio * Math.PI * 1.8 + phase) * 0.045;
    const wiggle = Math.cos((i + 1) * 0.75 + micro) * 0.015;
    const drift = (ratio - 0.5) * trendBias;
    const pulse = Math.sin((ratio + 0.12) * Math.PI * 3 + phase) * 0.01;
    const price = clampProbability(market.probability + wave + wiggle + drift + pulse);
    const date = new Date(anchor.getTime() - (points - 1 - i) * stepHours * 60 * 60 * 1000);
    const label =
      range === "1D"
        ? `${String(date.getHours()).padStart(2, "0")}:00`
        : range === "1W"
        ? `${dayNames[date.getDay()]} ${String(date.getHours()).padStart(2, "0")}:00`
        : range === "1M"
        ? `${date.getDate()} ${monthNames[date.getMonth()]}`
        : `${monthNames[date.getMonth()]} ${String(date.getFullYear()).slice(2)}`;
    series.push({ label, price });
  }

  return series;
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
  const [heroChartRange, setHeroChartRange] = useState<HeroChartRange>("1W");
  const [heroHoverIndex, setHeroHoverIndex] = useState<number | null>(null);
  const chartAnchor = useMemo(() => new Date(), []);

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

    list.sort((a, b) => {
      const rankA = rankingById.get(a.id)?.trendScore ?? 0;
      const rankB = rankingById.get(b.id)?.trendScore ?? 0;
      if (rankB !== rankA) return rankB - rankA;
      return (b.volumeKr ?? 0) - (a.volumeKr ?? 0);
    });

    return list;
  }, [categoryMarkets, query, rankingById]);

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

  const heroChartSeries = useMemo(() => {
    if (!featuredMarket) return [];
    return buildHeroChartSeries(featuredMarket, heroChartRange, chartAnchor);
  }, [featuredMarket, heroChartRange, chartAnchor]);

  const heroChartPoints = useMemo(() => {
    if (heroChartSeries.length === 0) return [];
    const lastIndex = heroChartSeries.length - 1;
    return heroChartSeries.map((point, index) => ({
      ...point,
      x: lastIndex === 0 ? 0 : (index / lastIndex) * 100,
      y: (1 - point.price) * 100,
    }));
  }, [heroChartSeries]);

  const heroChartLinePath = useMemo(() => {
    if (heroChartPoints.length === 0) return "";
    return heroChartPoints
      .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
      .join(" ");
  }, [heroChartPoints]);

  const heroChartAreaPath = useMemo(() => {
    if (!heroChartLinePath) return "";
    return `${heroChartLinePath} L 100 100 L 0 100 Z`;
  }, [heroChartLinePath]);

  const heroHoverPoint = heroHoverIndex !== null ? heroChartPoints[heroHoverIndex] : null;
  const heroNowPoint =
    heroHoverPoint ?? (heroChartPoints.length > 0 ? heroChartPoints[heroChartPoints.length - 1] : null);

  useEffect(() => {
    setHeroHoverIndex(null);
  }, [heroChartRange, featuredMarket?.market.id]);

  const handleHeroChartMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (heroChartPoints.length === 0) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const relativeX = Math.min(Math.max(event.clientX - rect.left, 0), rect.width);
    const ratio = rect.width === 0 ? 0 : relativeX / rect.width;
    const index = Math.round(ratio * (heroChartPoints.length - 1));
    setHeroHoverIndex(index);
  };

  const handleHeroChartLeave = () => {
    setHeroHoverIndex(null);
  };

  return (
    <section>
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
              <span>{meta.label}</span>
            </button>
          );
        })}
      </div>

      <div className="controlsRow marketsControlsRow">
        <div className="searchBar">
          <span aria-hidden="true" style={{ color: "var(--muted)" }}>⌕</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search markets..."
            aria-label="Search markets"
          />
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
        <div className="marketsBoard">
          <div className="marketsBoardMain">
            <article className="featuredMarketCard">
              <div className="featuredMarketTop">
                <span className="featuredMarketBadge">Top Trending</span>
                <div className="featuredMarketTopRight">
                  <span className="featuredMarketPill">{categoryMeta[featuredMarket.category].label}</span>
                  <Link
                    href={`/markets/${encodeURIComponent(featuredMarket.market.id)}`}
                    className="featuredMarketOpenLink"
                  >
                    Open market
                  </Link>
                </div>
              </div>

              <h2 className="featuredMarketTitle">
                <Link href={`/markets/${encodeURIComponent(featuredMarket.market.id)}`}>
                  {featuredMarket.market.title}
                </Link>
              </h2>

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

              <div className="featuredMarketChartWrap">
                <div className="featuredMarketChartHeader">
                  <div>
                    <span className="featuredMarketChartEyebrow">Probability trend</span>
                    <strong className="featuredMarketChartNow">
                      {heroNowPoint ? formatPercent(heroNowPoint.price) : formatPercent(featuredMarket.probability)}
                    </strong>
                  </div>
                  <div className="featuredMarketChartPills">
                    {HERO_CHART_RANGES.map((range) => (
                      <button
                        key={range}
                        type="button"
                        className={
                          range === heroChartRange
                            ? "featuredMarketChartPill featuredMarketChartPillActive"
                            : "featuredMarketChartPill"
                        }
                        onClick={() => setHeroChartRange(range)}
                      >
                        {range}
                      </button>
                    ))}
                  </div>
                </div>

                <div
                  className="featuredMarketChart"
                  onPointerMove={handleHeroChartMove}
                  onPointerLeave={handleHeroChartLeave}
                >
                  <div className="featuredMarketChartGrid" />
                  <svg className="featuredMarketChartSvg" viewBox="0 0 100 100" preserveAspectRatio="none">
                    <path className="featuredMarketChartArea" d={heroChartAreaPath} />
                    <path className="featuredMarketChartLine" d={heroChartLinePath} />
                  </svg>

                  {heroHoverPoint && (
                    <div className="featuredMarketChartHover" style={{ left: `${heroHoverPoint.x}%` }}>
                      <div className="featuredMarketChartHoverLine" />
                      <div className="featuredMarketChartHoverDot" style={{ top: `${heroHoverPoint.y}%` }} />
                      <div
                        className={
                          heroHoverPoint.x > 74
                            ? "featuredMarketChartTooltip featuredMarketChartTooltipRight"
                            : "featuredMarketChartTooltip"
                        }
                      >
                        <span>{heroHoverPoint.label}</span>
                        <strong>{formatPercent(heroHoverPoint.price)}</strong>
                        <em>{formatDkk(heroHoverPoint.price)}</em>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="featuredMarketFooter">
                <span>{formatKrShort(featuredMarket.volume)} volume</span>
                <span>{featuredMarket.isOpen ? "Open" : "Ended"}</span>
              </div>
            </article>

            <div className="marketsMainHeader">
              <h2>Top Markets</h2>
            </div>

            {filtered.length === 0 && (
              <div className="card marketsEmptyState">
                No markets match your current filters.
              </div>
            )}

            {filtered.map((m) => {
              const ended = m.status !== "open";
              const category = m.category ?? "finance";
              const categoryLabel = categoryMeta[normalizeCategory(category)].label;
              const volume = m.volumeKr ?? 0;

              return (
                <Link key={m.id} href={`/markets/${encodeURIComponent(m.id)}`} className="card">
                  <div className="cardTop">
                    <span className={tagClass(category)}>
                      <span>{categoryLabel}</span>
                    </span>

                    <span className="ended">{ended ? "Ended" : "Open"}</span>
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
    </section>
  );
}
