"use client";

import { useCallback, useEffect, useState } from "react";
import { getRandomVotePair, submitVote, VotePair } from "@lib/supabase-queries";
import { User } from "../../../../database.types";
import Image from "next/image";
import { PostgrestError } from "@supabase/supabase-js";
import { useTelegram } from "@context/telegram-context";
import { TelegramTheme } from "@utils/telegram-theme";

// Player card skeleton component
function PlayerCardSkeleton({ theme }: { theme: TelegramTheme }) {
  return (
    <div
      className={`flex flex-col items-center px-4 pt-4 pb-3 border rounded-lg shadow-sm ${theme.border} animate-fadeIn cursor-not-allowed`}
      style={theme.borderStyle}
    >
      <div className="relative mb-2 overflow-hidden rounded-full">
        <div className="w-[120px] h-[120px] rounded-full bg-gray-300 dark:bg-gray-700"></div>
      </div>
      <div className="h-4 w-24 bg-gray-300 dark:bg-gray-700 rounded mt-2 mb-1"></div>
      <div className="h-3 w-20 bg-gray-300 dark:bg-gray-700 rounded mb-2"></div>
    </div>
  );
}

// Define keyframes for the green flash effect
const greenFlashKeyframes = `
@keyframes greenFlash {
  0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
  50% { box-shadow: 0 0 0 8px rgba(34, 197, 94, 0.4); }
  100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
}
`;

// Add the keyframes to the document
if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.innerHTML = greenFlashKeyframes;
  document.head.appendChild(style);
}

export default function Vote() {
  const [pairs, setPairs] = useState<VotePair[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<PostgrestError | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<number | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const { theme, webApp, isAnonymous } = useTelegram();
  const voterId =
    webApp?.initDataUnsafe?.user?.id ??
    Number(process.env.NEXT_PUBLIC_TELEGRAM_TEST_ID);

  // States for the "Me" button
  const [showMeButton, setShowMeButton] = useState(false);
  const [showNope, setShowNope] = useState(false);

  // Determine if the "Me" button should be shown with a 1% chance
  useEffect(() => {
    const randomChance = Math.random() * 100;
    setShowMeButton(randomChance <= 1);
    setShowNope(false);
  }, [pairs]);

  const loadNewPairs = useCallback(
    async function loadNewPairs(showLoading = true) {
      if (!voterId) {
        return;
      }

      try {
        setError(null);
        if (showLoading) {
          setIsLoading(true);
        }
        const data = await getRandomVotePair(voterId);
        setPairs(data);
      } catch (error) {
        console.error("Error prefetching next pair:", error);
        setError(error as PostgrestError);
      } finally {
        setIsLoading(false);
      }
    },
    [voterId]
  );

  // Initial fetch
  useEffect(() => {
    loadNewPairs();
  }, [loadNewPairs]);

  if (isAnonymous) {
    return null;
  }

  async function handleVote(winnerId: number | null) {
    if (!voterId || !pairs[0] || isVoting) return;

    // Immediately update UI for better responsiveness
    setSelectedPlayer(winnerId);

    setIsVoting(true);

    // Optimistically update UI
    const currentPair = pairs[0];

    try {
      // Submit vote
      const success = await submitVote(
        voterId,
        currentPair.playerA.id,
        currentPair.playerB.id,
        winnerId
      );
      if (!success) {
        console.error("Failed to submit vote");
      }

      // Update state only after voting is complete
      setPairs((prevPairs) => prevPairs.slice(1));
      setSelectedPlayer(null);

      // Load new pairs if current list is empty
      if (pairs.length <= 1) {
        await loadNewPairs(false);
      }
    } catch (error) {
      console.error("Error submitting vote:", error);
    } finally {
      setIsVoting(false);
    }
  }

  // Common container classes to avoid layout shifts
  const containerClasses = `w-full max-w-md mx-auto p-3 sm:p-4 ${theme.cardBg} rounded-lg shadow-sm overflow-hidden`;

  if (error)
    return (
      <p
        className={`text-center text-base p-3 sm:p-4 ${theme.text}`}
        style={theme.textStyle}
      >
        Error loading pairs: {error.message}
      </p>
    );

  if (pairs.length == 0 && !isLoading)
    return (
      <div
        className={`w-full max-w-md mx-auto p-4 sm:p-6 ${theme.cardBg} rounded-lg shadow-sm text-center overflow-hidden`}
        style={theme.cardBgStyle}
      >
        <p className={`text-lg mb-2 ${theme.text}`} style={theme.textStyle}>
          You already voted for all players
        </p>
        <p
          className={`text-sm ${theme.secondaryText}`}
          style={theme.secondaryTextStyle}
        >
          Thank you for participating!
        </p>
      </div>
    );

  // Tailwind animation classes for Telegram Mini App
  const animationClasses = "animate-fadeInFast";

  // Handler for the "Me" button click
  const handleMeButtonClick = () => {
    setShowNope(true);
    setTimeout(() => {
      setShowMeButton(false);
      setShowNope(false);
    }, 500);
  };

  return (
    <div
      key={
        isLoading
          ? "loading"
          : pairs[0]
          ? `${pairs[0].playerA.id}-${pairs[0].playerB.id}`
          : "empty"
      }
      className={`${containerClasses} ${animationClasses}`}
      style={theme.cardBgStyle}
    >
      {isLoading ? (
        <>
          <div className="h-6 w-40 bg-gray-300 dark:bg-gray-700 rounded mx-auto mb-5"></div>

          <div className="grid grid-cols-2 gap-3 w-full">
            <PlayerCardSkeleton theme={theme} />
            <PlayerCardSkeleton theme={theme} />
          </div>

          <div className="w-full h-10 bg-gray-300 dark:bg-gray-700 rounded-md mt-4"></div>
        </>
      ) : (
        <>
          <h2
            className={`text-lg font-medium text-center mb-4 ${theme.text} animate-scaleIn`}
            style={{ ...theme.textStyle, transform: "scale(1)" }}
          >
            Who plays better?
          </h2>

          <div className="grid grid-cols-2 gap-3 w-full">
            <PlayerCard
              player={pairs[0].playerA}
              onVote={() => handleVote(pairs[0].playerA.id)}
              isSelected={selectedPlayer === pairs[0].playerA.id}
              isDisabled={isVoting}
              theme={theme}
            />
            <PlayerCard
              player={pairs[0].playerB}
              onVote={() => handleVote(pairs[0].playerB.id)}
              isSelected={selectedPlayer === pairs[0].playerB.id}
              isDisabled={isVoting}
              theme={theme}
            />
          </div>

          <div className="flex flex-col gap-2 mt-4">
            {showMeButton && (
              <div className="relative w-full">
                <button
                  onClick={handleMeButtonClick}
                  className={`w-full py-2 ${
                    theme.primaryButton
                  } bg-purple-600 hover:bg-purple-700 text-white rounded-md shadow-sm transition-all duration-100 ease-in-out text-sm ${
                    showNope ? "opacity-50" : ""
                  }`}
                  style={{ backgroundColor: "rgb(147, 51, 234)" }} // Purple color
                  disabled={showNope}
                >
                  {showNope ? "Nope 😏" : "👤 Me"}
                </button>
                {showNope && (
                  <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
                    <span className="text-lg font-bold text-white bg-red-500 px-4 py-2 rounded-md shadow-md animate-bounce">
                      Nope 😏
                    </span>
                  </div>
                )}
              </div>
            )}

            <button
              onClick={() => handleVote(null)}
              className={`w-full py-2.5 ${theme.secondaryButton} ${theme.secondaryButtonHover} text-white rounded-md shadow-sm transition-all duration-100 ease-in-out text-sm`}
              disabled={isVoting}
            >
              Skip this pair
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function PlayerCard({
  player,
  onVote,
  isSelected = false,
  isDisabled = false,
  theme,
}: {
  player: User | null;
  onVote: () => void;
  isSelected?: boolean;
  isDisabled?: boolean;
  theme: TelegramTheme;
}) {
  // Tailwind animation classes for Telegram Mini App
  const cardAnimationClasses = "animate-fadeInFast";

  // Adjust transition duration for Telegram Mini App
  const transitionDuration = "duration-150";

  // Special styles for selection effect
  const selectionStyle: React.CSSProperties = isSelected
    ? {
        animation: "greenFlash 0.6s ease-out",
        borderColor: "#22c55e", // Green-500
        borderWidth: "2px",
        transform: "scale(1.02)",
      }
    : {};

  // Handle touch events specifically
  const handleTouchStart = (e: React.TouchEvent) => {
    // Prevent default to avoid any browser-specific touch behaviors
    e.preventDefault();
  };

  return (
    <button
      onClick={onVote}
      onTouchStart={handleTouchStart}
      disabled={isDisabled}
      className={`flex flex-col items-center p-4 border rounded-lg shadow-sm transition-all ${transitionDuration} ${
        isSelected
          ? `${theme.selectedBorder} ${theme.selectedBg}`
          : `${theme.border} hover:shadow-md`
      } ${cardAnimationClasses} w-full ${
        isDisabled ? "opacity-70 cursor-not-allowed" : "cursor-pointer"
      } touch-manipulation`} // Added touch-manipulation for better touch handling
      style={{
        ...(isSelected ? selectionStyle : theme.borderStyle),
        WebkitTapHighlightColor: "transparent", // Remove tap highlight on mobile
        touchAction: "manipulation", // Improve touch behavior
      }}
    >
      <div className="relative mb-3 overflow-hidden rounded-full">
        <div
          className={`transition-transform ${transitionDuration} ${
            isSelected ? "scale-105" : ""
          }`}
        >
          <Image
            src={player?.photo_url ?? "/default-avatar.svg"}
            alt={player?.first_name ?? "Player"}
            width={120}
            height={120}
            priority
            className={`rounded-full object-cover border-2 ${
              isSelected ? "border-green-500" : "border-gray-700"
            } shadow-sm`}
            draggable={false} // Prevent dragging of images which can interfere with touch
          />
          {isSelected && (
            <div className="absolute inset-0 flex items-center justify-center bg-green-500 bg-opacity-40 rounded-full">
              <span className="text-white text-3xl animate-pulse">✓</span>
            </div>
          )}
        </div>
      </div>
      <h3
        className={`mt-1 text-sm font-medium text-center ${theme.text} ${
          isSelected ? "text-green-500" : ""
        }`}
        style={isSelected ? undefined : theme.textStyle}
      >
        {player?.first_name} {player?.last_name}
      </h3>
      <p
        className={`text-xs ${theme.secondaryText} text-center`}
        style={theme.secondaryTextStyle}
      >
        {player?.username ? "@" + player.username : "No username"}
      </p>
    </button>
  );
}
