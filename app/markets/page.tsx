import { Suspense } from "react";
import { requireServerUser } from "../lib/supabase/protected";
import { isWaitlistAccessGrantedForUser } from "../lib/waitlist-gate";
import MarketsClientPage from "./ClientPage";

export default async function MarketsPage() {
  const user = await requireServerUser("/markets");
  const waitlistUnlocked = await isWaitlistAccessGrantedForUser(user.id);

  return (
    <Suspense fallback={null}>
      <MarketsClientPage
        waitlistUnlocked={waitlistUnlocked}
        waitlistEmail={user.email ?? ""}
      />
    </Suspense>
  );
}
