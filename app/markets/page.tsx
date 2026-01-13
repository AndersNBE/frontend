import { Suspense } from "react";
import { apiFetch } from "../lib/api/client";
import MarketsClientPage from "./ClientPage";

type Category = "politics" | "sports" | "finance" | "entertainment";

export type Market = {
  id: string;
  title: string;
  status: "open" | "closed" | "settled";
  yesPrice: number;
  noPrice: number;
  description?: string;
  category?: Category;
  volumeKr?: number;
};

export default async function MarketsPage() {
  let markets: Market[] = [];
  let error: string | null = null;

  try {
    markets = await apiFetch<Market[]>("/markets");
  } catch (e: any) {
    error = e?.message ?? "Unknown error";
  }

  return (
    <Suspense fallback={null}>
      <MarketsClientPage initialMarkets={markets} initialError={error} />
    </Suspense>
  );
}
