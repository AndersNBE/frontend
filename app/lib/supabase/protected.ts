import "server-only";

import type { User } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { normalizeNextPath } from "./redirect";
import { getServerUser } from "./server";

export async function requireServerUser(nextPath: string): Promise<User> {
  const user = await getServerUser();
  if (user) {
    return user;
  }

  const safeNextPath = normalizeNextPath(nextPath, "/markets");
  redirect(`/signin?next=${encodeURIComponent(safeNextPath)}`);
}
