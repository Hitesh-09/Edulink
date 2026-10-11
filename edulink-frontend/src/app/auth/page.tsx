'use client';

import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { 
  Eye, 
  EyeOff, 
  GraduationCap, 
  ArrowLeft, 
  AlertCircle, 
  CheckCircle2, 
  Loader2 
} from 'lucide-react';

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') === 'login' ? 'login' : 'signup';
  const redirectPath = searchParams.get('redirect') || '/dashboard';

  const [mode, setMode] = useState<'signup' | 'login' | 'forgot'>(initialTab);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form Fields
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Verification state
  const [isVerificationPending, setIsVerificationPending] = useState(false);

  const supabase = createClientComponentClient();

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'login') setMode('login');
    else if (tabParam === 'signup') setMode('signup');

    const urlError = searchParams.get('error');
    if (urlError) {
      setError(decodeURIComponent(urlError));
    }

    // Check if user is already logged in or returned from OAuth
    const checkExistingSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_complete')
          .eq('id', session.user.id)
          .maybeSingle();

        if (!profile || profile.is_complete !== true) {
          router.push('/profile-setup');
        } else {
          router.push(redirectPath);
        }
      }
    };

    checkExistingSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user && (event === 'SIGNED_IN' || event === 'USER_UPDATED')) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_complete')
          .eq('id', session.user.id)
          .maybeSingle();

        if (!profile || profile.is_complete !== true) {
          router.push('/profile-setup');
        } else {
          router.push(redirectPath);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [searchParams, router, supabase, redirectPath]);

  const handleGoogleAuth = async () => {
    setGoogleLoading(true);
    setError(null);
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            prompt: 'select_account',
          },
        },
      });
      if (oauthError) throw oauthError;
    } catch (err: any) {
      setError(err.message || 'Google authentication failed');
      setGoogleLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      if (mode === 'signup') {
        if (!firstName.trim() || !lastName.trim()) {
          throw new Error('Please enter both your first and last name.');
        }
        if (password.length < 6) {
          throw new Error('Password must be at least 6 characters long.');
        }
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match. Please verify your confirm password.');
        }

        const fullName = `${firstName.trim()} ${lastName.trim()}`;
        const callbackUrl = `${window.location.origin}/auth/callback?next=/profile-setup`;

        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: callbackUrl,
          },
        });

        if (signUpError) {
          if (signUpError.message.includes('already registered')) {
            throw new Error('An account with this email already exists. Please log in.');
          }
          throw signUpError;
        }

        // If email confirmation is required by Supabase
        if (data.user && !data.session) {
          setIsVerificationPending(true);
        } else {
          router.refresh();
          router.push('/profile-setup');
        }
      } else if (mode === 'login') {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (signInError) {
          if (signInError.message.includes('Invalid login credentials')) {
            throw new Error('No account found with this email, or incorrect password. If you are new, please sign up first!');
          }
          throw signInError;
        }

        if (data?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('is_complete')
            .eq('id', data.user.id)
            .maybeSingle();

          router.refresh();
          if (!profile || !profile.is_complete) {
            router.push('/profile-setup');
          } else {
            router.push(redirectPath);
          }
        }
      } else if (mode === 'forgot') {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          redirectTo: `${window.location.origin}/auth/reset-password`,
        });

        if (resetError) throw resetError;
        setSuccessMessage('Password reset link sent! Please check your email inbox.');
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#141314] text-[#F3F2F0] flex flex-col md:flex-row selection:bg-[#FF553E] selection:text-white">
      {/* LEFT COLUMN: FORM */}
      <div className="w-full md:w-1/2 min-h-screen p-8 sm:p-12 md:p-16 flex flex-col justify-between z-10 max-w-xl mx-auto md:max-w-none">
        {/* Brand Header */}
        <div>
          <Link href="/" className="inline-flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#FF553E] to-[#FFA07A] flex items-center justify-center text-white shadow-sm">
              <GraduationCap size={18} />
            </div>
            <span className="text-xl font-bold tracking-tight text-white group-hover:text-stone-200 transition-colors">
              EduLink
            </span>
            <span className="text-[10px] font-semibold text-[#FF553E] bg-[#FF553E]/10 px-2 py-0.5 rounded-full ml-1 border border-[#FF553E]/20">
              SRM KTR
            </span>
          </Link>
        </div>

        {/* Auth Body */}
        <div className="py-8 my-auto w-full max-w-md mx-auto">
          {isVerificationPending ? (
            <div className="bg-[#1C1B1C] border border-stone-800 rounded-2xl p-8 text-center space-y-4 animate-fade-in">
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 size={30} />
              </div>
              <h2 className="text-2xl font-serif text-white">Check your email</h2>
              <p className="text-xs text-stone-400 leading-relaxed">
                We sent a verification link to <span className="font-semibold text-white">{email}</span>. Click the link in your email to activate your account and start setting up your SRM student profile.
              </p>
              <button
                onClick={() => {
                  setIsVerificationPending(false);
                  setMode('login');
                }}
                className="w-full py-3 rounded-full bg-[#FF553E] text-white text-sm font-semibold hover:bg-[#E04732] transition-colors"
              >
                Go to Log In
              </button>
            </div>
          ) : (
            <>
              {/* Heading */}
              <div className="mb-8">
                <h1 className="text-3xl sm:text-4xl font-serif font-normal text-white mb-2">
                  {mode === 'signup' && 'Create Account'}
                  {mode === 'login' && 'Welcome Back'}
                  {mode === 'forgot' && 'Reset Password'}
                </h1>

                <p className="text-xs sm:text-sm text-stone-400">
                  {mode === 'signup' && (
                    <>
                      Already have an account?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setMode('login');
                          setError(null);
                        }}
                        className="text-[#FF553E] hover:underline font-semibold"
                      >
                        Log in
                      </button>
                    </>
                  )}
                  {mode === 'login' && (
                    <>
                      Don&apos;t have an account?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setMode('signup');
                          setError(null);
                        }}
                        className="text-[#FF553E] hover:underline font-semibold"
                      >
                        Sign up
                      </button>
                    </>
                  )}
                  {mode === 'forgot' && (
                    <>
                      Remember your password?{' '}
                      <button
                        type="button"
                        onClick={() => {
                          setMode('login');
                          setError(null);
                        }}
                        className="text-[#FF553E] hover:underline font-semibold"
                      >
                        Log in
                      </button>
                    </>
                  )}
                </p>
              </div>

              {/* Google OAuth Button */}
              {mode !== 'forgot' && (
                <>
                  <button
                    type="button"
                    onClick={handleGoogleAuth}
                    disabled={googleLoading || loading}
                    className="w-full py-3 px-4 rounded-xl bg-white hover:bg-stone-100 text-stone-900 text-sm font-semibold flex items-center justify-center gap-3 transition-all shadow-sm disabled:opacity-50"
                  >
                    {googleLoading ? (
                      <Loader2 size={18} className="animate-spin text-stone-900" />
                    ) : (
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
                    )}
                    <span>{mode === 'signup' ? 'Sign up with Google' : 'Sign in with Google'}</span>
                  </button>

                  {/* Divider */}
                  <div className="relative my-6 flex items-center justify-center">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-stone-800" />
                    </div>
                    <span className="relative bg-[#141314] px-4 text-xs font-medium text-stone-500">
                      Or
                    </span>
                  </div>
                </>
              )}

              {/* Status & Error Messages */}
              {error && (
                <div className="mb-5 p-3.5 bg-red-950/30 border border-red-800/80 rounded-xl flex items-start gap-2.5 text-xs text-red-300 animate-fade-in">
                  <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <span>{error}</span>
                    {error.includes('No account found') && (
                      <button
                        type="button"
                        onClick={() => {
                          setMode('signup');
                          setError(null);
                        }}
                        className="block mt-1 font-semibold text-[#FF553E] underline"
                      >
                        Click here to create a new account
                      </button>
                    )}
                  </div>
                </div>
              )}

              {successMessage && (
                <div className="mb-5 p-3.5 bg-emerald-950/30 border border-emerald-800/80 rounded-xl flex items-center gap-2.5 text-xs text-emerald-300">
                  <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              {/* Main Form */}
              <form onSubmit={handleEmailAuth} className="space-y-4">
                {/* First Name & Last Name (Signup only) */}
                {mode === 'signup' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="First name"
                        required
                        className="w-full px-4 py-3 rounded-xl bg-[#201F21] border border-stone-800 focus:border-[#FF553E] focus:outline-none text-sm text-white placeholder-stone-500 transition-colors"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Last name"
                        required
                        className="w-full px-4 py-3 rounded-xl bg-[#201F21] border border-stone-800 focus:border-[#FF553E] focus:outline-none text-sm text-white placeholder-stone-500 transition-colors"
                      />
                    </div>
                  </div>
                )}

                {/* Email Address */}
                <div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email address"
                    required
                    className="w-full px-4 py-3 rounded-xl bg-[#201F21] border border-stone-800 focus:border-[#FF553E] focus:outline-none text-sm text-white placeholder-stone-500 transition-colors"
                  />
                </div>

                {/* Password Fields */}
                {mode !== 'forgot' && (
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={mode === 'signup' ? 'Create password (min 6 characters)' : 'Password'}
                      required
                      className="w-full px-4 py-3 pr-11 rounded-xl bg-[#201F21] border border-stone-800 focus:border-[#FF553E] focus:outline-none text-sm text-white placeholder-stone-500 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                )}

                {/* Confirm Password (Signup only) */}
                {mode === 'signup' && (
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm password"
                      required
                      className="w-full px-4 py-3 pr-11 rounded-xl bg-[#201F21] border border-stone-800 focus:border-[#FF553E] focus:outline-none text-sm text-white placeholder-stone-500 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-300"
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                )}

                {/* Forgot Password link (Login only) */}
                {mode === 'login' && (
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot');
                        setError(null);
                      }}
                      className="text-xs text-[#FF553E] hover:underline font-medium"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-full bg-[#FF553E] hover:bg-[#E04732] text-white text-sm font-semibold transition-all shadow-md shadow-[#FF553E]/20 hover:scale-[1.01] disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
                >
                  {loading && <Loader2 size={16} className="animate-spin" />}
                  <span>
                    {mode === 'signup' && 'Create Account'}
                    {mode === 'login' && 'Log In'}
                    {mode === 'forgot' && 'Send Reset Link'}
                  </span>
                </button>
              </form>

              {/* Disclaimer */}
              {mode === 'signup' && (
                <p className="mt-5 text-[11px] text-stone-500 text-center leading-relaxed">
                  By creating an account, I agree with EduLink&apos;s{' '}
                  <span className="text-[#FF553E] cursor-pointer hover:underline">Privacy Policy</span> and{' '}
                  <span className="text-[#FF553E] cursor-pointer hover:underline">Terms of Service</span>.
                </p>
              )}
            </>
          )}
        </div>

        {/* Bottom helper */}
        <div className="pt-4 text-xs text-stone-600 flex items-center justify-between">
          <span>SRMIST KTR Campus Platform</span>
          <Link href="/" className="hover:text-stone-400 transition-colors flex items-center gap-1">
            <ArrowLeft size={13} /> Back to Home
          </Link>
        </div>
      </div>

      {/* RIGHT COLUMN: AESTHETIC RETRO VECTOR ILLUSTRATION (Matching User's Reference Screenshot) */}
      <div className="hidden md:flex w-1/2 min-h-screen bg-[#181719] border-l border-stone-800/60 p-12 flex-col items-center justify-center relative overflow-hidden select-none">
        {/* Subtle background glow */}
        <div className="absolute w-96 h-96 bg-[#FF553E]/5 rounded-full blur-[100px] pointer-events-none" />

        {/* Hand-drawn retro computer SVG Illustration */}
        <div className="relative w-full max-w-lg flex flex-col items-center">
          <svg
            className="w-full max-w-md h-auto"
            viewBox="0 0 500 450"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Flying cuckoo clock 1 */}
            <g className="animate-pulse" style={{ animationDuration: '4s' }}>
              <path
                d="M320 120 L340 90 L360 120 Z"
                stroke="#E2E0D8"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <rect
                x="325"
                y="120"
                width="30"
                height="35"
                rx="3"
                stroke="#E2E0D8"
                strokeWidth="2.5"
              />
              <circle cx="340" cy="135" r="5" stroke="#E2E0D8" strokeWidth="2" />
              {/* Clock wings */}
              <path
                d="M325 125 C310 115 310 135 315 140"
                stroke="#E2E0D8"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M355 125 C370 115 370 135 365 140"
                stroke="#E2E0D8"
                strokeWidth="2"
                strokeLinecap="round"
              />
              {/* Pendulum */}
              <line x1="340" y1="155" x2="340" y2="175" stroke="#E2E0D8" strokeWidth="2" />
              <circle cx="340" cy="177" r="3.5" fill="#FF553E" />
            </g>

            {/* Flying cuckoo clock 2 (left) */}
            <g className="animate-pulse" style={{ animationDuration: '5s' }}>
              <path
                d="M170 200 L185 175 L200 200 Z"
                stroke="#E2E0D8"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <rect
                x="173"
                y="200"
                width="24"
                height="30"
                rx="3"
                stroke="#E2E0D8"
                strokeWidth="2.5"
              />
              <circle cx="185" cy="212" r="4" stroke="#E2E0D8" strokeWidth="1.8" />
              {/* Wings */}
              <path
                d="M173 205 C160 195 160 215 165 220"
                stroke="#E2E0D8"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M197 205 C210 195 210 215 205 220"
                stroke="#E2E0D8"
                strokeWidth="2"
                strokeLinecap="round"
              />
              {/* Pendulum */}
              <line x1="185" y1="230" x2="185" y2="248" stroke="#E2E0D8" strokeWidth="2" />
              <circle cx="185" cy="250" r="3" fill="#FBBF24" />
            </g>

            {/* The Palette / Desk Base */}
            <path
              d="M140 330 C130 360 180 390 280 395 C380 400 450 365 420 335 C390 305 320 315 240 310 C160 305 150 310 140 330 Z"
              stroke="#D4D2C9"
              strokeWidth="3"
              fill="#1F1E20"
              strokeLinejoin="round"
            />
            {/* Color wells on the palette (as seen in screenshot) */}
            <ellipse cx="190" cy="340" rx="14" ry="7" fill="#FCA5A5" opacity="0.9" />
            <ellipse cx="230" cy="355" rx="16" ry="8" fill="#FDE047" opacity="0.9" />
            <ellipse cx="280" cy="365" rx="16" ry="8" fill="#34D399" opacity="0.9" />
            <ellipse cx="335" cy="365" rx="16" ry="8" fill="#FDBA74" opacity="0.9" />

            {/* CPU Unit (Box beneath monitor) */}
            <path
              d="M230 305 L370 305 L385 270 L245 270 Z"
              stroke="#E2E0D8"
              strokeWidth="3"
              fill="#201F21"
              strokeLinejoin="round"
            />
            <rect
              x="230"
              y="305"
              width="140"
              height="35"
              rx="4"
              stroke="#E2E0D8"
              strokeWidth="3"
              fill="#181719"
            />
            {/* Floppy drive slot and power dot */}
            <circle cx="245" cy="322" r="3.5" fill="#FF553E" />
            <line x1="265" y1="322" x2="310" y2="322" stroke="#E2E0D8" strokeWidth="2.5" strokeLinecap="round" />

            {/* Retro CRT Monitor */}
            {/* Outer case */}
            <rect
              x="240"
              y="190"
              width="110"
              height="80"
              rx="8"
              stroke="#E2E0D8"
              strokeWidth="3.5"
              fill="#181719"
            />
            {/* Bevel 3D Depth */}
            <path
              d="M350 190 L370 200 L370 270 L350 270 Z"
              stroke="#E2E0D8"
              strokeWidth="3"
              fill="#222123"
              strokeLinejoin="round"
            />
            <path
              d="M240 190 L260 180 L370 180 L350 190 Z"
              stroke="#E2E0D8"
              strokeWidth="3"
              fill="#222123"
              strokeLinejoin="round"
            />

            {/* Inner CRT Screen */}
            <rect
              x="250"
              y="200"
              width="90"
              height="60"
              rx="5"
              stroke="#D4D2C9"
              strokeWidth="2"
              fill="#0F0E10"
            />

            {/* Code / Terminal Lines on Screen */}
            <line x1="260" y1="215" x2="285" y2="215" stroke="#FF553E" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="260" y1="225" x2="305" y2="225" stroke="#34D399" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="260" y1="235" x2="275" y2="235" stroke="#60A5FA" strokeWidth="2" strokeLinecap="round" />
            <line x1="260" y1="245" x2="315" y2="245" stroke="#D4D2C9" strokeWidth="2" strokeLinecap="round" />
          </svg>

          {/* Inspirational Tagline */}
          <div className="text-center mt-6">
            <h3 className="font-serif text-lg text-white font-normal">
              Study smarter, together.
            </h3>
            <p className="text-xs text-stone-400 mt-1 max-w-xs">
              Every course, every semester, every solved doubt — tailored for SRM KTR students.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#141314] flex items-center justify-center">
          <Loader2 className="animate-spin text-[#FF553E]" size={32} />
        </div>
      }
    >
      <AuthContent />
    </Suspense>
  );
}
