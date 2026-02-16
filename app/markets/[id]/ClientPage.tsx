"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "../../lib/api/client";
import type { Market } from "../../lib/markets/types";
import MarketDetailView from "./MarketDetailView";

export default function MarketDetailClientPage({ id }: { id: string }) {
  const [market, setMarket] = useState<Market | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const data = await apiFetch<Market>(`/markets/${encodeURIComponent(id)}`);
        if (!cancelled) {
          setMarket(data);
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
  }, [id]);

  return <MarketDetailView market={market} error={error} />;
}
