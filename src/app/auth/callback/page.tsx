"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase-queries";
import Link from "next/link";

export default function AuthCallbackPage() {
  const [status, setStatus] = useState<string>("Completing account linking...");

  useEffect(() => {
    const run = async () => {
      try {
        const url = new URL(window.location.href);
        const hasCode = !!url.searchParams.get("code");

        if (hasCode) {
          const { error: exchangeError } =
            await supabase.auth.exchangeCodeForSession(window.location.href);
          if (exchangeError) {
            setStatus(`Error establishing session: ${exchangeError.message}`);
            return;
          }
        } else if (window.location.hash.includes("access_token")) {
          // Handle implicit grant tokens in URL hash
          const hash = new URLSearchParams(window.location.hash.substring(1));
          const access_token = hash.get("access_token") ?? undefined;
          const refresh_token = hash.get("refresh_token") ?? undefined;
          if (access_token && refresh_token) {
            const { error: setErr } = await supabase.auth.setSession({
              access_token,
              refresh_token,
            });
            if (setErr) {
              setStatus(`Error setting session: ${setErr.message}`);
              return;
            }
          } else {
            setStatus(
              "Returned without auth code or tokens. Check redirect URL configuration."
            );
            return;
          }
        } else {
          setStatus(
            "Missing auth code. Ensure redirect URL matches exactly and the flow was initiated from this site."
          );
          return;
        }

        // Now read current user to reflect newly linked identity or session
        const { data, error } = await supabase.auth.getUser();
        if (error) {
          setStatus(`Error: ${error.message}`);
          return;
        }
        const providers = data.user?.identities?.map((i) => i.provider) || [];
        setStatus(
          providers.length > 0
            ? "Account linking/sign-in complete. You can close this page."
            : "Signed in, but no identities found."
        );
      } catch (e) {
        setStatus("Unexpected error completing authentication");

        console.error(e);
      }
    };
    run();
  }, []);

  return (
    <div className="p-6 flex flex-col items-center gap-4">
      <div className="text-lg">{status}</div>
      <Link
        href="/"
        className="px-4 py-2 rounded-md text-sm font-medium bg-blue-500 hover:bg-blue-600 text-white"
      >
        Go home
      </Link>
    </div>
  );
}
