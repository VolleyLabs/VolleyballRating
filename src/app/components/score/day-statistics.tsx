import { Crosshair, Swords, Shield, AlertTriangle } from "lucide-react";
import { DailyScoreData } from "@lib/supabase-queries";
import { TelegramTheme } from "@utils/telegram-theme";

interface DayStatisticsProps {
  scoreData: DailyScoreData;
  theme: TelegramTheme;
}

export default function DayStatistics({
  scoreData,
  theme,
}: DayStatisticsProps) {
  // Calculate day statistics from points
  const calculateDayStatistics = () => {
    if (!scoreData.points || scoreData.points.length === 0) {
      return {
        totalPoints: 0,
        aces: 0,
        attacks: 0,
        blocks: 0,
        errors: 0,
        unspecified: 0,
        acePercentage: 0,
        attackPercentage: 0,
        blockPercentage: 0,
        errorPercentage: 0,
      };
    }

    const points = scoreData.points;
    const totalPoints = points.length;
    const aces = points.filter((p) => p.type === "ace").length;
    const attacks = points.filter((p) => p.type === "attack").length;
    const blocks = points.filter((p) => p.type === "block").length;
    const errors = points.filter((p) => p.type === "error").length;
    const unspecified = points.filter((p) => p.type === "unspecified").length;

    return {
      totalPoints,
      aces,
      attacks,
      blocks,
      errors,
      unspecified,
      acePercentage: totalPoints > 0 ? (aces / totalPoints) * 100 : 0,
      attackPercentage: totalPoints > 0 ? (attacks / totalPoints) * 100 : 0,
      blockPercentage: totalPoints > 0 ? (blocks / totalPoints) * 100 : 0,
      errorPercentage: totalPoints > 0 ? (errors / totalPoints) * 100 : 0,
    };
  };

  const dayStats = calculateDayStatistics();

  // Don't render if no points
  if (dayStats.totalPoints === 0) {
    return null;
  }

  return (
    <div className="border-t pt-4" style={theme.borderStyle}>
      <h3
        className={`text-sm font-semibold ${theme.text} mb-3 text-center`}
        style={theme.textStyle}
      >
        Day Statistics
      </h3>

      {/* Total Points */}
      <div className="flex justify-center mb-3">
        <div className="flex flex-col items-center">
          <div
            className={`text-2xl font-bold ${theme.text}`}
            style={theme.textStyle}
          >
            {dayStats.totalPoints}
          </div>
          <div
            className={`text-xs ${theme.secondaryText} font-medium`}
            style={theme.secondaryTextStyle}
          >
            TOTAL POINTS
          </div>
        </div>
      </div>

      {/* Point Type Statistics */}
      <div className="grid grid-cols-2 gap-3">
        {/* Aces */}
        {dayStats.aces > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Crosshair size={16} className="text-green-600" />
              <span className={`text-sm ${theme.text}`} style={theme.textStyle}>
                Aces
              </span>
            </div>
            <div className="text-right">
              <div
                className={`text-sm font-semibold ${theme.text}`}
                style={theme.textStyle}
              >
                {dayStats.aces}
              </div>
              <div
                className={`text-xs ${theme.secondaryText}`}
                style={theme.secondaryTextStyle}
              >
                {dayStats.acePercentage.toFixed(1)}%
              </div>
            </div>
          </div>
        )}

        {/* Attacks */}
        {dayStats.attacks > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Swords size={16} className="text-red-600" />
              <span className={`text-sm ${theme.text}`} style={theme.textStyle}>
                Attacks
              </span>
            </div>
            <div className="text-right">
              <div
                className={`text-sm font-semibold ${theme.text}`}
                style={theme.textStyle}
              >
                {dayStats.attacks}
              </div>
              <div
                className={`text-xs ${theme.secondaryText}`}
                style={theme.secondaryTextStyle}
              >
                {dayStats.attackPercentage.toFixed(1)}%
              </div>
            </div>
          </div>
        )}

        {/* Blocks */}
        {dayStats.blocks > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Shield size={16} className="text-blue-600" />
              <span className={`text-sm ${theme.text}`} style={theme.textStyle}>
                Blocks
              </span>
            </div>
            <div className="text-right">
              <div
                className={`text-sm font-semibold ${theme.text}`}
                style={theme.textStyle}
              >
                {dayStats.blocks}
              </div>
              <div
                className={`text-xs ${theme.secondaryText}`}
                style={theme.secondaryTextStyle}
              >
                {dayStats.blockPercentage.toFixed(1)}%
              </div>
            </div>
          </div>
        )}

        {/* Errors */}
        {dayStats.errors > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertTriangle size={16} className="text-yellow-400" />
              <span className={`text-sm ${theme.text}`} style={theme.textStyle}>
                Errors
              </span>
            </div>
            <div className="text-right">
              <div
                className={`text-sm font-semibold ${theme.text}`}
                style={theme.textStyle}
              >
                {dayStats.errors}
              </div>
              <div
                className={`text-xs ${theme.secondaryText}`}
                style={theme.secondaryTextStyle}
              >
                {dayStats.errorPercentage.toFixed(1)}%
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
