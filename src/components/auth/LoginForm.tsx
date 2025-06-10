'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSupabase } from '@/components/providers/SupabaseProvider';
import { toast } from 'react-hot-toast';

// Separate component to use searchParams
function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signIn, signInWithGoogle, signInWithSpotify, session } = useSupabase();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isSpotifyLoading, setIsSpotifyLoading] = useState(false);
  
  // Check for error parameter in URL
  useEffect(() => {
    if (!searchParams) return;
    
    // Check for info messages first
    const infoParam = searchParams.get('info');
    if (infoParam) {
      setInfoMessage(decodeURIComponent(infoParam));
      setError(null);
      return;
    }
    
    const errorParam = searchParams.get('error');
    if (errorParam) {
      // Check if this is a verification message for Spotify
      if (errorParam.includes('Unverified email with spotify') || 
          errorParam.includes('provider_email_needs_verification')) {
        // Extract just the part about the confirmation email being sent
        let message = errorParam;
        if (errorParam.includes('A confirmation email has been sent')) {
          message = 'Se ha enviado un correo de confirmación a tu email de Spotify. Por favor verifica tu email para continuar.';
        } else {
          message = 'Por favor verifica tu correo electrónico de Spotify para continuar con el inicio de sesión.';
        }
        setInfoMessage(message);
        setError(null);
      } else {
        setError(decodeURIComponent(errorParam));
        setInfoMessage(null);
      }
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
      // Verificar si la cuenta está eliminada
      const checkResponse = await fetch('/api/auth/login/check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      const checkResult = await checkResponse.json();
      
      if (checkResult.error) {
        throw new Error(checkResult.error);
      }
      
      if (!checkResult.allowed) {
        setError(checkResult.message);
        setIsLoading(false);
        return;
      }
      
      // Continuar con el inicio de sesión
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

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setError(null);

    try {
      const { error } = await signInWithGoogle();
      if (error) {
        console.error('Error signing in with Google:', error);
        setError('Error connecting with Google. Please try again.');
      }
    } catch (err) {
      console.error('Unexpected error during Google sign in:', err);
      setError('An unexpected error occurred');
    } finally {
      // Note: Google redirects, so this may not be necessary
      // but we include it to handle local errors
      setIsGoogleLoading(false);
    }
  };

  const handleSpotifySignIn = async () => {
    setIsSpotifyLoading(true);
    setError(null);

    try {
      const { error } = await signInWithSpotify();
      if (error) {
        console.error('Error signing in with Spotify:', error);
        setError('Error connecting with Spotify. Please try again.');
      }
    } catch (err) {
      console.error('Unexpected error during Spotify sign in:', err);
      setError('An unexpected error occurred');
    } finally {
      // Note: Spotify redirects, so this may not be necessary
      // but we include it to handle local errors
      setIsSpotifyLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-[#121212]/60 backdrop-blur-xl rounded-2xl p-8 shadow-xl border border-white/5">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-semibold text-white mb-1">Welcome back</h2>
            <p className="text-[#A3A3A3]">Sign in to continue your music journey</p>
          </div>

          <div className="w-full space-y-2">
            <label className="block text-sm font-medium text-white">
              Email
            </label>
            <input
              type="email"
              className="bg-[#1E1E1E] border border-[#333333] rounded-xl px-4 py-3 w-full 
                        text-white focus:outline-none focus:ring-2 focus:ring-[#1DB954] focus:border-transparent
                        transition-all duration-200"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              autoComplete="email"
              required
            />
          </div>
          
          <div className="w-full space-y-2">
            <div className="flex justify-between items-center">
              <label className="block text-sm font-medium text-white">
                Password
              </label>
              <a href="/auth/forgot-password" className="text-xs text-[#1DB954] hover:text-[#1DB954]/90 transition-colors">
                Forgot password?
              </a>
            </div>
            <input
              type="password"
              className="bg-[#1E1E1E] border border-[#333333] rounded-xl px-4 py-3 w-full 
                        text-white focus:outline-none focus:ring-2 focus:ring-[#1DB954] focus:border-transparent
                        transition-all duration-200"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
              required
            />
          </div>
          
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm">
              {error}
            </div>
          )}
          
          {infoMessage && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-green-400 text-sm">
              {infoMessage}
            </div>
          )}
          
          <div>
            <button
              type="submit"
              className="w-full px-4 py-3 rounded-xl font-medium transition-all duration-200 
                        bg-[#1DB954] text-white hover:bg-[#1DB954]/90 active:scale-98 
                        disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </div>
              ) : (
                'Sign in'
              )}
            </button>
          </div>

          <div className="relative flex items-center justify-center my-4">
            <div className="absolute border-t border-[#333333] w-full"></div>
            <div className="relative bg-[#121212] px-4 text-sm text-[#A3A3A3]">or</div>
          </div>

          {/* Google Sign In Button */}
          <div>
            <button
              type="button" 
              onClick={handleGoogleSignIn}
              className="w-full px-4 py-3 rounded-xl font-medium transition-all duration-200 
                        bg-[#1E1E1E] text-white border border-[#333333] hover:bg-[#252525] 
                        flex items-center justify-center space-x-2 
                        disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isGoogleLoading}
            >
              {isGoogleLoading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Connecting...
                </div>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19.8055 10.2275C19.8055 9.51764 19.7516 8.83569 19.6569 8.17065H10.2002V11.9179H15.6014C15.3601 13.1179 14.6569 14.1333 13.5878 14.7846V17.2311H16.8028C18.6987 15.5512 19.8055 13.0836 19.8055 10.2275Z" fill="#4285F4"/>
                    <path d="M10.2002 20.0008C12.897 20.0008 15.1716 19.1055 16.8028 17.2316L13.5878 14.7851C12.6919 15.3954 11.5359 15.7544 10.2002 15.7544C7.5433 15.7544 5.30302 14.0082 4.52406 11.6159H1.20703V14.1447C2.82875 17.6464 6.3074 20.0008 10.2002 20.0008Z" fill="#34A853"/>
                    <path d="M4.52395 11.6163C4.32395 11.0059 4.2101 10.3546 4.2101 9.68726C4.2101 9.01992 4.32395 8.36865 4.52395 7.75826V5.22949H1.20693C0.556222 6.55723 0.199219 8.07389 0.199219 9.68726C0.199219 11.3006 0.556222 12.8173 1.20693 14.145L4.52395 11.6163Z" fill="#FBBC05"/>
                    <path d="M10.2002 3.62086C11.6821 3.62086 13.0179 4.12497 14.0741 5.13059L16.9203 2.28438C15.1663 0.641849 12.8917 -0.253906 10.2002 -0.253906C6.3074 -0.253906 2.82875 2.10048 1.20703 5.60226L4.52406 8.13103C5.30302 5.73871 7.5433 3.62086 10.2002 3.62086Z" fill="#EA4335"/>
                  </svg>
                  <span className="ml-2">Continue with Google</span>
                </>
              )}
            </button>
          </div>
          
          {/* Spotify Sign In Button */}
          <div>
            <button
              type="button" 
              onClick={handleSpotifySignIn}
              className="w-full px-4 py-3 rounded-xl font-medium transition-all duration-200 
                        bg-[#1E1E1E] text-white border border-[#333333] hover:bg-[#252525] 
                        flex items-center justify-center space-x-2 
                        disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSpotifyLoading}
            >
              {isSpotifyLoading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Connecting...
                </div>
              ) : (
                <>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
                    <path d="M12 0C5.4 0 0 5.4 0 12C0 18.6 5.4 24 12 24C18.6 24 24 18.6 24 12C24 5.4 18.66 0 12 0ZM17.521 17.34C17.281 17.699 16.861 17.82 16.5 17.58C13.68 15.84 10.14 15.479 5.939 16.439C5.521 16.56 5.16 16.26 5.04 15.9C4.92 15.479 5.22 15.12 5.58 15C10.14 13.979 14.04 14.4 17.22 16.32C17.64 16.5 17.699 16.979 17.521 17.34ZM18.961 14.04C18.66 14.46 18.12 14.64 17.7 14.34C14.46 12.36 9.54 11.76 5.76 12.9C5.281 13.08 4.74 12.84 4.56 12.36C4.38 11.88 4.62 11.339 5.1 11.16C9.48 9.9 14.94 10.56 18.66 12.84C19.02 13.08 19.2 13.68 18.961 14.04ZM19.081 10.68C15.24 8.4 8.82 8.16 5.16 9.301C4.56 9.48 3.96 9.12 3.78 8.58C3.6 7.979 3.96 7.38 4.5 7.2C8.76 5.88 15.78 6.18 20.22 8.82C20.76 9.12 20.94 9.84 20.64 10.38C20.34 10.86 19.62 11.04 19.081 10.68Z" fill="#1DB954"/>
                  </svg>
                  <span className="ml-2">Continue with Spotify</span>
                </>
              )}
            </button>
          </div>
          
          <div className="text-center text-[#A3A3A3] mt-6">
            <p>
              Don&apos;t have an account?{' '}
              <a href="/auth/register" className="text-[#1DB954] hover:text-[#1DB954]/90 hover:underline transition-colors">
                Sign up
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}

// Loading fallback for Suspense
function LoginFormFallback() {
  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-[#121212]/60 backdrop-blur-xl rounded-2xl p-8 shadow-xl border border-white/5">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-700/50 rounded-lg w-3/4 mx-auto"></div>
          <div className="h-4 bg-gray-700/50 rounded w-1/2 mx-auto"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-700/50 rounded w-16"></div>
            <div className="h-12 bg-gray-700/50 rounded-xl"></div>
          </div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-700/50 rounded w-16"></div>
            <div className="h-12 bg-gray-700/50 rounded-xl"></div>
          </div>
          <div className="h-12 bg-gray-700/50 rounded-xl"></div>
          <div className="h-12 bg-gray-700/50 rounded-xl"></div>
        </div>
      </div>
    </div>
  );
}

// Main export that wraps the content in Suspense
export function LoginForm() {
  return (
    <Suspense fallback={<LoginFormFallback />}>
      <LoginFormContent />
    </Suspense>
  );
} 