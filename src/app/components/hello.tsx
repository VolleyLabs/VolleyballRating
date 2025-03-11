'use client';

import { useEffect, useState } from 'react';
import { retrieveLaunchParams } from '@telegram-apps/sdk';
import { isTMA, RetrieveLPResult } from '@telegram-apps/bridge';
import Image from 'next/image';

export default function Hello() {
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
      {launchParams?.tgWebAppData?.user?.photo_url && (
        <Image src={launchParams?.tgWebAppData?.user?.photo_url} alt="User Photo" width={100} height={100} />
      )}
    </div>
  );
}