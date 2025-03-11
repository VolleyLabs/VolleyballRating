"use client";

import { useCallback, useEffect, useState } from "react";
import { getRandomVotePair, submitVote, VotePair, User } from "@/app/lib/supabaseQueries";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { PostgrestError } from "@supabase/supabase-js";
import { useTheme } from "../context/theme-context";
import { tv, commonVariants } from "../utils/theme-variants";
import { isTMA } from '@telegram-apps/bridge';

// Player card skeleton component
function PlayerCardSkeleton({ colorScheme }: { colorScheme: 'light' | 'dark' }) {
  const styles = tv(commonVariants, colorScheme);
  
  return (
    <motion.div 
      className={`flex flex-col items-center p-4 border rounded-lg shadow-sm ${styles.border} animate-pulse`}
      initial={{ scale: 0.95, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="relative mb-2 overflow-hidden rounded-full">
        <div className="w-[80px] h-[80px] rounded-full bg-gray-300 dark:bg-gray-700"></div>
      </div>
      <div className="h-4 w-20 bg-gray-300 dark:bg-gray-700 rounded mt-1 mb-1"></div>
      <div className="h-3 w-16 bg-gray-300 dark:bg-gray-700 rounded mb-2"></div>
      <div className={`w-full h-8 bg-gray-300 dark:bg-gray-700 rounded-md`}></div>
    </motion.div>
  );
}

export default function Vote({ voterId }: { voterId: number }) {
  const [pairs, setPairs] = useState<VotePair[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<PostgrestError | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<number | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const { colorScheme } = useTheme();
  const isTelegramMiniApp = isTMA();
  
  // Get styles based on current theme
  const styles = tv(commonVariants, colorScheme);

  const loadNewPairs = useCallback(async function loadNewPairs() {
    try {
      setError(null);
      setIsLoading(true);
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

    setIsVoting(true);
    setSelectedPlayer(winnerId);

    // Optimistically update UI
    const currentPair = pairs[0];
    
    try {
      // Submit vote
      const success = await submitVote(voterId, currentPair.playerA.id, currentPair.playerB.id, winnerId);
      if (!success) {
        console.error("Failed to submit vote");
      }
      
      // Update state only after voting is complete
      // This helps avoid issues with animations in Telegram Mini App
      setPairs(prevPairs => prevPairs.slice(1));
      setSelectedPlayer(null);
      
      // Load new pairs if current list is empty
      if (pairs.length <= 1) {
        await loadNewPairs();
      }
    } catch (error) {
      console.error("Error submitting vote:", error);
    } finally {
      setIsVoting(false);
    }
  }

  // Common container classes to avoid layout shifts
  const containerClasses = `w-full max-w-md mx-auto p-3 sm:p-4 ${styles.cardBg} rounded-lg shadow-sm overflow-hidden`;

  if (error) return <p className={`text-center text-base p-3 sm:p-4 ${styles.text}`}>Error loading pairs: {error.message}</p>;
  
  if (pairs.length == 0 && !isLoading) return (
    <div className={`w-full max-w-md mx-auto p-4 sm:p-6 ${styles.cardBg} rounded-lg shadow-sm text-center overflow-hidden`}>
      <p className={`text-lg mb-2 ${styles.text}`}>You already voted for all players</p>
      <p className={`text-sm ${styles.secondaryText}`}>Thank you for participating!</p>
    </div>
  );

  // Animation settings for Telegram Mini App
  const animationSettings = isTelegramMiniApp 
    ? { 
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.2 }
      }
    : {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -20 },
        transition: { duration: 0.3 }
      };

  return (
    <AnimatePresence mode="wait">
      <motion.div 
        key={isLoading ? 'loading' : pairs[0] ? `${pairs[0].playerA.id}-${pairs[0].playerB.id}` : 'empty'}
        {...animationSettings}
        className={containerClasses}
      >
        {isLoading ? (
          <>
            <div className="h-6 w-40 bg-gray-300 dark:bg-gray-700 rounded mx-auto mb-4"></div>

            <div className="grid grid-cols-2 gap-3 w-full">
              <PlayerCardSkeleton colorScheme={colorScheme} />
              <PlayerCardSkeleton colorScheme={colorScheme} />
            </div>

            <div className="w-full h-10 bg-gray-300 dark:bg-gray-700 rounded-md mt-4"></div>
          </>
        ) : (
          <>
            <motion.h2 
              className={`text-lg font-medium text-center mb-4 ${styles.text}`}
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              transition={{ duration: isTelegramMiniApp ? 0.2 : 0.3 }}
            >
              Who plays better?
            </motion.h2>

            <div className="grid grid-cols-2 gap-3 w-full">
              <PlayerCard 
                player={pairs[0].playerA} 
                onVote={() => handleVote(pairs[0].playerA.id)} 
                isSelected={selectedPlayer === pairs[0].playerA.id}
                isDisabled={isVoting}
                colorScheme={colorScheme}
                isTelegramMiniApp={isTelegramMiniApp}
              />
              <PlayerCard 
                player={pairs[0].playerB} 
                onVote={() => handleVote(pairs[0].playerB.id)} 
                isSelected={selectedPlayer === pairs[0].playerB.id}
                isDisabled={isVoting}
                colorScheme={colorScheme}
                isTelegramMiniApp={isTelegramMiniApp}
              />
            </div>

            <motion.button 
              onClick={() => handleVote(null)} 
              className={`w-full mt-4 py-2.5 ${styles.secondaryButton} ${styles.secondaryButtonHover} text-white rounded-md shadow-sm transition-all duration-200 ease-in-out text-sm`}
              whileHover={!isTelegramMiniApp ? { scale: 1.02 } : undefined}
              whileTap={!isTelegramMiniApp ? { scale: 0.98 } : undefined}
              disabled={isVoting}
            >
              ❓ Don&apos;t know
            </motion.button>
          </>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

function PlayerCard({ 
  player, 
  onVote, 
  isSelected = false,
  isDisabled = false,
  colorScheme,
  isTelegramMiniApp = false
}: { 
  player: User | null; 
  onVote: () => void; 
  isSelected?: boolean;
  isDisabled?: boolean;
  colorScheme: 'light' | 'dark';
  isTelegramMiniApp?: boolean;
}) {
  // Get styles based on current theme
  const styles = tv(commonVariants, colorScheme);

  // Animation settings for Telegram Mini App
  const cardAnimationProps = isTelegramMiniApp
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        transition: { duration: 0.2 }
      }
    : {
        whileHover: { y: -2 },
        initial: { scale: 0.95, opacity: 0 },
        animate: { scale: 1, opacity: 1 },
        transition: { duration: 0.3 }
      };

  return (
    <motion.div 
      className={`flex flex-col items-center p-3 border rounded-lg shadow-sm transition-all duration-300 ${
        isSelected ? `${styles.selectedBorder} ${styles.selectedBg}` : `${styles.border} hover:shadow-md`
      }`}
      {...cardAnimationProps}
    >
      <div className="relative mb-2 overflow-hidden rounded-full">
        <motion.div
          whileHover={!isTelegramMiniApp ? { scale: 1.05 } : undefined}
          transition={{ duration: 0.3 }}
        >
          <Image 
            src={player?.photoUrl ?? "/default-avatar.svg"} 
            alt={player?.firstName ?? "Player"} 
            width={80} 
            height={80}
            priority
            className={`rounded-full object-cover border-2 ${colorScheme === 'dark' ? 'border-gray-700' : 'border-white'} shadow-sm`} 
          />
        </motion.div>
      </div>
      <h3 className={`mt-1 text-sm font-medium text-center ${styles.text}`}>{player?.firstName} {player?.lastName}</h3>
      <p className={`text-xs ${styles.secondaryText} mb-2 text-center`}>@{player?.username ?? "No username"}</p>
      <motion.button 
        onClick={onVote} 
        className={`w-full py-2 ${styles.primaryButton} text-white rounded-md shadow-sm transition-all duration-200 text-xs ${
          isDisabled ? "opacity-50 cursor-not-allowed" : styles.primaryButtonHover
        }`}
        whileHover={!isDisabled && !isTelegramMiniApp ? { scale: 1.05 } : undefined}
        whileTap={!isDisabled && !isTelegramMiniApp ? { scale: 0.95 } : undefined}
        disabled={isDisabled}
      >
        {isSelected ? "✓ Selected" : "👍 Vote"}
      </motion.button>
    </motion.div>
  );
}