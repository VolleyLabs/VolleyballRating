"use client";

import { useCallback, useEffect, useState } from "react";
import { getRandomVotePair, submitVote, VotePair, User } from "@/app/lib/supabase-queries";
import Image from "next/image";
import { PostgrestError } from "@supabase/supabase-js";
import { isTMA } from '@telegram-apps/bridge';
import { useTelegram } from "../context/telegram-context";
import { TelegramTheme } from "../utils/telegram-theme";

// Player card skeleton component
function PlayerCardSkeleton({ theme }: { theme: TelegramTheme }) {
  return (
    <div 
      className={`flex flex-col items-center p-4 border rounded-lg shadow-sm ${theme.border} animate-fadeIn`}
      style={theme.borderStyle}
    >
      <div className="relative mb-2 overflow-hidden rounded-full">
        <div className="w-[80px] h-[80px] rounded-full bg-gray-300 dark:bg-gray-700"></div>
      </div>
      <div className="h-4 w-20 bg-gray-300 dark:bg-gray-700 rounded mt-1 mb-1"></div>
      <div className="h-3 w-16 bg-gray-300 dark:bg-gray-700 rounded mb-2"></div>
      <div className={`w-full h-8 bg-gray-300 dark:bg-gray-700 rounded-md`}></div>
    </div>
  );
}

export default function Vote({ voterId }: { voterId: number }) {
  const [pairs, setPairs] = useState<VotePair[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<PostgrestError | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<number | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const isTelegramMiniApp = isTMA();
  const { theme } = useTelegram();
  
  // States for the "Me" button
  const [showMeButton, setShowMeButton] = useState(false);
  const [showNope, setShowNope] = useState(false);

  // Determine if the "Me" button should be shown with a 1% chance
  useEffect(() => {
    const randomChance = Math.random() * 100;
    setShowMeButton(randomChance <= 1);
    setShowNope(false);
  }, [pairs]);

  const loadNewPairs = useCallback(async function loadNewPairs(showLoading = true) {
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
  }, [voterId]);

  // Initial fetch
  useEffect(() => {
    loadNewPairs();
  }, [loadNewPairs]);

  async function handleVote(winnerId: number | null) {
    if (!pairs[0] || isVoting) return;

    // Immediately update UI for better responsiveness
    setSelectedPlayer(winnerId);
    
    // For mobile/Telegram Mini App, we want to be more responsive
    if (isTelegramMiniApp) {
      // Optimistically update UI first
      const currentPair = pairs[0];
      
      // Set isVoting before updating pairs to prevent multiple clicks
      setIsVoting(true);
      
      // Update pairs and reset selectedPlayer together to maintain synchronization
      setPairs(prevPairs => prevPairs.slice(1));
      setSelectedPlayer(null);
      
      // Then submit vote in background without blocking UI
      submitVote(voterId, currentPair.playerA.id, currentPair.playerB.id, winnerId)
        .then(success => {
          if (!success) {
            console.error("Failed to submit vote");
          }
          
          // Load new pairs if needed
          if (pairs.length <= 1) {
            return loadNewPairs(false);
          }
        })
        .catch(error => {
          console.error("Error submitting vote:", error);
        })
        .finally(() => {
          // Just reset isVoting here, selectedPlayer is already reset
          setIsVoting(false);
        });
    } else {
      // For desktop, keep the original flow
      setIsVoting(true);
      
      // Optimistically update UI
      const currentPair = pairs[0];
      
      try {
        // Submit vote
        const success = await submitVote(voterId, currentPair.playerA.id, currentPair.playerB.id, winnerId);
        if (!success) {
          console.error("Failed to submit vote");
        }
        
        // Update state only after voting is complete
        setPairs(prevPairs => prevPairs.slice(1));
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
  }

  // Common container classes to avoid layout shifts
  const containerClasses = `w-full max-w-md mx-auto p-3 sm:p-4 ${theme.cardBg} rounded-lg shadow-sm overflow-hidden`;

  if (error) return (
    <p 
      className={`text-center text-base p-3 sm:p-4 ${theme.text}`}
      style={theme.textStyle}
    >
      Error loading pairs: {error.message}
    </p>
  );
  
  if (pairs.length == 0 && !isLoading) return (
    <div 
      className={`w-full max-w-md mx-auto p-4 sm:p-6 ${theme.cardBg} rounded-lg shadow-sm text-center overflow-hidden`}
      style={theme.cardBgStyle}
    >
      <p 
        className={`text-lg mb-2 ${theme.text}`}
        style={theme.textStyle}
      >
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

  // Tailwind animation classes depending on the application type
  const animationClasses = isTelegramMiniApp 
    ? "animate-fadeInFast" 
    : "animate-fadeInSlideUp";

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
      key={isLoading ? 'loading' : pairs[0] ? `${pairs[0].playerA.id}-${pairs[0].playerB.id}` : 'empty'}
      className={`${containerClasses} ${animationClasses}`}
      style={theme.cardBgStyle}
    >
      {isLoading ? (
        <>
          <div className="h-6 w-40 bg-gray-300 dark:bg-gray-700 rounded mx-auto mb-4"></div>

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
            style={{...theme.textStyle, transform: 'scale(1)'}}
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
              isTelegramMiniApp={isTelegramMiniApp}
            />
            <PlayerCard 
              player={pairs[0].playerB} 
              onVote={() => handleVote(pairs[0].playerB.id)} 
              isSelected={selectedPlayer === pairs[0].playerB.id}
              isDisabled={isVoting}
              theme={theme}
              isTelegramMiniApp={isTelegramMiniApp}
            />
          </div>

          <div className="flex flex-col gap-2 mt-4">
            {showMeButton && (
              <div className="relative w-full">
                <button 
                  onClick={handleMeButtonClick} 
                  className={`w-full py-2 ${theme.primaryButton} bg-purple-600 hover:bg-purple-700 text-white rounded-md shadow-sm transition-all ${isTelegramMiniApp ? 'duration-100' : 'duration-200'} ease-in-out text-sm ${!isTelegramMiniApp ? 'hover:scale-[1.02] active:scale-[0.98]' : ''} ${showNope ? 'opacity-50' : ''}`}
                  style={{backgroundColor: 'rgb(147, 51, 234)'}} // Purple color
                  disabled={showNope}
                >
                  {showNope ? "Nope 😏" : "👤 Me"}
                </button>
                {showNope && (
                  <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center">
                    <span className="text-lg font-bold text-white bg-red-500 px-4 py-2 rounded-md shadow-md animate-bounce">Nope 😏</span>
                  </div>
                )}
              </div>
            )}

            <button 
              onClick={() => handleVote(null)} 
              className={`w-full py-2.5 ${theme.secondaryButton} ${theme.secondaryButtonHover} text-white rounded-md shadow-sm transition-all ${isTelegramMiniApp ? 'duration-100' : 'duration-200'} ease-in-out text-sm ${!isTelegramMiniApp ? 'hover:scale-[1.02] active:scale-[0.98]' : ''}`}
              disabled={isVoting}
            >
              ❓ Don&apos;t know
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
  isTelegramMiniApp = false
}: { 
  player: User | null; 
  onVote: () => void; 
  isSelected?: boolean;
  isDisabled?: boolean;
  theme: TelegramTheme;
  isTelegramMiniApp?: boolean;
}) {
  // Tailwind animation classes depending on the application type
  const cardAnimationClasses = isTelegramMiniApp
    ? "animate-fadeInFast"
    : "animate-fadeIn";
    
  // Adjust transition duration based on device type
  const transitionDuration = isTelegramMiniApp ? "duration-150" : "duration-300";
  const buttonTransitionDuration = isTelegramMiniApp ? "duration-100" : "duration-200";

  return (
    <div 
      className={`flex flex-col items-center p-3 border rounded-lg shadow-sm transition-all ${transitionDuration} ${
        isSelected ? `${theme.selectedBorder} ${theme.selectedBg}` : `${theme.border} hover:shadow-md`
      } ${cardAnimationClasses} ${!isTelegramMiniApp ? 'hover:-translate-y-1' : ''}`}
      style={isSelected ? 
        {...theme.selectedBorderStyle, ...theme.selectedBgStyle} : 
        theme.borderStyle
      }
    >
      <div className="relative mb-2 overflow-hidden rounded-full">
        <div className={`transition-transform ${transitionDuration} ${!isTelegramMiniApp ? 'hover:scale-105' : ''}`}>
          <Image 
            src={player?.photoUrl ?? "/default-avatar.svg"} 
            alt={player?.firstName ?? "Player"} 
            width={80} 
            height={80}
            priority
            className="rounded-full object-cover border-2 border-gray-700 shadow-sm" 
          />
        </div>
      </div>
      <h3 
        className={`mt-1 text-sm font-medium text-center ${theme.text}`}
        style={theme.textStyle}
      >
        {player?.firstName} {player?.lastName}
      </h3>
      <p 
        className={`text-xs ${theme.secondaryText} mb-2 text-center`}
        style={theme.secondaryTextStyle}
      >
        {player?.username ? '@' + player.username : "No username"}
      </p>
      <button 
        onClick={onVote} 
        className={`w-full py-2 ${theme.primaryButton} text-white rounded-md shadow-sm transition-all ${buttonTransitionDuration} text-xs ${
          isDisabled ? "opacity-50 cursor-not-allowed" : theme.primaryButtonHover
        } ${!isDisabled && !isTelegramMiniApp ? 'hover:scale-105 active:scale-95' : ''}`}
        style={theme.primaryButtonStyle}
        disabled={isDisabled}
      >
        {isSelected ? "✓ Selected" : "👍 Vote"}
      </button>
    </div>
  );
}