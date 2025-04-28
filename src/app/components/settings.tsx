"use client";

import { useTelegram } from "@context/telegram-context";
import { useState, useEffect, useCallback } from "react";
import { getUser, upsertUser } from "@/app/lib/supabase-queries";

export default function Settings() {
  const { theme, webApp } = useTelegram();
  const [pickupHeight, setPickupHeight] = useState<number | undefined>(
    undefined
  );
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
        setPickupHeight(user.pickup_height);
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
        pickupHeight
      );

      console.log("Updated with pickup_height:", pickupHeight);

      // Fetch the updated user data to verify changes
      await fetchUserData();

      setSaveMessage("Spike height saved");
      setTimeout(() => setSaveMessage(""), 3000);
    } catch (error) {
      console.error("Error saving pickup height:", error);
      setSaveMessage("Error saving");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-4">
      <h2
        className={`text-xl font-bold ${theme.text} mb-4`}
        style={theme.textStyle}
      >
        User Settings
      </h2>

      <div className="mb-4">
        <label
          htmlFor="pickupHeight"
          className={`block text-sm font-medium ${theme.text} mb-1`}
          style={theme.textStyle}
        >
          Spike Height (cm)
        </label>
        <input
          type="number"
          id="pickupHeight"
          value={pickupHeight || ""}
          onChange={(e) =>
            setPickupHeight(e.target.value ? Number(e.target.value) : undefined)
          }
          className={`w-full px-3 py-2 border rounded-md ${theme.cardBg} ${theme.text}`}
          style={{ ...theme.cardBgStyle, ...theme.textStyle }}
          placeholder="Enter your spike height"
          min="0"
          max="400"
        />
        <p
          className={`mt-1 text-xs ${theme.secondaryText}`}
          style={theme.secondaryTextStyle}
        >
          Enter your maximum spike height in centimeters
        </p>
      </div>

      <button
        onClick={handleSave}
        disabled={isSaving}
        className={`px-4 py-2 rounded-md ${theme.primaryButton} hover:brightness-95 hover:shadow-md transition-all disabled:opacity-50 disabled:hover:brightness-100 disabled:hover:shadow-none`}
        style={theme.primaryButtonStyle}
      >
        {isSaving ? "Saving..." : "Save"}
      </button>

      {saveMessage && (
        <p className={`mt-2 text-sm ${theme.text}`} style={theme.textStyle}>
          {saveMessage}
        </p>
      )}
    </div>
  );
}
