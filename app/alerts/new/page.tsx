import { Suspense } from "react";
import AlertsNewClientPage from "./ClientPage";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <AlertsNewClientPage />
    </Suspense>
  );
}
