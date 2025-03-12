'use client';

import History from '@components/history';
import Leaderboard from '@components/leaderboard';
import { JSX, useState } from 'react';
import { useTelegram } from '@context/telegram-context';
import Start from '@components/start';

export type ScreenName = 'leaderboard' | 'history' | 'start';

export default function Home() {

  const {theme} = useTelegram()

  const [activeScreen] = useState<ScreenName>('leaderboard')

  const screens: Record<ScreenName, JSX.Element> = {
    leaderboard: <Leaderboard />,
    history: <History />,
    start: <Start/>
  }

  return (
    <div className={`${theme.bg} flex flex-auto flex-col`}>
      {screens[activeScreen]}
      {/* <Footer setActiveScreen={setActiveScreen}/> */}
    </div>
  )
}