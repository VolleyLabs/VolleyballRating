'use client';

import Image from 'next/image';
import { useTheme } from '../context/theme-context';
import { tv, commonVariants } from '../utils/theme-variants';
import { useTelegram } from '../context/telegram-context';

export default function Hello() {
  const { launchParams, isLoading } = useTelegram();
  const { colorScheme } = useTheme();
  
  // Get styles based on current theme
  const styles = tv(commonVariants, colorScheme);

  // Common classes for user profile to avoid layout shifts
  const profileClasses = `w-full max-w-md flex items-center gap-3 sm:gap-4 mb-4 sm:mb-6 p-3 sm:p-4 ${styles.cardBg} rounded-lg shadow-sm overflow-hidden`;

  return (
      <div className={isLoading ? `${profileClasses} animate-pulse` : profileClasses}>
        {isLoading ? (
          <>
            <div className="w-[50px] h-[50px] sm:w-[60px] sm:h-[60px] rounded-full bg-gray-300 dark:bg-gray-700 flex-shrink-0"></div>
            <div className="flex-1 min-w-0">
              <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
            </div>
          </>
        ) : (
          <>
            <Image 
              src={launchParams?.tgWebAppData?.user?.photo_url ?? "/default-avatar.svg"} 
              alt="User Photo" 
              width={50}
              height={50}
              className={`rounded-full border-2 ${styles.border} sm:w-[60px] sm:h-[60px] flex-shrink-0`}
            />
            <h1 className={`text-lg sm:text-xl font-medium ${styles.text} truncate`}>
              Hello, {launchParams?.tgWebAppData?.user?.first_name || 'Player'}!
            </h1>
          </>
        )}
      </div>
  );
}