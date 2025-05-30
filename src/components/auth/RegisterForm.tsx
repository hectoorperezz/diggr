'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabase } from '@/components/providers/SupabaseProvider';
import { toast } from 'react-hot-toast';

export function RegisterForm() {
  const router = useRouter();
  const { signUp, signIn } = useSupabase();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
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
        
        <div className="w-full space-y-2">
          <label className="block text-sm font-medium">
            Confirm Password
          </label>
          <input
            type="password"
            className="bg-[#181818] border border-[#A3A3A3]/30 rounded-2xl px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-[#1DB954] focus:border-transparent"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm your password"
            required
          />
        </div>
        
        {error && (
          <div className="text-red-500 text-sm">{error}</div>
        )}
        
        {successMessage && (
          <div className="text-green-500 text-sm">{successMessage}</div>
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
              'Sign Up'
            )}
          </button>
        </div>
        
        <div className="text-center text-[#A3A3A3]">
          <p>
            Already have an account?{' '}
            <a href="/auth/login" className="text-[#1DB954] hover:underline">
              Log in
            </a>
          </p>
        </div>
      </form>
    </div>
  );
} 