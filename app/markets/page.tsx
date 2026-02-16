import { Suspense } from "react";
import MarketsClientPage from "./ClientPage";

export default function MarketsPage() {
  return (
    <Suspense fallback={null}>
      <MarketsClientPage />
    </Suspense>
  );
}
