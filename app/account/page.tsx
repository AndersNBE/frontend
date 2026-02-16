import AccountClient from "./AccountClient";
import { requireServerUser } from "../lib/supabase/protected";

export default async function AccountPage() {
  const user = await requireServerUser("/account");

  return (
    <AccountClient
      email={user.email ?? ""}
      userId={user.id}
      emailConfirmedAt={user.email_confirmed_at ?? null}
      createdAt={user.created_at ?? null}
      lastSignInAt={user.last_sign_in_at ?? null}
    />
  );
}
