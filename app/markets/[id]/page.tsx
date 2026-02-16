import MarketDetailClientPage from "./ClientPage";

export default async function MarketPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: rawId } = await params;
  return <MarketDetailClientPage id={decodeURIComponent(rawId)} />;
}
