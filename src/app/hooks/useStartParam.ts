"use client";
import { useEffect, useState } from "react";

// Reads Telegram WebApp initDataUnsafe.start_param when available,
// with URL fallbacks for local testing: ?startapp=... | ?start_param=... | ?debug=1
export const useStartParam = () => {
  const [param, set] = useState<string | null>(null);

  useEffect(() => {
    try {
      const tgParam = window?.Telegram?.WebApp?.initDataUnsafe?.start_param;
      if (tgParam) {
        set(String(tgParam));
        return;
      }

      const sp = new URLSearchParams(window.location.search);
      const urlParam = sp.get("startapp") || sp.get("start_param");
      if (urlParam) {
        set(urlParam);
        return;
      }

      if (sp.get("debug") === "1") {
        set("debug");
      }
    } catch {
      // ignore SSR or access errors
    }
  }, []);

  return param;
};
