'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Eye, EyeOff, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';

function AuthContent() {
  const [activeTab, setActiveTab] = useState<'login' | 'signup' | 'forgot'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Verification state
  const [isVerificationPending, setIsVerificationPending] = useState(false);
  const [resendStatus, setResendStatus] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);

  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectPath = searchParams.get('redirect');
  const supabase = createClientComponentClient();

  const formatErrorMessage = (msg: string): string => {
    if (msg.includes('Invalid login credentials')) {
      return 'Invalid email or password. Please check your credentials and try again.';
    }
    if (msg.includes('User already registered')) {
      return 'An account with this email already exists. Please sign in instead.';
    }
    return msg;
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      if (activeTab === 'login') {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;

        if (data?.user) {
          // Check if profile exists and is complete
          const { data: profile } = await supabase
            .from('profiles')
            .select('is_complete')
            .eq('id', data.user.id)
            .maybeSingle();

          router.refresh();
          if (!profile || !profile.is_complete) {
            router.push('/profile-setup');
          } else {
            router.push(redirectPath || '/dashboard');
          }
        } else {
          router.push('/dashboard');
        }
      } else if (activeTab === 'signup') {
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters long');
        }
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match');
        }

        const callbackUrl = `${window.location.origin}/auth/callback?next=/profile-setup`;

        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: callbackUrl,
          },
        });

        if (signUpError) throw signUpError;

        // If email confirmation is enabled in Supabase, session is null
        if (data.user && !data.session) {
          setIsVerificationPending(true);
        } else {
          router.refresh();
          router.push('/profile-setup');
        }
      } else if (activeTab === 'forgot') {
        const callbackUrl = `${window.location.origin}/auth/callback?next=/auth/reset-password`;

        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: callbackUrl,
        });

        if (resetError) throw resetError;

        setSuccessMessage('Password reset link sent! Check your inbox to set a new password.');
      }
    } catch (err: any) {
      setError(formatErrorMessage(err.message || 'An error occurred during authentication'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setError(null);
    try {
      const callbackUrl = `${window.location.origin}/auth/callback?next=/dashboard`;
      const { error: googleError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callbackUrl,
        },
      });
      if (googleError) throw googleError;
    } catch (err: any) {
      setError(err.message || 'Google authentication failed. Please try again or use email sign-in.');
      setIsGoogleLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email) return;
    setIsResending(true);
    setResendStatus(null);
    try {
      const callbackUrl = `${window.location.origin}/auth/callback?next=/profile-setup`;
      const { error: resendErr } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: callbackUrl,
        },
      });
      if (resendErr) throw resendErr;
      setResendStatus('Verification email resent! Check your inbox.');
    } catch (err: any) {
      setResendStatus(err.message || 'Failed to resend verification email.');
    } finally {
      setIsResending(false);
    }
  };

  if (isVerificationPending) {
    return (
      <div className="w-full max-w-md bg-surface p-8 rounded-2xl shadow-sm border border-border text-center space-y-5 animate-in fade-in duration-300">
        <div className="w-14 h-14 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto">
          <Mail className="w-7 h-7" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-text-main tracking-tight">Check your email</h2>
          <p className="text-sm text-text-muted leading-relaxed">
            We sent a verification link to <span className="font-semibold text-text-main">{email}</span>. Click the link in the email to activate your account and start studying with peers.
          </p>
        </div>

        {resendStatus && (
          <div className="text-xs text-primary bg-primary/10 p-2.5 rounded-lg">
            {resendStatus}
          </div>
        )}

        <div className="pt-2 space-y-3">
          <Button
            type="button"
            variant="secondary"
            className="w-full"
            onClick={handleResendVerification}
            isLoading={isResending}
          >
            Resend Email
          </Button>

          <button
            type="button"
            onClick={() => {
              setIsVerificationPending(false);
              setActiveTab('login');
              setError(null);
            }}
            className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text-main transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Log In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md bg-surface p-8 rounded-2xl shadow-sm border border-border">
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-primary tracking-tight">Edulink</h1>
        <p className="text-sm text-text-muted mt-1">Your student study collaboration platform</p>
      </div>

      {/* Tabs */}
      {activeTab !== 'forgot' ? (
        <div className="flex border-b border-border mb-6">
          <button
            type="button"
            className={`flex-1 pb-3 text-sm font-medium transition-colors ${
              activeTab === 'login'
                ? 'text-primary border-b-2 border-primary'
                : 'text-text-muted hover:text-text-main'
            }`}
            onClick={() => {
              setActiveTab('login');
              setError(null);
              setSuccessMessage(null);
            }}
          >
            Log In
          </button>
          <button
            type="button"
            className={`flex-1 pb-3 text-sm font-medium transition-colors ${
              activeTab === 'signup'
                ? 'text-primary border-b-2 border-primary'
                : 'text-text-muted hover:text-text-main'
            }`}
            onClick={() => {
              setActiveTab('signup');
              setError(null);
              setSuccessMessage(null);
            }}
          >
            Sign Up
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 mb-6">
          <button
            type="button"
            onClick={() => {
              setActiveTab('login');
              setError(null);
              setSuccessMessage(null);
            }}
            className="p-1 text-text-muted hover:text-text-main transition-colors"
            aria-label="Back to login"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-semibold text-text-main">Reset Password</span>
        </div>
      )}

      {/* Google OAuth Button */}
      {activeTab !== 'forgot' && (
        <div className="mb-6 space-y-4">
          <Button
            type="button"
            variant="secondary"
            className="w-full gap-2.5"
            onClick={handleGoogleSignIn}
            isLoading={isGoogleLoading}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            Continue with Google
          </Button>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-border w-full"></div>
            <span className="bg-surface px-3 text-xs uppercase tracking-wider text-text-muted relative">
              Or with email
            </span>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 text-sm text-error bg-red-50 dark:bg-red-950/30 p-3 rounded-lg border border-red-200 dark:border-red-900/50">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="mb-4 text-sm text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950/30 p-3 rounded-lg border border-green-200 dark:border-green-900/50 flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleAuth} className="space-y-4">
        {activeTab === 'signup' && (
          <Input
            label="Full Name"
            type="text"
            placeholder="John Doe"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        )}

        <Input
          label="Email Address"
          type="email"
          placeholder="you@university.edu"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        {activeTab !== 'forgot' && (
          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={activeTab === 'signup' ? 6 : undefined}
            rightElement={
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="hover:text-text-main transition-colors focus:outline-none"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
          />
        )}

        {activeTab === 'signup' && (
          <Input
            label="Confirm Password"
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
            rightElement={
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="hover:text-text-main transition-colors focus:outline-none"
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            }
          />
        )}

        {activeTab === 'login' && (
          <div className="flex justify-end mt-1">
            <button
              type="button"
              onClick={() => {
                setActiveTab('forgot');
                setError(null);
                setSuccessMessage(null);
              }}
              className="text-xs text-primary hover:underline transition-colors focus:outline-none"
            >
              Forgot password?
            </button>
          </div>
        )}

        <Button
          type="submit"
          className="w-full mt-6"
          size="lg"
          isLoading={isLoading}
        >
          {activeTab === 'login' && 'Sign In'}
          {activeTab === 'signup' && 'Create Account'}
          {activeTab === 'forgot' && 'Send Reset Link'}
        </Button>
      </form>
    </div>
  );
}

export default function AuthPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 sm:px-6 lg:px-8">
      <Suspense fallback={<div className="text-text-muted text-sm">Loading authentication...</div>}>
        <AuthContent />
      </Suspense>
    </div>
  );
}
