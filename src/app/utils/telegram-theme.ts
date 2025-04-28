import React from "react";

export interface TelegramTheme {
  // Backgrounds
  bg: string;
  cardBg: string;
  headerBg: string;
  tableHeaderBg: string;

  // Texts
  text: string;
  secondaryText: string;
  tableHeaderText: string;

  // Borders
  border: string;
  tableBorder: string;

  // Buttons
  primaryButton: string;
  primaryButtonHover: string;
  secondaryButton: string;
  secondaryButtonHover: string;

  // Selection
  selectedBg: string;
  selectedBorder: string;

  // Hovers
  tableRowHover: string;

  // Inline styles for dynamic colors
  bgStyle: React.CSSProperties;
  cardBgStyle: React.CSSProperties;
  headerBgStyle: React.CSSProperties;
  tableHeaderBgStyle: React.CSSProperties;
  textStyle: React.CSSProperties;
  secondaryTextStyle: React.CSSProperties;
  tableHeaderTextStyle: React.CSSProperties;
  borderStyle: React.CSSProperties;
  tableBorderStyle: React.CSSProperties;
  primaryButtonStyle: React.CSSProperties;
  selectedBgStyle: React.CSSProperties;
  selectedBorderStyle: React.CSSProperties;
}

// Default theme parameters for when themeParams is null
// For non-Telegram scenarios, use the original Tailwind colors
const defaultThemeParams: ThemeParams = {
  bg_color: "#111827", // gray-900
  secondary_bg_color: "#1f2937", // gray-800
  header_bg_color: "#111827", // gray-900
  text_color: "#ffffff", // white
  hint_color: "#d1d5db", // gray-300
  subtitle_text_color: "#d1d5db", // gray-300
  button_color: "#2563eb", // blue-600
  button_text_color: "#ffffff", // white
  link_color: "#3b82f6", // blue-500
  accent_text_color: "#3b82f6", // blue-500
  destructive_text_color: "#ef4444", // red-500
  section_bg_color: "#111827", // gray-900
  section_header_text_color: "#d1d5db", // gray-300
  bottom_bar_bg_color: "#1f2937", // gray-800
};

// Telegram dark theme parameters for reference
// This is kept for documentation purposes and potential future use
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const telegramDarkTheme: ThemeParams = {
  accent_text_color: "#6ab2f2",
  bg_color: "#17212b",
  button_color: "#5288c1",
  button_text_color: "#ffffff",
  bottom_bar_bg_color: "#ffffff",
  destructive_text_color: "#ec3942",
  header_bg_color: "#17212b",
  hint_color: "#708499",
  link_color: "#6ab3f3",
  secondary_bg_color: "#232e3c",
  section_bg_color: "#17212b",
  section_header_text_color: "#6ab3f3",
  subtitle_text_color: "#708499",
  text_color: "#f5f5f5",
};

/**
 * Converts Telegram theme parameters to Tailwind CSS classes and inline styles
 */
export function useTelegramTheme(
  themeParams: ThemeParams | null
): TelegramTheme {
  // Use default theme params if none provided
  const params = themeParams || defaultThemeParams;

  // Determine if the theme is dark based on text color
  const isDark = isColorDark(params.bg_color || "");

  // Get the actual colors
  const bgColor = params.bg_color || "#111827";
  const secondaryBgColor = params.secondary_bg_color || "#1f2937";
  const headerBgColor = params.header_bg_color || "#111827";
  const textColor = params.text_color || "#ffffff";
  const hintColor = params.hint_color || "#d1d5db";
  const subtitleTextColor = params.subtitle_text_color || "#d1d5db";
  const buttonColor = params.button_color || "#2563eb";

  return {
    // Backgrounds - keep Tailwind classes for fallback
    bg: "bg-gray-900",
    cardBg: "bg-gray-800",
    headerBg: "bg-gray-900",
    tableHeaderBg: "bg-gray-900",

    // Texts - keep Tailwind classes for fallback
    text: "text-white",
    secondaryText: "text-gray-300",
    tableHeaderText: "text-gray-300",

    // Borders - keep Tailwind classes for fallback
    border: "border-gray-700",
    tableBorder: "border-gray-700",

    // Buttons - keep Tailwind classes for fallback
    primaryButton: "bg-blue-600",
    primaryButtonHover: "hover:bg-opacity-90",
    secondaryButton: isDark ? "bg-gray-700" : "bg-gray-600",
    secondaryButtonHover: isDark ? "hover:bg-gray-800" : "hover:bg-gray-700",

    // Selection - keep Tailwind classes for fallback
    selectedBg: "bg-blue-900 bg-opacity-20",
    selectedBorder: "border-blue-600",

    // Hovers - keep Tailwind classes for fallback
    tableRowHover: isDark ? "hover:bg-gray-700" : "hover:bg-gray-50",

    // Inline styles for dynamic colors
    bgStyle: { backgroundColor: bgColor },
    cardBgStyle: { backgroundColor: secondaryBgColor },
    headerBgStyle: { backgroundColor: headerBgColor },
    tableHeaderBgStyle: { backgroundColor: headerBgColor },
    textStyle: { color: textColor },
    secondaryTextStyle: { color: hintColor },
    tableHeaderTextStyle: { color: subtitleTextColor },
    borderStyle: { borderColor: secondaryBgColor },
    tableBorderStyle: { borderColor: secondaryBgColor },
    primaryButtonStyle: { backgroundColor: buttonColor },
    selectedBgStyle: { backgroundColor: `${buttonColor}33` }, // 33 is 20% opacity in hex
    selectedBorderStyle: { borderColor: buttonColor },
  };
}

/**
 * Determines if a color is dark based on its luminance
 */
function isColorDark(color: string): boolean {
  // Remove the hash if it exists
  const hex = color.replace("#", "");

  // Parse the hex values
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Calculate luminance (perceived brightness)
  // Formula: 0.299*R + 0.587*G + 0.114*B
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  // Return true if the color is dark (luminance < 0.5)
  return luminance < 0.5;
}
