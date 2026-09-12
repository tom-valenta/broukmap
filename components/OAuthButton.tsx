// components/OAuthButton.tsx
'use client';

import { createClient } from '@/lib/supabase/client';
import { ReactNode } from 'react';

type Provider = 'google' | 'apple';

interface OAuthButtonProps {
  provider: Provider;
  label: string;
  icon: ReactNode;
}

export function OAuthButton({ provider, label, icon }: OAuthButtonProps) {
  const supabase = createClient();

  const handleSignIn = async () => {
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  return (
    <button
      onClick={handleSignIn}
      className="flex w-full items-center justify-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-900 transition-colors hover:bg-gray-50 active:bg-gray-100 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700 dark:active:bg-gray-600"
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}