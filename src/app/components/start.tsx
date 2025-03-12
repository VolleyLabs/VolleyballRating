'use client';

import { useEffect, useState } from "react";
import { useTelegram } from "@context/telegram-context";
import { Game, getActiveGame } from "@lib/supabase-queries";

export default function Start() {

  const {theme} = useTelegram()

  const [currentGame, setCurrentGame] = useState<Game | null>(null)

  useEffect(() => {
    initCurrentGame()
  }, [])

  const initCurrentGame = async () => {
    setCurrentGame(await getActiveGame())
  }

  const gameCreator = (
    <div>

    </div>
  )

  const gameViewer = () => (
    <div>

    </div>
  )

  const createGame = () => {

  }

  const reshuffle = () => {

  }

  return (
    <div className={`flex flex-auto flex-col ${theme.bg} items-center`}>
      <div className={`${theme.cardBg} p-4 rounded-sm m-4`} onClick={currentGame ? reshuffle: createGame}>
        <h3>{currentGame ? 'Reshuffle': 'Start a game!'}</h3>
      </div>
      {currentGame
      ? gameViewer()
      : gameCreator}
    </div>
  )
}