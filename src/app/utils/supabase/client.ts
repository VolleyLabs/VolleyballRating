import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export let supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

export const recreateSupabaseClient = (jwt?: string) => {
  supabase = createBrowserClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: jwt ? { Authorization: `Bearer ${jwt}` } : {},
    },
  });
  return supabase;
};

export const createClient = () => supabase;
