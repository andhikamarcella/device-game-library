import { createBrowserClient } from "@supabase/supabase-js";
import { Database } from "./types";

let client: ReturnType<typeof createBrowserClient<Database>> | null = null;

const getSupabaseUrl = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  if (!url) {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL) must be configured for client usage.");
  }
  return url;
};

const getAnonKey = () => {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (!key) {
    throw new Error("NEXT_PUBLIC_SUPABASE_ANON_KEY (or SUPABASE_ANON_KEY) must be configured.");
  }
  return key;
};

/**
 * Singleton wrapper to create a Supabase client in the browser.
 */
export function getClientSupabase() {
  if (!client) {
    client = createBrowserClient<Database>(getSupabaseUrl(), getAnonKey(), {
      auth: {
        persistSession: false,
      },
      global: {
        headers: {
          "x-client-info": "dg-tracker-browser",
        },
      },
    });
  }
  return client;
}
