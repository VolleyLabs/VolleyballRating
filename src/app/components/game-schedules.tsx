"use client";

import { useTelegram } from "@/app/context/telegram-context";
import { useCallback, useEffect, useState } from "react";
import {
  DayOfWeek,
  GameLocation,
  GameSchedule,
  GameScheduleState,
  getActiveGameSchedules,
  getGameLocations,
  createGameSchedule,
  updateGameSchedule,
  deleteGameSchedule,
} from "@/app/lib/supabase-queries";

export default function GameSchedules() {
  const { theme, isAdmin } = useTelegram();
  const [schedules, setSchedules] = useState<GameSchedule[]>([]);
  const [locations, setLocations] = useState<GameLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [currentSchedule, setCurrentSchedule] = useState<GameSchedule | null>(
    null
  );
  const [saveMessage, setSaveMessage] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Format time to display without seconds
  const formatTime = (time: string) => {
    return time.substring(0, 5);
  };

  // Get location name from id
  const getLocationName = (locationId: string) => {
    const location = locations.find((loc) => loc.id === locationId);
    return location ? location.name : "Unknown Location";
  };

  // Format day of week to display nicely
  const formatDayOfWeek = (day: string) => {
    return day.charAt(0) + day.slice(1).toLowerCase();
  };

  // Fetch game schedules and locations
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [schedulesData, locationsData] = await Promise.all([
        getActiveGameSchedules(),
        getGameLocations(),
      ]);
      setSchedules(schedulesData);
      setLocations(locationsData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle editing a schedule
  const handleEdit = (schedule: GameSchedule) => {
    setCurrentSchedule(schedule);
    setIsEditing(true);
  };

  // Handle creating a new schedule
  const handleCreate = () => {
    // Create a default new schedule
    const defaultLocation = locations.length > 0 ? locations[0].id : "";
    const newSchedule: Omit<GameSchedule, "id" | "created_at"> = {
      day_of_week: DayOfWeek.MONDAY,
      time: "20:00:00",
      duration_minutes: 120,
      location: defaultLocation,
      voting_in_advance_days: 2,
      voting_time: "22:00:00",
      players_count: 12,
      state: GameScheduleState.ACTIVE,
    };
    setCurrentSchedule(newSchedule as GameSchedule);
    setIsEditing(true);
  };

  // Handle saving a schedule
  const handleSave = async () => {
    if (!currentSchedule) return;

    setIsSaving(true);
    setSaveMessage("");

    try {
      if ("id" in currentSchedule) {
        // Update existing schedule
        await updateGameSchedule(currentSchedule as GameSchedule);
      } else {
        // Create new schedule
        await createGameSchedule(
          currentSchedule as Omit<GameSchedule, "id" | "created_at">
        );
      }

      // Refresh the schedules list
      await fetchData();

      setIsEditing(false);
      setCurrentSchedule(null);
      setSaveMessage("Schedule saved successfully");
      setTimeout(() => setSaveMessage(""), 3000);
    } catch (error) {
      console.error("Error saving schedule:", error);
      setSaveMessage("Error saving schedule");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle deleting a schedule
  const handleDelete = async (scheduleId: string) => {
    if (!confirm("Are you sure you want to delete this schedule?")) return;

    setIsSaving(true);
    try {
      await deleteGameSchedule(scheduleId);
      await fetchData();
      setSaveMessage("Schedule deleted successfully");
      setTimeout(() => setSaveMessage(""), 3000);
    } catch (error) {
      console.error("Error deleting schedule:", error);
      setSaveMessage("Error deleting schedule");
    } finally {
      setIsSaving(false);
    }
  };

  // Handle form field changes
  const handleInputChange = (field: string, value: string | number) => {
    if (!currentSchedule) return;

    setCurrentSchedule({
      ...currentSchedule,
      [field]: value,
    });
  };

  // Render loading state
  if (isLoading) {
    return (
      <div className="p-4 flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Render edit form
  if (isEditing && currentSchedule) {
    return (
      <div className="p-4">
        <h2
          className={`text-xl font-bold ${theme.text} mb-4`}
          style={theme.textStyle}
        >
          {"id" in currentSchedule ? "Edit Schedule" : "Create Schedule"}
        </h2>

        <div className="space-y-4">
          <div>
            <label
              className={`block text-sm font-medium ${theme.text} mb-1`}
              style={theme.textStyle}
            >
              Day of Week
            </label>
            <select
              value={currentSchedule.day_of_week}
              onChange={(e) => handleInputChange("day_of_week", e.target.value)}
              className={`w-full px-3 py-2 border rounded-md ${theme.cardBg} ${theme.text}`}
              style={{ ...theme.cardBgStyle, ...theme.textStyle }}
            >
              {Object.values(DayOfWeek).map((day) => (
                <option key={day} value={day}>
                  {formatDayOfWeek(day)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              className={`block text-sm font-medium ${theme.text} mb-1`}
              style={theme.textStyle}
            >
              Time
            </label>
            <input
              type="time"
              value={formatTime(currentSchedule.time)}
              onChange={(e) =>
                handleInputChange("time", `${e.target.value}:00`)
              }
              className={`w-full px-3 py-2 border rounded-md ${theme.cardBg} ${theme.text}`}
              style={{ ...theme.cardBgStyle, ...theme.textStyle }}
            />
          </div>

          <div>
            <label
              className={`block text-sm font-medium ${theme.text} mb-1`}
              style={theme.textStyle}
            >
              Duration (minutes)
            </label>
            <input
              type="number"
              value={currentSchedule.duration_minutes}
              onChange={(e) =>
                handleInputChange("duration_minutes", parseInt(e.target.value))
              }
              className={`w-full px-3 py-2 border rounded-md ${theme.cardBg} ${theme.text}`}
              style={{ ...theme.cardBgStyle, ...theme.textStyle }}
              min="30"
              max="360"
              step="10"
            />
          </div>

          <div>
            <label
              className={`block text-sm font-medium ${theme.text} mb-1`}
              style={theme.textStyle}
            >
              Location
            </label>
            <select
              value={currentSchedule.location}
              onChange={(e) => handleInputChange("location", e.target.value)}
              className={`w-full px-3 py-2 border rounded-md ${theme.cardBg} ${theme.text}`}
              style={{ ...theme.cardBgStyle, ...theme.textStyle }}
            >
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              className={`block text-sm font-medium ${theme.text} mb-1`}
              style={theme.textStyle}
            >
              Days Before for Voting
            </label>
            <input
              type="number"
              value={currentSchedule.voting_in_advance_days}
              onChange={(e) =>
                handleInputChange(
                  "voting_in_advance_days",
                  parseInt(e.target.value)
                )
              }
              className={`w-full px-3 py-2 border rounded-md ${theme.cardBg} ${theme.text}`}
              style={{ ...theme.cardBgStyle, ...theme.textStyle }}
              min="1"
              max="7"
            />
          </div>

          <div>
            <label
              className={`block text-sm font-medium ${theme.text} mb-1`}
              style={theme.textStyle}
            >
              Voting Time
            </label>
            <input
              type="time"
              value={formatTime(currentSchedule.voting_time)}
              onChange={(e) =>
                handleInputChange("voting_time", `${e.target.value}:00`)
              }
              className={`w-full px-3 py-2 border rounded-md ${theme.cardBg} ${theme.text}`}
              style={{ ...theme.cardBgStyle, ...theme.textStyle }}
            />
          </div>

          <div>
            <label
              className={`block text-sm font-medium ${theme.text} mb-1`}
              style={theme.textStyle}
            >
              Players Count
            </label>
            <input
              type="number"
              value={currentSchedule.players_count}
              onChange={(e) =>
                handleInputChange("players_count", parseInt(e.target.value))
              }
              className={`w-full px-3 py-2 border rounded-md ${theme.cardBg} ${theme.text}`}
              style={{ ...theme.cardBgStyle, ...theme.textStyle }}
              min="4"
              max="30"
            />
          </div>

          <div>
            <label
              className={`block text-sm font-medium ${theme.text} mb-1`}
              style={theme.textStyle}
            >
              Status
            </label>
            <select
              value={currentSchedule.state}
              onChange={(e) => handleInputChange("state", e.target.value)}
              className={`w-full px-3 py-2 border rounded-md ${theme.cardBg} ${theme.text}`}
              style={{ ...theme.cardBgStyle, ...theme.textStyle }}
            >
              <option value={GameScheduleState.ACTIVE}>Active</option>
              <option value={GameScheduleState.INACTIVE}>Inactive</option>
            </select>
          </div>

          <div className="flex space-x-2 pt-4">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={`px-4 py-2 rounded-md ${theme.primaryButton} hover:brightness-95 transition-all disabled:opacity-50`}
              style={theme.primaryButtonStyle}
            >
              {isSaving ? "Saving..." : "Save"}
            </button>

            <button
              onClick={() => {
                setIsEditing(false);
                setCurrentSchedule(null);
              }}
              disabled={isSaving}
              className={`px-4 py-2 rounded-md ${theme.secondaryButton} hover:brightness-95 transition-all disabled:opacity-50`}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Render schedules list
  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2
          className={`text-xl font-bold ${theme.text}`}
          style={theme.textStyle}
        >
          Game Schedules
        </h2>

        {isAdmin && (
          <button
            onClick={handleCreate}
            className={`px-4 py-2 rounded-md ${theme.primaryButton} hover:brightness-95 transition-all`}
            style={theme.primaryButtonStyle}
          >
            Add Schedule
          </button>
        )}
      </div>

      {saveMessage && (
        <div
          className={`mb-4 p-2 rounded ${
            saveMessage.includes("Error")
              ? "bg-red-100 text-red-800"
              : "bg-green-100 text-green-800"
          }`}
        >
          {saveMessage}
        </div>
      )}

      {schedules.length === 0 ? (
        <div
          className={`p-4 text-center ${theme.secondaryText}`}
          style={theme.secondaryTextStyle}
        >
          No game schedules found.
        </div>
      ) : (
        <div className="space-y-4">
          {schedules.map((schedule) => (
            <div
              key={schedule.id}
              className={`p-4 rounded-lg ${theme.cardBg} border ${theme.border}`}
              style={{ ...theme.cardBgStyle, ...theme.borderStyle }}
            >
              <div className="flex justify-between">
                <div
                  className={`${theme.text} font-semibold`}
                  style={theme.textStyle}
                >
                  {formatDayOfWeek(schedule.day_of_week)}
                </div>
                {isAdmin && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(schedule)}
                      className="text-blue-500 hover:text-blue-700"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(schedule.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 mt-3">
                <div>
                  <div
                    className={`text-xs ${theme.secondaryText}`}
                    style={theme.secondaryTextStyle}
                  >
                    Time
                  </div>
                  <div className={`${theme.text}`} style={theme.textStyle}>
                    {formatTime(schedule.time)}
                  </div>
                </div>

                <div>
                  <div
                    className={`text-xs ${theme.secondaryText}`}
                    style={theme.secondaryTextStyle}
                  >
                    Duration
                  </div>
                  <div className={`${theme.text}`} style={theme.textStyle}>
                    {schedule.duration_minutes} min
                  </div>
                </div>

                <div>
                  <div
                    className={`text-xs ${theme.secondaryText}`}
                    style={theme.secondaryTextStyle}
                  >
                    Location
                  </div>
                  <div className={`${theme.text}`} style={theme.textStyle}>
                    {getLocationName(schedule.location)}
                  </div>
                </div>

                <div>
                  <div
                    className={`text-xs ${theme.secondaryText}`}
                    style={theme.secondaryTextStyle}
                  >
                    Players
                  </div>
                  <div className={`${theme.text}`} style={theme.textStyle}>
                    {schedule.players_count}
                  </div>
                </div>

                <div>
                  <div
                    className={`text-xs ${theme.secondaryText}`}
                    style={theme.secondaryTextStyle}
                  >
                    Voting Time
                  </div>
                  <div className={`${theme.text}`} style={theme.textStyle}>
                    {formatTime(schedule.voting_time)}
                  </div>
                </div>

                <div>
                  <div
                    className={`text-xs ${theme.secondaryText}`}
                    style={theme.secondaryTextStyle}
                  >
                    Voting Days Before
                  </div>
                  <div className={`${theme.text}`} style={theme.textStyle}>
                    {schedule.voting_in_advance_days}
                  </div>
                </div>
              </div>

              <div className="mt-2">
                <span
                  className={`inline-block px-2 py-1 text-xs rounded-full ${
                    schedule.state === GameScheduleState.ACTIVE
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {schedule.state === GameScheduleState.ACTIVE
                    ? "Active"
                    : "Inactive"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
