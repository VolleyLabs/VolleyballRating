'use client';

import { useEffect, useState } from 'react';
import { retrieveLaunchParams } from '@telegram-apps/sdk';
import { isTMA, RetrieveLPResult } from '@telegram-apps/bridge';
import Image from 'next/image';
import { createClient } from '@/app/utils/supabase/client';
import Vote from './vote';

const supabase = createClient();

export default function Hello() {
  const [launchParams, setLaunchParams] = useState<RetrieveLPResult | null>(null);

  useEffect(() => {
    if (isTMA()) {
      const launchParams = retrieveLaunchParams();

      setLaunchParams(launchParams);

      if (launchParams?.tgWebAppData?.user) {
        const { id, first_name, last_name, username, photo_url } = launchParams.tgWebAppData.user;

        updateUserInSupabase(id, first_name, last_name, username, photo_url);
      }
    }
  }, []);

  async function updateUserInSupabase(id: number, first_name: string, last_name: string | undefined, username: string | undefined, photo_url: string | undefined) {
    const { error } = await supabase
      .from('users')
      .upsert([{ id, first_name, last_name, username, photo_url }], { onConflict: 'id' });

    if (error) {
      console.error('Error updating user in Supabase:', error);
    }
  }

  return (
    <div className="">
      <h1>Hello, {launchParams?.tgWebAppData?.user?.first_name}</h1>
      <Image src={launchParams?.tgWebAppData?.user?.photo_url ?? "/default-avatar.svg"} alt="User Photo" width={100} height={100} />
      <Vote voterId={launchParams?.tgWebAppData?.user?.id ?? 482553595} />
    </div>
  );
}