'use client';

import Hello from './components/hello';
import RatingTable from './components/rating';
import Vote from './components/vote';
import { useTelegram } from './context/telegram-context';

export default function Home() {
  const { theme } = useTelegram();

  return (
    <div 
      className={`w-full mx-auto p-2 sm:p-4 flex flex-col gap-2 items-center ${theme.bg} min-h-screen overflow-hidden`}
      style={theme.bgStyle}
    >
      <Hello />
      <Vote />
      <RatingTable />
    </div>
  )
}