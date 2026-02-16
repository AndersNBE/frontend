import { Suspense } from "react";
import { requireServerUser } from "../../lib/supabase/protected";
import AlertsNewClientPage from "./ClientPage";

export default async function Page() {
  await requireServerUser("/alerts/new");

  return (
    <Suspense fallback={null}>
      <AlertsNewClientPage />
    </Suspense>
  );
}
