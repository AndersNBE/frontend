"use client";

import MarketsView from "./MarketsView";
import type { Market } from "./page";

export default function MarketsClientPage({
  initialMarkets,
  initialError,
}: {
  initialMarkets: Market[];
  initialError: string | null;
}) {
  return <MarketsView initialMarkets={initialMarkets} initialError={initialError} />;
}
