"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Market } from "./page";

type CategoryKey = "all" | "politics" | "sports" | "finance" | "entertainment";

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

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    let list = initialMarkets.slice();

    if (activeCat !== "all") {
      list = list.filter((m) => (m.category ?? "finance") === activeCat);
    }

    if (q) {
      list = list.filter((m) => m.title.toLowerCase().includes(q));
    }

    if (sort === "trending") {
      list.sort((a, b) => (b.volumeKr ?? 0) - (a.volumeKr ?? 0));
    } else {
      list.sort((a, b) => a.title.localeCompare(b.title));
    }

    return list;
  }, [activeCat, query, sort, initialMarkets]);

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
          <span style={{ fontSize: 12, fontWeight: 700, color: "#0ea765" }}>
            SEARCH BAR HERE
          </span>
          <span aria-hidden="true" style={{ color: "var(--muted)" }}>⌕</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search markets..."
            aria-label="Search markets"
          />
        </div>

        <div className="sortBox">
          <select value={sort} onChange={(e) => setSort(e.target.value as any)} aria-label="Sort">
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
