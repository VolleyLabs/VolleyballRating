'use client';

import Image from 'next/image';
import { useTelegram } from '@context/telegram-context';
import { ScreenName } from '../app/page';

interface NavigationProps {
  activeScreen: ScreenName;
  setActiveScreen: (screen: ScreenName) => void;
  screenNames: ScreenName[];
}

export default function Navigation({ activeScreen, setActiveScreen, screenNames }: NavigationProps) {
  const { theme } = useTelegram();

  const iconMap: Record<ScreenName, string> = {
    leaderboard: '/leaderboard.svg',
    history: '/history.svg',
    start: '/volleyball.svg'
  };

  return (
    <nav className={`flex justify-center p-4 border-b ${theme.border}`} style={theme.borderStyle}>
      <div className="flex space-x-4">
        {screenNames.map((screen) => (
          <button
            key={screen}
            onClick={() => setActiveScreen(screen)}
            className={`p-3 rounded-full transition-colors ${
              activeScreen === screen 
                ? theme.primaryButton
                : theme.secondaryButton
            }`}
            style={activeScreen === screen ? theme.primaryButtonStyle : {}}
            title={screen.charAt(0).toUpperCase() + screen.slice(1)}
          >
            <Image 
              src={iconMap[screen]} 
              alt={screen} 
              width={24} 
              height={24} 
              className={activeScreen === screen ? 'brightness-0 invert' : ''}
            />
          </button>
        ))}
      </div>
    </nav>
  );
} 