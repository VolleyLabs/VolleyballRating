'use client';

import { useEffect, useState } from 'react';
import { retrieveLaunchParams } from '@telegram-apps/sdk';
import { isTMA } from '@telegram-apps/bridge';

export default function Home() {
  const [initData, setInitData] = useState<unknown>({});
  const [initDataRaw, setInitDataRaw] = useState<unknown>({});
  useEffect(() => {
    if (isTMA()) {
      const { initDataRaw, initData } = retrieveLaunchParams();
      setInitData(initData);
      setInitDataRaw(initDataRaw);
    }
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      Hello, Telegram Mini App! <br />
      {JSON.stringify(initData)}
      <br />
      {JSON.stringify(initDataRaw)}
    </div>
  );
}