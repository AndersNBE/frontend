"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

type Category = "politics" | "sports" | "finance" | "entertainment";

type Market = {
  id: string;
  title: string;
  status: "open" | "closed" | "settled";
  yesPrice: number;
  noPrice: number;
  description?: string;
  category?: Category;
  volumeKr?: number;
};

type OrderBookRow = {
  price: number;
  size: number;
};

type OrderBookSide = {
  bids: OrderBookRow[];
  asks: OrderBookRow[];
};

type ChartSeriesPoint = {
  label: string;
  price: number;
};

const TABS = ["Overview", "Order Book", "Activity", "Details"] as const;
const CHART_RANGES = ["1D", "1W", "1M", "All"] as const;

const chartRangeLabels: Record<(typeof CHART_RANGES)[number], string> = {
  "1D": "last 24h",
  "1W": "last week",
  "1M": "last 30 days",
  All: "all time",
};

function formatDkk(price: number) {
  if (!Number.isFinite(price)) return "";
  return `${price.toFixed(2).replace(".", ",")} DKK`;
}

function formatDkkInput(price: number) {
  if (!Number.isFinite(price)) return "0.50";
  return price.toFixed(2);
}

function clampPrice(price: number) {
  return Math.min(0.99, Math.max(0.01, price));
}

function formatKrShort(value: number) {
  if (!Number.isFinite(value)) return "";
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}m kr`;
  if (abs >= 1_000) return `${(value / 1_000).toFixed(1)}k kr`;
  return `${Math.round(value)} kr`;
}

function buildChartSeries(
  base: number,
  range: (typeof CHART_RANGES)[number],
  anchor: Date,
): ChartSeriesPoint[] {
  const clamp = (value: number) => clampPrice(value);
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const configs: Record<(typeof CHART_RANGES)[number], { points: number; stepHours: number }> = {
    "1D": { points: 24, stepHours: 1 },
    "1W": { points: 14, stepHours: 12 },
    "1M": { points: 15, stepHours: 48 },
    All: { points: 20, stepHours: 72 },
  };

  const { points, stepHours } = configs[range];
  const series: ChartSeriesPoint[] = [];

  for (let i = 0; i < points; i += 1) {
    const ratio = points === 1 ? 0 : i / (points - 1);
    const wave = Math.sin(ratio * Math.PI * 1.6) * 0.07;
    const wiggle = Math.cos(i * 0.9) * 0.02;
    const drift = (ratio - 0.5) * 0.04;
    const price = clamp(base + wave + wiggle + drift);
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

function buildOrderBook(basePrice: number): OrderBookSide {
  const bidDeltas = [0.06, 0.04, 0.02];
  const askDeltas = [0.02, 0.04, 0.06];
  const bidSizes = [1800, 1300, 900];
  const askSizes = [1500, 1100, 760];

  return {
    bids: bidDeltas.map((delta, index) => ({
      price: clampPrice(basePrice - delta),
      size: bidSizes[index],
    })),
    asks: askDeltas.map((delta, index) => ({
      price: clampPrice(basePrice + delta),
      size: askSizes[index],
    })),
  };
}

export default function MarketDetailView({
  market,
  error,
}: {
  market: Market | null;
  error: string | null;
}) {
  const router = useRouter();
  const chartAnchor = useMemo(() => new Date(), []);
  const [activeTab, setActiveTab] = useState<(typeof TABS)[number]>("Overview");
  const [chartRange, setChartRange] = useState<(typeof CHART_RANGES)[number]>("1D");
  const [side, setSide] = useState<"buy" | "sell">("buy");
  const [outcome, setOutcome] = useState<"yes" | "no">("yes");
  const [orderType, setOrderType] = useState<"limit" | "market">("limit");
  const [quantity, setQuantity] = useState("100");
  const [limitPrice, setLimitPrice] = useState(() =>
    formatDkkInput(market?.yesPrice ?? 0.5),
  );
  const [notice, setNotice] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [watching, setWatching] = useState(false);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const yesPrice = market?.yesPrice ?? 0.5;
  const noPrice = market?.noPrice ?? 0.5;
  const statusLabel = market?.status === "open" ? "Open" : "Ended";
  const volume = market?.volumeKr ?? 0;
  const yesBook = useMemo(() => buildOrderBook(yesPrice), [yesPrice]);
  const noBook = useMemo(() => buildOrderBook(noPrice), [noPrice]);
  const bestBid = clampPrice(yesPrice - 0.03);
  const bestAsk = clampPrice(yesPrice + 0.03);
  const spread = Math.max(0, bestAsk - bestBid);
  const currentPrice = outcome === "yes" ? yesPrice : noPrice;
  const parsedLimit = Number(limitPrice);
  const displayedPrice =
    orderType === "limit" && Number.isFinite(parsedLimit) ? parsedLimit : currentPrice;
  const estimatedCost = (Number(quantity) || 0) * displayedPrice;
  const maxBookSize = Math.max(
    ...yesBook.bids.map((row) => row.size),
    ...yesBook.asks.map((row) => row.size),
    ...noBook.bids.map((row) => row.size),
    ...noBook.asks.map((row) => row.size),
  );
  const chartSeries = useMemo(
    () => buildChartSeries(yesPrice, chartRange, chartAnchor),
    [yesPrice, chartRange, chartAnchor],
  );
  const chartPoints = useMemo(() => {
    if (chartSeries.length === 0) return [];
    const lastIndex = chartSeries.length - 1;
    return chartSeries.map((point, index) => ({
      ...point,
      x: lastIndex === 0 ? 0 : (index / lastIndex) * 100,
      y: (1 - point.price) * 100,
    }));
  }, [chartSeries]);
  const chartLinePath = useMemo(() => {
    if (chartPoints.length === 0) return "";
    return chartPoints
      .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
      .join(" ");
  }, [chartPoints]);
  const chartAreaPath = useMemo(() => {
    if (!chartLinePath) return "";
    return `${chartLinePath} L 100 100 L 0 100 Z`;
  }, [chartLinePath]);
  const hoverPoint = hoverIndex !== null ? chartPoints[hoverIndex] : null;

  const activity = [
    { time: "2m ago", action: "Buy", side: "Yes", size: 220, price: 0.59 },
    { time: "12m ago", action: "Sell", side: "No", size: 140, price: 0.43 },
    { time: "34m ago", action: "Buy", side: "Yes", size: 500, price: 0.57 },
    { time: "1h ago", action: "Buy", side: "No", size: 300, price: 0.45 },
  ];

  const insights = [
    { label: "Probability", value: `${Math.round(yesPrice * 100)}%` },
    { label: "Midpoint", value: formatDkk(yesPrice) },
    { label: "Spread", value: formatDkk(spread) },
    { label: "Volume", value: formatKrShort(volume) },
    { label: "Open interest", value: formatKrShort(volume * 0.24) },
    { label: "24h change", value: "+3.2%" },
  ];

  const handleOutcome = (next: "yes" | "no") => {
    setOutcome(next);
    if (orderType === "limit") {
      const nextPrice = next === "yes" ? yesPrice : noPrice;
      setLimitPrice(formatDkkInput(nextPrice));
    }
  };

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2400);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const handleCreateAlert = () => {
    if (!market) return;
    router.push(`/alerts/new?market=${encodeURIComponent(market.id)}`);
  };

  const handleShare = async () => {
    if (!market) return;
    const shareUrl = typeof window !== "undefined" ? window.location.href : "";
    const title = market.title;

    if (navigator.share) {
      try {
        await navigator.share({ title, url: shareUrl });
        setToast("Share dialog opened.");
        return;
      } catch {
        setToast("Share cancelled.");
        return;
      }
    }

    if (navigator.clipboard && shareUrl) {
      try {
        await navigator.clipboard.writeText(shareUrl);
        setToast("Link copied to clipboard.");
        return;
      } catch {
        // fall through to prompt
      }
    }

    if (shareUrl) {
      window.prompt("Copy this link", shareUrl);
      setToast("Link ready to copy.");
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice("Trading is disabled in demo mode. Connect your trading API to enable orders.");
  };

  const handleChartMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (chartPoints.length === 0) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const relativeX = Math.min(Math.max(event.clientX - rect.left, 0), rect.width);
    const ratio = rect.width === 0 ? 0 : relativeX / rect.width;
    const index = Math.round(ratio * (chartPoints.length - 1));
    setHoverIndex(index);
  };

  const handleChartLeave = () => {
    setHoverIndex(null);
  };

  return (
    <section className="marketDetailShell">
      <Link href="/markets" className="backLink">
        <span aria-hidden="true">←</span>
        <span>Back to markets</span>
      </Link>

      {error && (
        <div className="marketAlert" role="alert">
          <strong>API error</strong>
          <div>{error}</div>
        </div>
      )}

      {!market && !error && (
        <div className="marketAlert" role="status">
          Market not available.
        </div>
      )}

      {market && (
        <>
          <div className="marketHero">
            <div className="marketHeroTop">
              <span className="marketBadge">{statusLabel}</span>
              <span className="marketCategory">{market.category ?? "finance"}</span>
              <div className="marketHeroActions">
                <button
                  className={watching ? "marketAction active" : "marketAction"}
                  type="button"
                  onClick={() => setWatching((prev) => !prev)}
                >
                  {watching ? "Watching" : "Watch"}
                </button>
                <button className="marketAction" type="button" onClick={handleCreateAlert}>
                  Create alert
                </button>
                <button className="marketAction" type="button" onClick={handleShare}>
                  Share
                </button>
              </div>
            </div>

            <h1 className="marketTitle">{market.title}</h1>
            <p className="marketDesc">{market.description ?? "Track this contract in real time."}</p>

            <div className="marketHeroMeta">
              <div>
                <span className="marketMetaLabel">Best bid</span>
                <span className="marketMetaValue">{formatDkk(bestBid)}</span>
              </div>
              <div>
                <span className="marketMetaLabel">Best ask</span>
                <span className="marketMetaValue">{formatDkk(bestAsk)}</span>
              </div>
              <div>
                <span className="marketMetaLabel">Volume</span>
                <span className="marketMetaValue">{formatKrShort(volume)}</span>
              </div>
              <div>
                <span className="marketMetaLabel">Close</span>
                <span className="marketMetaValue">Dec 31, 2026</span>
              </div>
            </div>
          </div>

          {toast && (
            <div className="marketToast" role="status">
              {toast}
            </div>
          )}

          <div className="marketStatsGrid">
            {insights.map((item) => (
              <div key={item.label} className="marketStatCard">
                <span className="marketStatLabel">{item.label}</span>
                <span className="marketStatValue">{item.value}</span>
              </div>
            ))}
          </div>

          <div className="marketLayout">
            <div className="marketMain">
              <div className="marketCard">
                <div className="marketTabs">
                  {TABS.map((tab) => (
                    <button
                      key={tab}
                      className={tab === activeTab ? "marketTab active" : "marketTab"}
                      type="button"
                      onClick={() => setActiveTab(tab)}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {activeTab === "Overview" && (
                  <div className="marketOverview">
                    <div className="marketChartCard">
                      <div className="marketChartHeader">
                        <div>
                          <h3>Price action</h3>
                          <p>Yes contract ({chartRangeLabels[chartRange]})</p>
                        </div>
                        <div className="marketChartPills">
                          {CHART_RANGES.map((range) => (
                            <button
                              key={range}
                              type="button"
                              className={range === chartRange ? "marketChartPill active" : "marketChartPill"}
                              onClick={() => setChartRange(range)}
                            >
                              {range}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div
                        className="marketChart"
                        onPointerMove={handleChartMove}
                        onPointerLeave={handleChartLeave}
                      >
                        <div className="marketChartGrid" />
                        <svg className="marketChartSvg" viewBox="0 0 100 100" preserveAspectRatio="none">
                          <path className="marketChartArea" d={chartAreaPath} />
                          <path className="marketChartStroke" d={chartLinePath} />
                        </svg>
                        {hoverPoint && (
                          <div className="marketChartHover" style={{ left: `${hoverPoint.x}%` }}>
                            <div className="marketChartHoverLine" />
                            <div className="marketChartDot" style={{ top: `${hoverPoint.y}%` }} />
                            <div
                              className={
                                hoverPoint.x > 70 ? "marketChartTooltip right" : "marketChartTooltip"
                              }
                            >
                              <span>{hoverPoint.label}</span>
                              <strong>{formatDkk(hoverPoint.price)}</strong>
                              <em>{Math.round(hoverPoint.price * 100)}%</em>
                            </div>
                          </div>
                        )}
                        <div className="marketChartHighlight">
                          <span>Now</span>
                          <strong>
                            {chartPoints.length > 0
                              ? formatDkk(chartPoints[chartPoints.length - 1].price)
                              : formatDkk(yesPrice)}
                          </strong>
                        </div>
                      </div>
                    </div>

                    <div className="marketRangeCard">
                      <div>
                        <h3>Contract range</h3>
                        <p>Probability band with midpoint focus.</p>
                      </div>
                      <div className="marketRange">
                        <div className="marketRangeFill" style={{ width: `${Math.round(yesPrice * 100)}%` }} />
                        <div className="marketRangeDot" style={{ left: `${Math.round(yesPrice * 100)}%` }} />
                      </div>
                      <div className="marketRangeLabels">
                        <span>0%</span>
                        <span>50%</span>
                        <span>100%</span>
                      </div>
                    </div>

                    <div className="marketGridSplit">
                      <div className="marketList">
                        <h3>Key stats</h3>
                        <div className="marketListItems">
                          <div>
                            <span>Liquidity</span>
                            <strong>High</strong>
                          </div>
                          <div>
                            <span>Participation</span>
                            <strong>1,240 traders</strong>
                          </div>
                          <div>
                            <span>Avg trade size</span>
                            <strong>240 contracts</strong>
                          </div>
                          <div>
                            <span>Settlement</span>
                            <strong>Cash settled</strong>
                          </div>
                        </div>
                      </div>
                      <div className="marketList">
                        <h3>Recent trades</h3>
                        <div className="marketActivity">
                          {activity.map((item) => (
                            <div key={`${item.time}-${item.price}`} className="marketActivityRow">
                              <span>{item.time}</span>
                              <span>{item.action} {item.side}</span>
                              <span>{item.size} @ {formatDkk(item.price)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "Order Book" && (
                  <div className="marketOrderBook">
                    <div className="marketBookBlock">
                      <h3>Yes order book</h3>
                      <div className="marketBookColumns">
                        <div>
                          <span className="marketBookLabel">Bids</span>
                          {yesBook.bids.map((row) => (
                            <div key={`yes-bid-${row.price}`} className="marketBookRow">
                              <span>{formatDkk(row.price)}</span>
                              <span>{row.size}</span>
                              <span
                                className="marketBookDepth bid"
                                style={{ width: `${(row.size / maxBookSize) * 100}%` }}
                              />
                            </div>
                          ))}
                        </div>
                        <div>
                          <span className="marketBookLabel">Asks</span>
                          {yesBook.asks.map((row) => (
                            <div key={`yes-ask-${row.price}`} className="marketBookRow">
                              <span>{formatDkk(row.price)}</span>
                              <span>{row.size}</span>
                              <span
                                className="marketBookDepth ask"
                                style={{ width: `${(row.size / maxBookSize) * 100}%` }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="marketBookBlock">
                      <h3>No order book</h3>
                      <div className="marketBookColumns">
                        <div>
                          <span className="marketBookLabel">Bids</span>
                          {noBook.bids.map((row) => (
                            <div key={`no-bid-${row.price}`} className="marketBookRow">
                              <span>{formatDkk(row.price)}</span>
                              <span>{row.size}</span>
                              <span
                                className="marketBookDepth bid"
                                style={{ width: `${(row.size / maxBookSize) * 100}%` }}
                              />
                            </div>
                          ))}
                        </div>
                        <div>
                          <span className="marketBookLabel">Asks</span>
                          {noBook.asks.map((row) => (
                            <div key={`no-ask-${row.price}`} className="marketBookRow">
                              <span>{formatDkk(row.price)}</span>
                              <span>{row.size}</span>
                              <span
                                className="marketBookDepth ask"
                                style={{ width: `${(row.size / maxBookSize) * 100}%` }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "Activity" && (
                  <div className="marketTimeline">
                    <h3>Market activity</h3>
                    <div className="marketTimelineList">
                      {activity.map((item) => (
                        <div key={`${item.time}-${item.action}`} className="marketTimelineRow">
                          <div className="marketTimelineDot" />
                          <div>
                            <strong>{item.action} {item.side}</strong>
                            <p>{item.size} contracts at {formatDkk(item.price)}</p>
                          </div>
                          <span>{item.time}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === "Details" && (
                  <div className="marketDetails">
                    <div>
                      <h3>Resolution</h3>
                      <p>
                        Market resolves based on the official close of the benchmark index on Dec 31, 2026.
                      </p>
                    </div>
                    <div>
                      <h3>Rules</h3>
                      <ul>
                        <li>Each contract settles to 1.00 if the event occurs, otherwise 0.00.</li>
                        <li>Trades close at the time listed above unless extended by administrators.</li>
                        <li>Disputes follow the exchange rulebook and public data sources.</li>
                      </ul>
                    </div>
                    <div>
                      <h3>Payout</h3>
                      <p>Contracts are cash settled in local currency with no physical delivery.</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <aside className="marketSide">
              <div className="marketCard">
                <div className="marketTicketHeader">
                  <h3>Order ticket</h3>
                  <span className="marketTicketSub">Balance: 18,240 kr</span>
                </div>
                <form className="marketTicketForm" onSubmit={handleSubmit}>
                  <div className="marketToggleRow">
                    <button
                      type="button"
                      className={side === "buy" ? "marketToggle active" : "marketToggle"}
                      onClick={() => setSide("buy")}
                    >
                      Buy
                    </button>
                    <button
                      type="button"
                      className={side === "sell" ? "marketToggle active" : "marketToggle"}
                      onClick={() => setSide("sell")}
                    >
                      Sell
                    </button>
                  </div>

                  <div className="marketToggleRow">
                    <button
                      type="button"
                      className={outcome === "yes" ? "marketToggle active" : "marketToggle"}
                      onClick={() => handleOutcome("yes")}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      className={outcome === "no" ? "marketToggle active" : "marketToggle"}
                      onClick={() => handleOutcome("no")}
                    >
                      No
                    </button>
                  </div>

                  <div className="marketSelectRow">
                    <label>
                      Order type
                      <select
                        value={orderType}
                        onChange={(event) => setOrderType(event.target.value as "limit" | "market")}
                      >
                        <option value="limit">Limit</option>
                        <option value="market">Market</option>
                      </select>
                    </label>
                    <label>
                      Contracts
                      <input
                        type="number"
                        min="1"
                        value={quantity}
                        onChange={(event) => setQuantity(event.target.value)}
                      />
                    </label>
                  </div>

                  {orderType === "limit" && (
                    <label className="marketPriceInput">
                      Limit price (DKK)
                      <input
                        type="number"
                        min="0.01"
                        max="0.99"
                        step="0.01"
                        value={limitPrice}
                        onChange={(event) => setLimitPrice(event.target.value)}
                      />
                    </label>
                  )}

                  <div className="marketTicketSummary">
                    <div>
                      <span>Estimated cost</span>
                      <strong>{formatKrShort(estimatedCost)}</strong>
                    </div>
                    <div>
                      <span>Potential payout</span>
                      <strong>{formatKrShort((Number(quantity) || 0) * 1)}</strong>
                    </div>
                  </div>

                  {notice && <div className="marketNotice">{notice}</div>}

                  <button type="submit" className="marketPrimaryButton">
                    {side === "buy" ? "Place order" : "Place sell order"}
                  </button>
                </form>
              </div>

              <div className="marketCard">
                <h3>Your position</h3>
                <div className="marketPosition">
                  <div>
                    <span>Yes contracts</span>
                    <strong>120</strong>
                  </div>
                  <div>
                    <span>No contracts</span>
                    <strong>40</strong>
                  </div>
                  <div>
                    <span>Avg entry</span>
                    <strong>0,52 DKK</strong>
                  </div>
                  <div>
                    <span>Unrealized PnL</span>
                    <strong className="positive">+640 kr</strong>
                  </div>
                </div>
              </div>

              <div className="marketCard">
                <h3>Contract info</h3>
                <div className="marketInfoList">
                  <div>
                    <span>Contract type</span>
                    <strong>Binary</strong>
                  </div>
                  <div>
                    <span>Resolution source</span>
                    <strong>Official exchange data</strong>
                  </div>
                  <div>
                    <span>Tick size</span>
                    <strong>0,01 DKK</strong>
                  </div>
                  <div>
                    <span>Trading hours</span>
                    <strong>24/7</strong>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </>
      )}
    </section>
  );
}
