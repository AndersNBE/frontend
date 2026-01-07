// app/markets/page.tsx
import Link from "next/link";
import { apiFetch } from "../lib/api/client";

type Market = {
  id: string;
  title: string;
  status: "open" | "closed" | "settled";
  yesPrice: number;
  noPrice: number;
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
    <main style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <h1>Markets</h1>

      {error && (
        <div style={{ marginTop: 12, padding: 12, border: "1px solid #ccc" }}>
          <strong>API error</strong>
          <div>{error}</div>
          <div style={{ marginTop: 8 }}>
            Start backend locally and ensure CORS allows http://localhost:3000.
          </div>
        </div>
      )}

      {!error && markets.length === 0 && <p style={{ marginTop: 12 }}>No markets yet.</p>}

      <ul style={{ marginTop: 16, display: "grid", gap: 12, listStyle: "none", padding: 0 }}>
        {markets.map((m) => (
          <li key={m.id} style={{ border: "1px solid #ddd", padding: 12, borderRadius: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
              <div>
                <div style={{ fontWeight: 600 }}>{m.title}</div>
                <div style={{ opacity: 0.8, marginTop: 4 }}>Status: {m.status}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div>Yes: {m.yesPrice}</div>
                <div>No: {m.noPrice}</div>
              </div>
            </div>

            <div style={{ marginTop: 10 }}>
              <Link href={`/markets/${encodeURIComponent(m.id)}`}>Open</Link>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
