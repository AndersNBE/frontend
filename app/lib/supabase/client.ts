"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseCredentials } from "./config";

let browserClient: SupabaseClient | null = null;

export function createSupabaseBrowserClient(): SupabaseClient {
  if (browserClient) {
    return browserClient;
  }

  const { url, anonKey } = getSupabaseCredentials();
  browserClient = createBrowserClient(url, anonKey, {
    auth: { flowType: "pkce" },
  });

  return browserClient;
}
