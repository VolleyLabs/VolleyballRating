'use client';

import Image from "next/image";
import { useTelegram } from "@context/telegram-context";
import { ScreenName } from "../page";
import { useEffect, useState } from "react";
import { isAdmin } from "@lib/supabase-queries";

type FooterProps = {
  setActiveScreen: (screen: ScreenName) => void;
};

export default function Footer({setActiveScreen} : FooterProps) {
  const { launchParams, theme } = useTelegram();
  const [admin, setAdmin] = useState<boolean>(false)

  const initIsAdmin = async () => {
    setAdmin(await isAdmin(launchParams?.tgWebAppData?.user?.id ?? 832467215))
  }

  useEffect(() => {
    initIsAdmin()
  })

  const footerElement = (icon: string, activeScreenName: ScreenName) => {
    return (
      <div className="pb-2 flex-col align-center justify-items-center" onClick={() => setActiveScreen(activeScreenName)}>
          <Image src={icon} alt={activeScreenName} width={30} height={30}/>
      </div>
    )
  }

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