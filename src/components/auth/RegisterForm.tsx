'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabase } from '@/components/providers/SupabaseProvider';
import { toast } from 'react-hot-toast';

export function RegisterForm() {
  const router = useRouter();
  const { signUp, signIn, signInWithGoogle } = useSupabase();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { error } = await signUp(email, password);
      
      if (error) {
        setError(error.message || 'An error occurred during sign up');
        return;
      }
      
      setSuccessMessage('Registration successful!');
      
      // For development - auto sign in
      console.log('Auto-signing in for development...');
      const signInResult = await signIn(email, password);
      
      if (signInResult.error) {
        console.error('Auto sign-in failed:', signInResult.error);
        // Fallback to redirect if auto sign-in fails
        setTimeout(() => {
          window.location.href = '/auth/login';
        }, 2000);
      }
      // The signIn function will redirect to dashboard with window.location
      
    } catch (err) {
      setError('An unexpected error occurred');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setIsGoogleLoading(true);
    setError(null);

    try {
      const { error } = await signInWithGoogle();
      if (error) {
        console.error('Error signing up with Google:', error);
        setError('Error connecting with Google. Please try again.');
      }
    } catch (err) {
      console.error('Unexpected error during Google sign up:', err);
      setError('An unexpected error occurred');
    } finally {
      // Google redirects, so this might not be reached
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-[#121212]/60 backdrop-blur-xl rounded-2xl p-8 shadow-xl border border-white/5">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-semibold text-white mb-1">Create your account</h2>
            <p className="text-[#A3A3A3]">Join Diggr and discover new music</p>
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
            <label className="block text-sm font-medium text-white">
              Password
            </label>
            <input
              type="password"
              className="bg-[#1E1E1E] border border-[#333333] rounded-xl px-4 py-3 w-full 
                        text-white focus:outline-none focus:ring-2 focus:ring-[#1DB954] focus:border-transparent
                        transition-all duration-200"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoComplete="new-password"
              required
            />
          </div>
          
          <div className="w-full space-y-2">
            <label className="block text-sm font-medium text-white">
              Confirm Password
            </label>
            <input
              type="password"
              className="bg-[#1E1E1E] border border-[#333333] rounded-xl px-4 py-3 w-full 
                        text-white focus:outline-none focus:ring-2 focus:ring-[#1DB954] focus:border-transparent
                        transition-all duration-200"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
              autoComplete="new-password"
              required
            />
          </div>
          
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-red-400 text-sm">
              {error}
            </div>
          )}
          
          {successMessage && (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-green-400 text-sm">
              {successMessage}
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
                  Creating account...
                </div>
              ) : (
                'Create account'
              )}
            </button>
          </div>

          <div className="relative flex items-center justify-center my-4">
            <div className="absolute border-t border-[#333333] w-full"></div>
            <div className="relative bg-[#121212] px-4 text-sm text-[#A3A3A3]">or</div>
          </div>

          {/* Botón de registro con Google */}
          <div>
            <button
              type="button" 
              onClick={handleGoogleSignUp}
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
          
          <div className="text-center text-[#A3A3A3] mt-6">
            <p>
              Already have an account?{' '}
              <a href="/auth/login" className="text-[#1DB954] hover:text-[#1DB954]/90 hover:underline transition-colors">
                Sign in
              </a>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
} 