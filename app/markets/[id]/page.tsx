import { apiFetch } from "../../lib/api/client";
import MarketDetailView from "./MarketDetailView";

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

export default async function MarketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: rawId } = await params;
  const id = decodeURIComponent(rawId);

  let market: Market | null = null;
  let error: string | null = null;

  try {
    market = await apiFetch<Market>(`/markets/${encodeURIComponent(id)}`);
  } catch (e: any) {
    error = e?.message ?? "Unknown error";
  }

  return <MarketDetailView market={market} error={error} />;
}
