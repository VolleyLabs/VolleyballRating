"use client";

import { useTelegram } from "@context/telegram-context";
import { useState, useEffect, useCallback } from "react";
import { getUser, upsertUser } from "@/app/lib/supabase-queries";

export default function Settings() {
  const { theme, webApp } = useTelegram();
  const [pickupHeight, setPickupHeight] = useState<number | undefined>(
    undefined
  );
  const [shareStats, setShareStats] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [userId, setUserId] = useState<number | undefined>(undefined);

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

  const handleSave = async () => {
    if (!userId) return;

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
