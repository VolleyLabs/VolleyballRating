'use client';

import Hello from './components/hello';
import PlayerRating from './components/player-rating';
import Vote from './components/vote';
import { useTelegram } from './context/telegram-context';
import { useTheme } from './context/theme-context';
import { commonVariants, tv } from './utils/theme-variants';

export default function Home() {
  const { launchParams } = useTelegram();
  const { colorScheme } = useTheme();
  const styles = tv(commonVariants, colorScheme);

  return (
    <div className={`w-full mx-auto px-2 sm:px-4 flex pb-4 flex-col items-center ${styles.bg} min-h-screen overflow-hidden`}>
      <Hello />
      <Vote voterId={launchParams?.tgWebAppData?.user?.id ?? 482553595} />
      <PlayerRating />
    </div>
  )
}