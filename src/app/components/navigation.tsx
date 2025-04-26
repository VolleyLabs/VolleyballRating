'use client';

import Image from 'next/image';
import { useTelegram } from '@context/telegram-context';
import { ScreenName } from '../page';

interface NavigationProps {
  activeScreen: ScreenName;
  setActiveScreen: (screen: ScreenName) => void;
  screenNames: ScreenName[];
}

export default function Navigation({ activeScreen, setActiveScreen, screenNames }: NavigationProps) {
  const { launchParams, theme, isAdmin, isLoading } = useTelegram();

  const iconMap: Record<ScreenName, string> = {
    leaderboard: '/leaderboard.svg',
    history: '/history.svg',
    start: '/volleyball.svg',
    settings: '/settings.svg'
  };

  const handleAvatarClick = () => {
    setActiveScreen('settings');
  };

  return (
    <nav className={`flex items-center justify-between p-4 border-b ${theme.border}`} style={theme.borderStyle}>
      <div className="flex items-center gap-3">
        {isLoading ? (
          <div className="w-[40px] h-[40px] rounded-full bg-gray-300 dark:bg-gray-700 animate-pulse"></div>
        ) : (
          <div 
            className="relative cursor-pointer transform transition-all duration-200 hover:scale-110 group" 
            onClick={handleAvatarClick}
            title="User Settings"
          >
            <div className="overflow-hidden rounded-full relative">
              <Image 
                src={launchParams?.tgWebAppData?.user?.photo_url ?? "/default-avatar.svg"} 
                alt="User Photo" 
                width={40}
                height={40}
                className={`rounded-full transition-all duration-200 ${activeScreen === 'settings' ? 'ring-2 ring-offset-1 ring-[#4CD964]' : 'group-hover:brightness-110'}`}
              />
              <div className="absolute inset-0 bg-[#4CD964] opacity-0 group-hover:opacity-10 transition-opacity duration-200 rounded-full"></div>
            </div>
            {isAdmin && (
              <div 
                className="absolute bottom-0 right-0" 
                style={{ transform: 'translate(20%, 20%)' }}
              >
                <div 
                  className="bg-[#0d1c2b] text-[#4CD964] text-[8px] font-bold px-1.5 py-0.5 rounded-sm"
                  style={{ boxShadow: '0 0 0 1px #1a2a3a' }}
                >
                  Admin
                </div>
              </div>
            )}
          </div>
        )}
        {!isLoading && (
          <span 
            className={`text-sm font-medium ${theme.text} hidden sm:inline-block cursor-pointer transition-all duration-200 hover:text-[#4CD964]`} 
            style={theme.textStyle}
            onClick={handleAvatarClick}
          >
            {launchParams?.tgWebAppData?.user?.first_name || 'Player'}
          </span>
        )}
      </div>
      
      <div className="flex space-x-4">
        {screenNames.map((screen) => (
          <button
            key={screen}
            onClick={() => setActiveScreen(screen)}
            className={`p-3 rounded-full transition-all duration-200 transform hover:scale-110 ${
              activeScreen === screen 
                ? `${theme.primaryButton} hover:brightness-110`
                : `${theme.secondaryButton} hover:bg-opacity-80 hover:shadow-md`
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