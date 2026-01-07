// app/page.tsx
import Link from "next/link";

export default function Home() {
  return (
    <main style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
      <h1>Foresee UI</h1>
      <p style={{ marginTop: 8, opacity: 0.85 }}>
        Frontend connected to backend via NEXT_PUBLIC_API_URL.
      </p>

      <div style={{ marginTop: 16, display: "flex", gap: 12 }}>
        <Link href="/markets">Markets</Link>
      </div>
    </main>
  );
}
