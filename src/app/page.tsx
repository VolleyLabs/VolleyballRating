'use client';

import { useEffect, useState } from 'react';
import { retrieveLaunchParams } from '@telegram-apps/sdk';

export default function Home() {
  const [initData, setInitData] = useState<unknown>(null);
  const [initDataRaw, setInitDataRaw] = useState<unknown>(null);
  useEffect(() => {
    const { initDataRaw, initData } = retrieveLaunchParams();
    setInitData(initData);
    setInitDataRaw(initDataRaw);
  }, []);

  return (
    <div>
      Hello, Telegram Mini App!
      {JSON.stringify(initData)}
      {JSON.stringify(initDataRaw)}
    </div>
  );
}