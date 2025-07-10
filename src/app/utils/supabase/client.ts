import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

export const setAuthToken = (jwt: string | undefined) => {
  if (jwt) {
    const client = supabase as unknown as {
      _headers: Record<string, string>;
    };
    client._headers = {
      ...client._headers,
      Authorization: `Bearer ${jwt}`,
    };
  }
};

export const createClient = () => supabase;
