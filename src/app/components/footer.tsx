'use client';

import Image from "next/image";
import { useTelegram } from "@context/telegram-context";
import { ScreenName } from "../page";
import { useCallback, useEffect, useState } from "react";
import { isAdmin } from "@lib/supabase-queries";

type FooterProps = {
  setActiveScreen: (screen: ScreenName) => void;
};

export default function Footer({setActiveScreen} : FooterProps) {
  const { launchParams, theme } = useTelegram();
  const [admin, setAdmin] = useState<boolean>(false)

  const initIsAdmin = useCallback(async () => {
    setAdmin(await isAdmin(launchParams?.tgWebAppData?.user?.id ?? Number(process.env.NEXT_PUBLIC_TELEGRAM_TEST_ID) ))
  }, [launchParams])

  useEffect(() => {
    initIsAdmin()
  }, [initIsAdmin])

  const footerElement = useCallback((icon: string, activeScreenName: ScreenName) => {
    return (
      <div className="pb-2" onClick={() => setActiveScreen(activeScreenName)}>
          <Image src={icon} alt={activeScreenName} width={30} height={30}/>
      </div>
    )
  }, [setActiveScreen])

  const leaderboard = footerElement('/leaderboard.svg', 'leaderboard')
  const history = footerElement('/history.svg', 'history')
  const start = footerElement('/volleyball.svg', 'start')

  return (
    <>
      <div className={`min-h-12 ${theme.bg}`}/>
      <div className={`fixed bottom-0 h-12 p-2 w-full  ${theme.bg}`}>
        <div className={`flex flex-auto flex-row justify-around`}>
          {leaderboard}
          {admin && start}
          {history}
        </div>
      </div>
    </>
  )
}