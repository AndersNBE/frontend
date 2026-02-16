import { Suspense } from "react";
import { requireServerUser } from "../lib/supabase/protected";
import MarketsClientPage from "./ClientPage";

export default async function MarketsPage() {
  await requireServerUser("/markets");

  return (
    <Suspense fallback={null}>
      <MarketsClientPage />
    </Suspense>
  );
}
