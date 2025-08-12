"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/app/lib/supabase-queries";
import Link from "next/link";

export default function AuthCallbackPage() {
  const [status, setStatus] = useState<string>("Completing account linking...");

  useEffect(() => {
    const run = async () => {
      // Complete the OAuth flow (both for sign-in and linkIdentity)
      const { error: exchangeError } =
        await supabase.auth.exchangeCodeForSession(window.location.href);
      if (exchangeError) {
        setStatus(`Error establishing session: ${exchangeError.message}`);
        return;
      }
      // Now read current user to reflect newly linked identity
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        setStatus(`Error: ${error.message}`);
        return;
      }
      const providers = data.user?.identities?.map((i) => i.provider) || [];
      setStatus(
        providers.length > 0
          ? "Account linking complete. You can close this page."
          : "No identities found. You can navigate back and try again."
      );
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
