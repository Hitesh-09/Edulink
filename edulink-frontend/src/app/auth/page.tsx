'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function AuthPage() {
  const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const router = useRouter();
  const supabase = createClientComponentClient();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (activeTab === 'login') {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
        router.push('/dashboard');
      } else {
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match');
        }
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
          },
        });
        if (signUpError) throw signUpError;
        router.push('/profile-setup');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during authentication');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md bg-surface p-8 rounded-2xl shadow-sm border border-border">
        
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-primary-dark tracking-tight">Edulink</h1>
          <p className="text-sm text-gray-500 mt-2">Your student study collaboration platform</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border mb-6">
          <button
            type="button"
            className={`flex-1 pb-3 text-sm font-medium transition-colors ${
              activeTab === 'login'
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => {
              setActiveTab('login');
              setError(null);
            }}
          >
            Log In
          </button>
          <button
            type="button"
            className={`flex-1 pb-3 text-sm font-medium transition-colors ${
              activeTab === 'signup'
                ? 'text-primary border-b-2 border-primary'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => {
              setActiveTab('signup');
              setError(null);
            }}
          >
            Sign Up
          </button>
        </div>

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
            label="Email"
            type="email"
            placeholder="you@university.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          {activeTab === 'signup' && (
            <Input
              label="Confirm Password"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          )}

          {error && (
            <div className="text-sm text-error bg-red-50 p-3 rounded-lg border border-red-100">
              {error}
            </div>
          )}

          {activeTab === 'login' && (
            <div className="flex justify-end mt-2">
              <a href="#" className="text-xs text-primary hover:underline">
                Forgot password?
              </a>
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full mt-6" 
            size="lg"
            isLoading={isLoading}
          >
            {activeTab === 'login' ? 'Sign In' : 'Create Account'}
          </Button>

        </form>
      </div>
    </div>
  );
}
