import { createClient } from "@supabase/supabase-js";
import { Database } from "./types";

const getSupabaseUrl = () => {
  const url = process.env.SUPABASE_URL;
  if (!url) {
    throw new Error("SUPABASE_URL environment variable is not set.");
  }
  return url;
};

const getServiceKey = () => {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
  if (!key) {
    throw new Error(
      "Either SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY must be configured for server access.",
    );
  }
  return key;
};

/**
 * Create a Supabase client for server-side usage. Falls back to the anon key when a service key
 * is not available which keeps the app usable in local development environments without RLS.
 */
export function createServerSupabaseClient() {
  return createClient<Database>(getSupabaseUrl(), getServiceKey(), {
    auth: {
      persistSession: false,
    },
    global: {
      headers: {
        "x-client-info": "dg-tracker-server",
      },
    },
  });
}
