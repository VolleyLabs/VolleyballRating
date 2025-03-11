'use client';

import Hello from './components/hello';
import PlayerRating from './components/player-rating';
import Vote from './components/vote';
import { useTelegram } from './context/telegram-context';
import { tv } from './utils/theme-variants';
import { useTheme } from './context/theme-context';
import { commonVariants } from './utils/theme-variants';

export default function Home() {
  const { launchParams } = useTelegram();
  const { colorScheme } = useTheme();
  const styles = tv(commonVariants, colorScheme);

  return (
    <div className={`w-full mx-auto px-2 sm:px-4 py-2 flex flex-col items-center ${styles.bg} min-h-screen overflow-hidden`}>
      <Hello />
      <Vote voterId={launchParams?.tgWebAppData?.user?.id ?? 482553595} />
      <PlayerRating />
    </div>
  )
}