'use client';

import { useEffect, useState } from 'react';
import { retrieveLaunchParams } from '@telegram-apps/sdk';
import { isTMA, RetrieveLPResult } from '@telegram-apps/bridge';

export default function Home() {
  const [launchParams, setLaunchParams] = useState<RetrieveLPResult | null>(null);

  useEffect(() => {
    if (isTMA()) {
      const launchParams = retrieveLaunchParams();

      setLaunchParams(launchParams);
    }
  }, []);

  return (
    <div className="">
      <h1>Hello, {launchParams?.tgWebAppData?.user?.first_name}</h1>
    </div>
  );
}