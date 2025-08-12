"use client";

import { useTelegram } from "@context/telegram-context";
import { useState, useEffect, useCallback } from "react";
import { getUser, upsertUser } from "@/app/lib/supabase-queries";
import { supabase } from "@/app/lib/supabase-queries";

export default function Settings() {
  const { theme, webApp } = useTelegram();
  const [pickupHeight, setPickupHeight] = useState<number | undefined>(
    undefined
  );
  const [shareStats, setShareStats] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [userId, setUserId] = useState<number | undefined>(undefined);

  // Linked accounts state
  const [primaryEmail, setPrimaryEmail] = useState<string | null>(null);
  const [linkedProviders, setLinkedProviders] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState<string>("");
  const [linkingProvider, setLinkingProvider] = useState<
    "google" | "apple" | null
  >(null);
  const [authMessage, setAuthMessage] = useState<string>("");

  // Safely get the user ID only on the client
  useEffect(() => {
    // Only try to access webApp properties on the client side
    if (webApp && webApp.initDataUnsafe && webApp.initDataUnsafe.user) {
      setUserId(webApp.initDataUnsafe.user.id);
    }
  }, [webApp]);

  const fetchUserData = useCallback(async () => {
    if (!userId) return;

    try {
      const user = await getUser(userId);
      console.log("Fetched user data:", user);

      if (user && user.pickup_height !== undefined) {
        setPickupHeight(user.pickup_height ?? undefined);
      }

      if (user && user.share_stats !== undefined) {
        setShareStats(user.share_stats);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  }, [userId]);

  useEffect(() => {
    // Fetch the user's current pickup height when component mounts
    if (userId) {
      fetchUserData();
    }
  }, [userId, fetchUserData]);

  // Fetch auth profile (email + linked identities)
  useEffect(() => {
    const loadAuthProfile = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        console.error("Error loading auth user:", error);
        return;
      }
      const user = data.user;
      setPrimaryEmail(user?.email ?? null);
      const providers = (user?.identities ?? [])
        .map((i) => i.provider)
        .filter(Boolean) as string[];
      setLinkedProviders(providers);
    };
    loadAuthProfile();
  }, []);

  const handleLinkProvider = async (provider: "google" | "apple") => {
    setAuthMessage("");
    setLinkingProvider(provider);
    try {
      const { data, error } = await supabase.auth.linkIdentity({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) {
        console.error("Link identity error:", error.message);
        setAuthMessage(`Error linking ${provider}: ${error.message}`);
        return;
      }
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (e) {
      console.error(e);
      setAuthMessage("Unexpected error starting link flow");
    } finally {
      setLinkingProvider(null);
    }
  };

  const handleChangeEmail = async () => {
    setAuthMessage("");
    if (!newEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      setAuthMessage("Please enter a valid email address");
      return;
    }
    try {
      const { data, error } = await supabase.auth.updateUser({
        email: newEmail,
      });
      if (error) {
        setAuthMessage(`Error updating email: ${error.message}`);
        return;
      }
      setPrimaryEmail(data.user.email ?? newEmail);
      setAuthMessage(
        "Email update requested. Check your inbox to confirm the change."
      );
      setNewEmail("");
    } catch (e) {
      console.error(e);
      setAuthMessage("Unexpected error updating email");
    }
  };

  const handleSave = async () => {
    if (!userId) return;

    const { data: sess } = await supabase.auth.getSession();
    console.log("Settings: current session user id", sess.session?.user?.id);

    setIsSaving(true);
    setSaveMessage("");

    try {
      const user = await getUser(userId);
      console.log("Current user before update:", user);

      await upsertUser(
        user.id,
        user.first_name,
        user.last_name || undefined,
        user.username || undefined,
        user.photo_url || undefined,
        pickupHeight,
        undefined,
        undefined,
        undefined,
        undefined,
        shareStats
      );

      console.log("Updated with pickup_height:", pickupHeight);

      // Fetch the updated user data to verify changes
      await fetchUserData();

      setSaveMessage("Settings saved successfully");
      setTimeout(() => setSaveMessage(""), 3000);
    } catch (error) {
      console.error("Error saving pickup height:", error);
      setSaveMessage("Error saving");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-4 space-y-6">
      <h2 className={`text-xl font-bold ${theme.text} mb-4`}>Settings</h2>

      {/* Linked Accounts Section */}
      <div className="space-y-3">
        <label className={`block text-sm font-medium ${theme.text}`}>
          Linked accounts
        </label>
        <div className="flex flex-col gap-2">
          <div className={`text-sm ${theme.secondaryText || "text-gray-500"}`}>
            Current email: {primaryEmail ?? "none"}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleLinkProvider("google")}
              disabled={
                linkingProvider !== null || linkedProviders.includes("google")
              }
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors border ${
                linkedProviders.includes("google")
                  ? "bg-green-50 border-green-200 text-green-700 cursor-default"
                  : linkingProvider === "google"
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-white hover:bg-gray-50 text-gray-900 border-gray-300"
              }`}
            >
              {linkedProviders.includes("google")
                ? "Google linked"
                : "Link Google"}
            </button>
            <button
              onClick={() => handleLinkProvider("apple")}
              disabled={
                linkingProvider !== null || linkedProviders.includes("apple")
              }
              className={`px-3 py-2 rounded-md text-sm font-medium transition-colors border ${
                linkedProviders.includes("apple")
                  ? "bg-green-50 border-green-200 text-green-700 cursor-default"
                  : linkingProvider === "apple"
                  ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                  : "bg-white hover:bg-gray-50 text-gray-900 border-gray-300"
              }`}
            >
              {linkedProviders.includes("apple")
                ? "Apple linked"
                : "Link Apple"}
            </button>
          </div>
          {authMessage && (
            <p
              className={`text-sm ${
                authMessage.startsWith("Error")
                  ? "text-red-500"
                  : "text-green-600"
              }`}
            >
              {authMessage}
            </p>
          )}
          <div className="pt-2 space-y-2">
            <div
              className={`text-xs ${theme.secondaryText || "text-gray-500"}`}
            >
              You can link Google or Apple to sign in next time without
              Telegram.
            </div>
          </div>
        </div>
      </div>

      {/* Change Email Section */}
      <div className="space-y-3">
        <label className={`block text-sm font-medium ${theme.text}`}>
          Attach real email
        </label>
        <div className="flex items-center gap-2">
          <input
            type="email"
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="Enter your email"
            className={`flex-1 px-3 py-2 border rounded-md text-sm ${
              theme.cardBg || "border-gray-300 bg-white"
            } ${theme.text || "text-black"}`}
          />
          <button
            onClick={handleChangeEmail}
            className="px-4 py-2 rounded-md text-sm font-medium bg-blue-500 hover:bg-blue-600 text-white transition-colors"
          >
            Save email
          </button>
        </div>
        <p className={`text-xs ${theme.secondaryText || "text-gray-500"}`}>
          Changing email may require email confirmation. After confirming, you
          can sign in with this email in addition to Telegram.
        </p>
      </div>

      {/* Pickup Height Section */}
      <div className="space-y-3">
        <label className={`block text-sm font-medium ${theme.text}`}>
          Pickup Height (cm)
        </label>
        <div className="flex items-center space-x-2">
          <input
            type="number"
            value={pickupHeight ?? ""}
            onChange={(e) => {
              const value = e.target.value;
              setPickupHeight(value ? parseInt(value, 10) : undefined);
            }}
            placeholder="Enter height in cm"
            className={`flex-1 px-3 py-2 border rounded-md text-sm ${
              theme.cardBg || "border-gray-300 bg-white"
            } ${theme.text || "text-black"}`}
            min="140"
            max="220"
          />
        </div>
        <p className={`text-xs ${theme.secondaryText || "text-gray-500"}`}>
          Your height for calculating pickup game compatibility
        </p>
        {saveMessage && (
          <p
            className={`text-sm ${
              saveMessage.includes("Error") ? "text-red-500" : "text-green-500"
            }`}
          >
            {saveMessage}
          </p>
        )}
      </div>

      {/* Share Statistics Section */}
      <div className="space-y-3">
        <label className={`block text-sm font-medium ${theme.text}`}>
          Share my statistics publicly
        </label>
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={shareStats}
            onChange={(e) => setShareStats(e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <span className={`text-sm ${theme.secondaryText || "text-gray-500"}`}>
            Allow my statistics to be visible to others
          </span>
        </div>
      </div>

      {/* Save Button */}
      <div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            isSaving
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-blue-500 hover:bg-blue-600 text-white"
          }`}
        >
          {isSaving ? "Saving..." : "Save"}
        </button>
      </div>
    </div>
  );
}
