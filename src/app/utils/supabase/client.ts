import { createBrowserClient } from "@supabase/ssr";
import { Database } from "../../../../database.types.gen";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createBrowserClient<Database>(
  supabaseUrl,
  supabaseAnonKey
);

export const setAuthToken = (
  jwt: string | undefined,
  refreshToken?: string
) => {
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
            .setSession({
              access_token: jwt,
              refresh_token: refreshToken ?? "",
            })
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client = supabase as any;
  // Override accessToken resolver used by fetchWithAuth wrapper
  client.accessToken = () => Promise.resolve(jwt);

  // Also patch base headers so PostgREST client immediately includes it
  client.headers = {
    ...client.headers,
    Authorization: `Bearer ${jwt}`,
  };
};

export const createClient = () => supabase;
