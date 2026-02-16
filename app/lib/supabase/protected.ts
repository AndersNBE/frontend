import "server-only";

import { redirect } from "next/navigation";
import { normalizeNextPath } from "./redirect";
import { getServerUser } from "./server";

export async function requireServerUser(nextPath: string): Promise<void> {
  const user = await getServerUser();
  if (user) {
    return;
  }

  const safeNextPath = normalizeNextPath(nextPath, "/markets");
  redirect(`/signin?next=${encodeURIComponent(safeNextPath)}`);
}
