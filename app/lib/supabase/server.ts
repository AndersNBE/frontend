import { createServerClient, type CookieOptions } from "@supabase/ssr";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { getSupabaseCredentials } from "./config";

type CookieToSet = {
  name: string;
  value: string;
  options: CookieOptions;
};

export async function createSupabaseServerClient(): Promise<SupabaseClient> {
  const cookieStore = await cookies();
  const { url, anonKey } = getSupabaseCredentials();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components may have read-only cookie access.
        }
      },
    },
  });
}

export async function getServerUser(): Promise<User | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    return null;
  }

  return user;
}
