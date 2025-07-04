// date => HH:mm
export const getTimeString = (now: Date) => {
  const nowHours = now.getHours().toString().padStart(2, "0");
  const nowMinutes = now.getMinutes().toString().padStart(2, "0");
  return `${nowHours}:${nowMinutes}`;
};

// Format date for display in day selector
export const formatDateForDisplay = (dateString: string): string => {
  const date = parseLocalDateString(dateString);

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  // Reset time to compare dates only
  const dateOnly = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );
  const todayOnly = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );
  const yesterdayOnly = new Date(
    yesterday.getFullYear(),
    yesterday.getMonth(),
    yesterday.getDate()
  );

  if (dateOnly.getTime() === todayOnly.getTime()) {
    return "Today";
  } else if (dateOnly.getTime() === yesterdayOnly.getTime()) {
    return "Yesterday";
  } else {
    // Format as "Mon 15" or "Dec 15" depending on if it's current month
    const currentMonth = today.getMonth();
    const dateMonth = date.getMonth();

    if (currentMonth === dateMonth) {
      // Same month, show day name + date
      const dayName = date.toLocaleDateString("en-US", { weekday: "short" });
      const dayNumber = date.getDate();
      return `${dayName} ${dayNumber}`;
    } else {
      // Different month, show month + date
      const monthName = date.toLocaleDateString("en-US", { month: "short" });
      const dayNumber = date.getDate();
      return `${monthName} ${dayNumber}`;
    }
  }
};

// Get short day name for compact display
export const getShortDayName = (dateString: string): string => {
  const date = parseLocalDateString(dateString);
  return date.toLocaleDateString("en-US", { weekday: "short" });
};

// Helper function to parse local date string (YYYY-MM-DD) to Date object
const parseLocalDateString = (dateString: string): Date => {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day); // month is 0-indexed
};

// Get local date string in YYYY-MM-DD format
export const getLocalDateString = (date: Date = new Date()): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Get today's date in local time
export const getTodayLocal = (): string => {
  return getLocalDateString();
};

// Check if date is today (using local time)
export const isToday = (dateString: string): boolean => {
  const today = getTodayLocal();
  return dateString === today;
};
