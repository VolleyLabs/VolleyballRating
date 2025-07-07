"use client";

import { useEffect, useState } from "react";
import { useTelegram } from "@context/telegram-context";
import { getAvailableDates } from "@lib/supabase-queries";
import { formatDateForDisplay } from "@utils/date";

interface DaySelectorProps {
  selectedDate: string;
  onDateChange: (date: string) => void;
}

export default function DaySelector({
  selectedDate,
  onDateChange,
}: DaySelectorProps) {
  const { theme } = useTelegram();
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAvailableDates = async () => {
      try {
        const dates = await getAvailableDates();
        console.log("Loaded available dates:", dates);

        // Additional safety check to ensure uniqueness
        const uniqueDates = Array.from(new Set(dates));
        if (uniqueDates.length !== dates.length) {
          console.warn(
            "Duplicate dates detected and removed:",
            dates.length - uniqueDates.length
          );
        }

        setAvailableDates(uniqueDates);
      } catch (error) {
        console.error("Error loading available dates:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAvailableDates();
  }, []);

  if (isLoading) {
    return (
      <div className="flex space-x-3 overflow-x-auto py-2 px-1">
        {[...Array(3)].map((_, i) => (
          <div
            key={i}
            className="flex-shrink-0 w-20 h-12 bg-gray-300 dark:bg-gray-700 rounded-lg animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex space-x-3 overflow-x-auto py-2 px-1 scrollbar-hide">
      {availableDates.map((date) => {
        const isSelected = date === selectedDate;

        return (
          <button
            key={date}
            onClick={() => onDateChange(date)}
            className={`
              flex-shrink-0 flex items-center justify-center
              w-20 h-12 rounded-lg transition-all duration-200
              ${
                isSelected
                  ? `${theme.primaryButton} text-white shadow-lg scale-105`
                  : `${theme.cardBg} ${theme.text} hover:scale-105 hover:shadow-md`
              }
            `}
            style={isSelected ? theme.primaryButtonStyle : theme.cardBgStyle}
          >
            <div
              className={`text-xs font-medium ${
                isSelected ? "text-white" : theme.secondaryText
              }`}
              style={isSelected ? {} : theme.secondaryTextStyle}
            >
              {formatDateForDisplay(date)}
            </div>
          </button>
        );
      })}
    </div>
  );
}
