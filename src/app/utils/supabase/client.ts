import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);

export const setAuthToken = (jwt: string | undefined) => {
  if (!jwt) return;

  // Try the official APIs first (vary between v1/v2)
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const auth: any = (supabase as any).auth;

    if (auth) {
      // Supabase-js v2 prefers setSession. It expects both access & refresh tokens.
      if (typeof auth.setSession === "function") {
        return (
          auth
            .setSession({ access_token: jwt, refresh_token: "" })
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .then(({ data, error }: { data: any; error: any }) => {
              if (error) {
                console.error("setAuthToken: setSession error", error);
              } else {
                console.log(
                  "setAuthToken: session set for user",
                  data.session?.user?.id
                );
              }
            })
        );
      }

      // Supabase-js v1 exposes setAuth which is simpler.
      if (typeof auth.setAuth === "function") {
        auth.setAuth(jwt);
        return;
      }
    }
  } catch (err) {
    console.error(
      "setAuthToken: failed to set via auth API, falling back to header hack",
      err
    );
  }

  // Fallback: mutate internal headers (works but may be overwritten later).
  const client = supabase as unknown as { _headers: Record<string, string> };
  client._headers = {
    ...client._headers,
    Authorization: `Bearer ${jwt}`,
  };
};

export const createClient = () => supabase;
