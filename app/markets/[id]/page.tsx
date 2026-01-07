import Link from "next/link";
import { apiFetch } from "../../lib/api/client";

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

function toOre(price: number) {
  return Math.round(price * 100);
}

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

  return (
    <section>
      <Link href="/markets" className="topTextLink">
        ← Back
      </Link>

      {error && (
        <div className="card" style={{ borderColor: "#ffc7c7", background: "#fff0f0", marginTop: 14 }}>
          <strong>API error</strong>
          <div style={{ marginTop: 6 }}>{error}</div>
        </div>
      )}

      {market && (
        <div className="card" style={{ marginTop: 14 }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
            <div style={{ fontSize: 22, fontWeight: 800 }}>{market.title}</div>
            <div className="ended">
              <span aria-hidden="true">🕒</span>
              <span>{market.status === "open" ? "Open" : "Ended"}</span>
            </div>
          </div>

          {market.description && (
            <p style={{ marginTop: 10, color: "var(--muted)" }}>{market.description}</p>
          )}

          <div className="priceRow" style={{ marginTop: 14 }}>
            <span className="priceBtn priceYes">
              <span>Yes</span>
              <span>{toOre(market.yesPrice)} øre</span>
            </span>
            <span className="priceBtn priceNo">
              <span>No</span>
              <span>{toOre(market.noPrice)} øre</span>
            </span>
          </div>
        </div>
      )}
    </section>
  );
}
