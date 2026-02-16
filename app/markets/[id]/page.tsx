import { requireServerUser } from "../../lib/supabase/protected";
import MarketDetailClientPage from "./ClientPage";

export default async function MarketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: rawId } = await params;
  const marketId = decodeURIComponent(rawId);
  await requireServerUser(`/markets/${encodeURIComponent(marketId)}`);
  return <MarketDetailClientPage id={marketId} />;
}
