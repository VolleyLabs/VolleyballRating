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
  const profileClasses = `w-full max-w-md flex items-center gap-4 mb-6 p-4 ${styles.cardBg} rounded-lg shadow-sm`;

  return (
      <div className={isLoading ? `${profileClasses} animate-pulse` : profileClasses}>
        {isLoading ? (
          <>
            <div className="w-[60px] h-[60px] rounded-full bg-gray-300 dark:bg-gray-700"></div>
            <div className="flex-1">
              <div className="h-6 bg-gray-300 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
            </div>
          </>
        ) : (
          <>
            <Image 
              src={launchParams?.tgWebAppData?.user?.photo_url ?? "/default-avatar.svg"} 
              alt="User Photo" 
              width={60} 
              height={60} 
              className={`rounded-full border-2 ${styles.border}`}
            />
            <h1 className={`text-xl font-medium ${styles.text}`}>
              Hello, {launchParams?.tgWebAppData?.user?.first_name || 'Player'}!
            </h1>
          </>
        )}
      </div>
  );
}