'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Loader2, AlertCircle } from 'lucide-react';
import Link from 'next/link';

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClientComponentClient();

    const checkProfileAndRedirect = async (userId: string) => {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_complete')
          .eq('id', userId)
          .maybeSingle();

        if (!profile || profile.is_complete !== true) {
          router.replace('/profile-setup');
        } else {
          router.replace('/dashboard');
        }
      } catch (err) {
        console.error('Profile fetch error, redirecting to setup:', err);
        router.replace('/profile-setup');
      }
    };

    const handleAuth = async () => {
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      if (error) {
        console.error('OAuth error:', error, errorDescription);
        setErrorMsg(errorDescription || error);
        return;
      }

      const code = searchParams.get('code');

      if (code) {
        try {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            console.error('Code exchange failed:', exchangeError);
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
              setErrorMsg(exchangeError.message);
              return;
            }
          }
        } catch (err: any) {
          console.error('Error during exchangeCodeForSession:', err);
          setErrorMsg(err.message || 'Failed to exchange auth code');
          return;
        }
      }

      // Check session & profile
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          await checkProfileAndRedirect(session.user.id);
          return;
        }

        // Listen for session if not yet populated
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, currentSession) => {
          if (currentSession?.user) {
            subscription.unsubscribe();
            await checkProfileAndRedirect(currentSession.user.id);
          }
        });
      } catch (err: any) {
        console.error('Session retrieval error:', err);
        router.replace('/profile-setup');
      }
    };

    handleAuth();
  }, [router, searchParams]);

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-[#141314] flex flex-col items-center justify-center text-white px-4">
        <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 mb-4">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold font-serif mb-2">Authentication Failed</h2>
        <p className="text-stone-400 text-sm max-w-md text-center mb-6">{errorMsg}</p>
        <Link
          href="/auth"
          className="px-5 py-2.5 rounded-full bg-[#FF553E] hover:bg-[#e04833] text-white text-sm font-medium transition-colors"
        >
          Return to Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#141314] flex flex-col items-center justify-center text-white">
      <Loader2 className="w-8 h-8 animate-spin text-[#FF553E] mb-4" />
      <p className="text-stone-300 font-serif text-lg tracking-wide">Connecting your SRM account...</p>
      <p className="text-stone-500 text-xs mt-1">Please wait while we set up your session</p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#141314] flex flex-col items-center justify-center text-white">
          <Loader2 className="w-8 h-8 animate-spin text-[#FF553E] mb-4" />
          <p className="text-stone-300 font-serif">Connecting your account...</p>
        </div>
      }
    >
      <CallbackHandler />
    </Suspense>
  );
}
