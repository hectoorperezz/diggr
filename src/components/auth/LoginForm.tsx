'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSupabase } from '@/components/providers/SupabaseProvider';
import { toast } from 'react-hot-toast';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn, session } = useSupabase();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Check for error parameter in URL
  useEffect(() => {
    const errorParam = searchParams.get('error');
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
    }
    
    // Check for redirectedFrom parameter
    const redirectedFrom = searchParams.get('redirectedFrom');
    if (redirectedFrom) {
      console.log('Redirected from:', redirectedFrom);
    }
  }, [searchParams]);
  
  // Redirect if already logged in
  useEffect(() => {
    if (session) {
      console.log('Already logged in, redirecting to dashboard');
      router.push('/dashboard');
    }
  }, [session, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Submitting login form for:', email);
      const { error } = await signIn(email, password);
      
      if (error) {
        console.log('Login error:', error);
        setError(error.message || 'An error occurred during sign in');
        return;
      }
      
      // The signIn function in SupabaseProvider handles redirection
      console.log('Login successful, awaiting redirection...');
    } catch (err) {
      console.error('Unexpected login error:', err);
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="w-full space-y-2">
          <label className="block text-sm font-medium">
            Email
          </label>
          <input
            type="email"
            className="bg-[#181818] border border-[#A3A3A3]/30 rounded-2xl px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-[#1DB954] focus:border-transparent"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
          />
        </div>
        
        <div className="w-full space-y-2">
          <label className="block text-sm font-medium">
            Password
          </label>
          <input
            type="password"
            className="bg-[#181818] border border-[#A3A3A3]/30 rounded-2xl px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-[#1DB954] focus:border-transparent"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
          />
        </div>
        
        {error && (
          <div className="text-red-500 text-sm">{error}</div>
        )}
        
        <div>
          <button
            type="submit"
            className="w-full px-4 py-2 rounded-2xl font-medium transition-all duration-200 bg-[#1DB954] text-[#F5F5F7] hover:opacity-90 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading...
              </div>
            ) : (
              'Log In'
            )}
          </button>
        </div>
        
        <div className="text-center text-[#A3A3A3]">
          <p>
            Don&apos;t have an account?{' '}
            <a href="/auth/register" className="text-[#1DB954] hover:underline">
              Sign up
            </a>
          </p>
        </div>
      </form>
    </div>
  );
} 