'use client';

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useSupabase } from '@/components/providers/SupabaseProvider';
import { toast } from 'react-hot-toast';
import { getSpotifyAuthURL } from '@/lib/spotify/auth';
import { supabase } from '@/lib/supabase/client';
import { motion } from 'framer-motion';
import Button from '@/components/ui/Button';

// Loading component for Suspense
function SettingsLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-[#121212]"></div>
        <div className="absolute top-0 -left-40 w-96 h-96 bg-gradient-to-br from-purple-500/20 via-[#1DB954]/20 to-transparent rounded-full filter blur-3xl opacity-50 animate-blob"></div>
        <div className="absolute top-0 -right-40 w-96 h-96 bg-gradient-to-br from-[#1DB954]/20 via-purple-500/20 to-transparent rounded-full filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
      </div>
      
      <motion.div 
        className="flex flex-col items-center space-y-4"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <svg className="animate-spin h-12 w-12 text-[#1DB954]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-[#A3A3A3] text-lg">Loading settings...</p>
      </motion.div>
    </div>
  );
}

// Main content component that uses useSearchParams
function SettingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, userProfile, session, isLoading, refreshSession } = useSupabase();
  const [isClient, setIsClient] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [spotifyStatus, setSpotifyStatus] = useState<boolean | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [subscriptionData, setSubscriptionData] = useState<any>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isLoading && !session && isClient) {
      router.push('/auth/login');
    }
  }, [isLoading, session, router, isClient]);

  // Load data when component mounts
  useEffect(() => {
    if (!isClient) return;
    
    // Force refresh session when page loads to ensure we have latest user data
    if (session && user) {
      console.log('Settings page loaded, refreshing session data...');
      refreshSession();
    }
  }, [isClient, session, user, refreshSession]);

  // Fetch subscription data
  useEffect(() => {
    async function fetchSubscriptionData() {
      if (!user || !isClient) return;
      
      try {
        console.log('Settings: Fetching subscription data');
        const timestamp = new Date().getTime();
        const response = await fetch(`/api/user/subscription?t=${timestamp}`, {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('Settings: Subscription data received:', data);
          setSubscriptionData(data);
        }
      } catch (error) {
        console.error('Error fetching subscription data in settings:', error);
      }
    }
    
    // Only fetch once on mount, not on every re-render where user might be the same
    // but treated as a new reference
    const controller = new AbortController();
    fetchSubscriptionData();
    return () => controller.abort();
  }, [isClient]); // Only depend on isClient, not user which can cause re-renders

  // Determine Spotify connection status from userProfile or database
  const determineSpotifyStatus = useCallback(async () => {
    // Skip if not client-side, already loading status, or no user ID
    if (!isClient || statusLoading || !user?.id) {
      return;
    }

    setStatusLoading(true);
    console.log('SettingsPage: Determining Spotify connection status...');
    
    try {
      // First try to get status from userProfile (faster)
      if (userProfile && typeof userProfile.spotify_connected === 'boolean') {
        const isConnected = !!userProfile.spotify_connected;
        console.log('SettingsPage: Using status from userProfile:', isConnected);
        setSpotifyStatus(isConnected);
        setStatusLoading(false);
        return;
      }
      
      // Alternative check based on refresh token if boolean flag is not defined
      if (userProfile && userProfile.spotify_refresh_token) {
        console.log('SettingsPage: Using refresh token as indicator, setting status to connected');
        setSpotifyStatus(true);
        setStatusLoading(false);
        return;
      }
      
      // Fallback to database query if no userProfile or spotify_connected is undefined
      console.log('SettingsPage: No userProfile status, checking database...');
      const { data, error } = await supabase
        .from('users')
        .select('spotify_connected, spotify_refresh_token')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching Spotify status from DB:', error);
        // Default to false if we can't determine status
        setSpotifyStatus(false);
        toast.error("Could not verify Spotify status. Assuming disconnected.");
      } else {
        // Check both the boolean flag and the presence of a refresh token
        const isConnected = !!data.spotify_connected || !!data.spotify_refresh_token;
        setSpotifyStatus(isConnected);
        console.log('Verified Spotify connection status from DB:', isConnected);
      }
    } catch (err) {
      console.error('Exception during Spotify status verification:', err);
      setSpotifyStatus(false);
      toast.error("Error verifying Spotify status. Assuming disconnected.");
    } finally {
      setStatusLoading(false);
    }
  }, [user?.id, isClient, statusLoading, userProfile]);

  // Initial status determination when component mounts
  useEffect(() => {
    if (!isClient) return;

    if (!isLoading && session && user?.id && spotifyStatus === null) {
      determineSpotifyStatus();
    }
    
    // Debug log for Member Since date issue
    if (user || userProfile) {
      console.log('Member Since Debug Info:', {
        userCreatedAt: user?.created_at || 'none',
        userProfileCreatedAt: userProfile?.created_at || 'none',
        hasUserTimestamp: !!user?.created_at,
        hasProfileTimestamp: !!userProfile?.created_at,
        userObj: user ? {...user} : null
      });
    }
  }, [isClient, isLoading, session, user, userProfile, spotifyStatus, determineSpotifyStatus]);

  // Handle redirects from Spotify authorization
  useEffect(() => {
    if (isClient && searchParams) {
      const success = searchParams.get('success');
      const error = searchParams.get('error');
      const isSpotifyMessage = (success && success.includes('Spotify')) || (error && error.includes('Spotify'));

      if (success || error) {
        if (!isSpotifyMessage) {
          if (success) toast.success(success);
          if (error) toast.error(error);
        }
        
        refreshSession();
        
        if (isSpotifyMessage && user?.id) {
          console.log('SettingsPage: Spotify redirect detected, re-verifying connection...');
          determineSpotifyStatus();
        }
        router.replace('/settings', { scroll: false });
      }
    }
  }, [isClient, searchParams, refreshSession, router, user?.id, determineSpotifyStatus]);
  
  const connectSpotify = async () => {
    // Never allow connection if already connected or in progress
    if (spotifyStatus === true) {
      toast.error('Your Spotify account is already connected');
      return;
    }
    
    if (isConnecting) {
      toast.error('Connection already in progress, please wait');
      return;
    }
    
    try {
      setIsConnecting(true);
      const redirectUri = process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI || `${window.location.origin}/api/auth/callback/spotify`;
      const authUrl = getSpotifyAuthURL(redirectUri);
      
      console.log('Redirecting to Spotify auth URL:', authUrl);
      window.location.href = authUrl;
    } catch (error) {
      console.error('Error connecting to Spotify:', error);
      toast.error('Failed to connect to Spotify. Please try again.');
      setIsConnecting(false);
    }
  };

  const disconnectSpotify = async () => {
    try {
      setIsDisconnecting(true);
      
      console.log('Disconnecting Spotify account...');
      const { error } = await supabase
        .from('users')
        .update({
          spotify_connected: false,
          spotify_refresh_token: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', user?.id);

      if (error) throw error;

      // Update local state immediately for UI responsiveness
      setSpotifyStatus(false);
      
      // Then refresh the session to get updated profile
      await refreshSession();
      toast.success('Spotify account disconnected successfully');
      
      console.log('Spotify account disconnected successfully');
    } catch (error) {
      console.error('Error disconnecting from Spotify:', error);
      toast.error('Failed to disconnect from Spotify. Please try again.');
    } finally {
      setIsDisconnecting(false);
    }
  };

  if (isLoading || (spotifyStatus === null && !isClient)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-[#121212]"></div>
          <div className="absolute top-0 -left-40 w-96 h-96 bg-gradient-to-br from-purple-500/20 via-[#1DB954]/20 to-transparent rounded-full filter blur-3xl opacity-50 animate-blob"></div>
          <div className="absolute top-0 -right-40 w-96 h-96 bg-gradient-to-br from-[#1DB954]/20 via-purple-500/20 to-transparent rounded-full filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
        </div>
        
        <motion.div 
          className="flex flex-col items-center space-y-4"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <svg className="animate-spin h-12 w-12 text-[#1DB954]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-[#A3A3A3] text-lg">Loading settings...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212] pt-20 pb-16">
      {/* Content of your settings page */}
    </div>
  );
}

// Main export that wraps in Suspense
export default function SettingsPage() {
  return (
    <Suspense fallback={<SettingsLoading />}>
      <SettingsContent />
    </Suspense>
  );
} 