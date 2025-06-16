'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { createClient } from '@/lib/supabase/client';

export default function VerifyPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [email, setEmail] = useState<string>('');
  const [provider, setProvider] = useState<string>('');
  const [isResendingEmail, setIsResendingEmail] = useState(false);
  const [countdown, setCountdown] = useState(0);
  
  useEffect(() => {
    // Get email and provider from URL params
    const emailParam = searchParams?.get('email');
    const providerParam = searchParams?.get('provider') || 'email';
    
    if (emailParam) {
      setEmail(emailParam);
    }
    
    // Log for debugging
    console.log('Verify page params:', { 
      email: emailParam, 
      provider: providerParam,
      searchParams: Object.fromEntries(searchParams?.entries() || [])
    });
    
    setProvider(providerParam);
  }, [searchParams]);
  
  // Countdown timer for resend button
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);
  
  const handleResendEmail = async () => {
    if (!email || countdown > 0) return;
    
    setIsResendingEmail(true);
    
    try {
      const supabase = createClient();
      
      let result;
      if (provider === 'spotify') {
        // For Spotify, we'll re-initiate the OAuth flow
        result = await supabase.auth.signInWithOAuth({
          provider: 'spotify',
          options: {
            redirectTo: `${window.location.origin}/auth/callback?provider=spotify`,
            scopes: 'user-read-email playlist-modify-public playlist-modify-private playlist-read-private playlist-read-collaborative user-read-private'
          }
        });
      } else {
        // For email, we'll resend the verification email
        result = await supabase.auth.resend({
          type: 'signup',
          email,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?provider=email`,
          }
        });
      }
      
      if (result.error) {
        throw result.error;
      }
      
      toast.success('Verification email sent! Please check your inbox');
      setCountdown(60); // Set cooldown timer for 60 seconds
    } catch (error: any) {
      console.error('Error resending email:', error);
      toast.error(error.message || 'Failed to resend verification email');
    } finally {
      setIsResendingEmail(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-black">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <img src="/images/diggr.png" alt="Diggr" className="h-16 mx-auto" />
          </Link>
        </div>
        
        <div className="bg-[#181818] rounded-2xl shadow-md p-8 border border-white/10 text-center">
          <div className="w-16 h-16 bg-[#1DB954]/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-[#1DB954]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          
          <h1 className="text-2xl font-bold mb-4">Check your email</h1>
          
          {provider === 'spotify' ? (
            <>
              <div className="flex items-center justify-center mb-6">
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
                  <path d="M12 0C5.4 0 0 5.4 0 12C0 18.6 5.4 24 12 24C18.6 24 24 18.6 24 12C24 5.4 18.66 0 12 0ZM17.521 17.34C17.281 17.699 16.861 17.82 16.5 17.58C13.68 15.84 10.14 15.479 5.939 16.439C5.521 16.56 5.16 16.26 5.04 15.9C4.92 15.479 5.22 15.12 5.58 15C10.14 13.979 14.04 14.4 17.22 16.32C17.64 16.5 17.699 16.979 17.521 17.34ZM18.961 14.04C18.66 14.46 18.12 14.64 17.7 14.34C14.46 12.36 9.54 11.76 5.76 12.9C5.281 13.08 4.74 12.84 4.56 12.36C4.38 11.88 4.62 11.339 5.1 11.16C9.48 9.9 14.94 10.56 18.66 12.84C19.02 13.08 19.2 13.68 18.961 14.04ZM19.081 10.68C15.24 8.4 8.82 8.16 5.16 9.301C4.56 9.48 3.96 9.12 3.78 8.58C3.6 7.979 3.96 7.38 4.5 7.2C8.76 5.88 15.78 6.18 20.22 8.82C20.76 9.12 20.94 9.84 20.64 10.38C20.34 10.86 19.62 11.04 19.081 10.68Z" fill="#1DB954"/>
                </svg>
                <span className="text-white font-semibold">Spotify Email Verification</span>
              </div>
              <p className="text-[#A3A3A3] mb-6">
                We've sent a verification link to your Spotify email address
                {email ? <span className="text-white font-medium"> ({email})</span> : ''}.
                <br /><br />
                Please check your inbox and click the link to verify your account.
              </p>
            </>
          ) : (
            <p className="text-[#A3A3A3] mb-6">
              We've sent a verification link to <span className="text-white font-medium">{email || 'your email address'}</span>. 
              Please check your inbox and click the link to verify your account.
            </p>
          )}
          
          <div className="mb-8">
            <button
              onClick={handleResendEmail}
              disabled={isResendingEmail || countdown > 0}
              className="px-4 py-2 rounded-lg bg-[#1DB954]/20 text-[#1DB954] hover:bg-[#1DB954]/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isResendingEmail ? 'Sending...' : 
               countdown > 0 ? `Resend in ${countdown}s` : 'Resend verification email'}
            </button>
          </div>
          
          <div className="pt-6 border-t border-white/10">
            <p className="text-sm text-[#A3A3A3] mb-4">
              Already verified? 
            </p>
            <Link href="/auth/login" className="text-[#1DB954] hover:underline">
              Sign in to your account
            </Link>
          </div>
        </div>
        
        <div className="mt-6 text-center">
          <Link href="/" className="text-[#A3A3A3] hover:text-white transition-colors">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
} 