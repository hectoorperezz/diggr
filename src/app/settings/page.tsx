'use client';

import React, { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useSupabase } from '@/components/providers/SupabaseProvider';
import { toast } from 'react-hot-toast';
import { getSpotifyAuthURL } from '@/lib/spotify/auth';
import { createClient } from '@/lib/supabase/client';
import { motion } from 'framer-motion';
import Button from '@/components/ui/Button';
import AdBanner from '@/components/ads/AdBanner';
import CheckoutButton from '@/components/stripe/CheckoutButton';

// SearchParamsHandler is a small component that just handles the searchParams
// and passes the data to its parent through a callback
function SearchParamsHandler({ onParamsChange }: { onParamsChange: (success: string | null, error: string | null) => void }) {
  const searchParams = useSearchParams();
  
  useEffect(() => {
    if (searchParams) {
      const success = searchParams.get('success');
      const error = searchParams.get('error');
      onParamsChange(success, error);
    }
  }, [searchParams, onParamsChange]);
  
  return null; // This component doesn't render anything
}

// Simple component to display the member date in settings page
function SettingsMemberDate() {
  const [memberDate, setMemberDate] = useState('Loading...');
  
  useEffect(() => {
    // Simple one-time fetch of the profile data to get the date
    fetch('/api/user/profile', {
      cache: 'no-store', 
      headers: { 
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache' 
      }
    })
    .then(res => res.json())
    .then(data => {
      if (data.profile?.created_at_display) {
        setMemberDate(data.profile.created_at_display);
      } else {
        setMemberDate('N/A');
      }
    })
    .catch(err => {
      console.error('Error fetching member date:', err);
      setMemberDate('N/A');
    });
  }, []);
  
  return memberDate;
}

export default function SettingsPage() {
  const router = useRouter();
  const { user, userProfile, session, isLoading, refreshSession, signOut } = useSupabase();
  const [isClient, setIsClient] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [spotifyStatus, setSpotifyStatus] = useState<boolean | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [subscriptionData, setSubscriptionData] = useState<any>(null);
  const [urlParams, setUrlParams] = useState<{success: string | null, error: string | null}>({success: null, error: null});
  
  // Create supabase client
  const supabase = createClient();

  // Callback to receive search params data from the SearchParamsHandler
  const handleParamsChange = useCallback((success: string | null, error: string | null) => {
    setUrlParams({success, error});
  }, []);

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

  // Check subscription data periodically 
  useEffect(() => {
    if (!isClient || !user?.id) return;

    // Function to fetch subscription data
    const fetchSubscriptionData = async () => {
      try {
        const response = await fetch('/api/user/subscription', {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache'
          }
        });
        
        if (!response.ok) {
          console.error('Failed to fetch subscription data:', response.status, response.statusText);
          return;
        }
        
        const data = await response.json();
        setSubscriptionData(data);
      } catch (error) {
        console.error('Error fetching subscription data:', error);
      }
    };

    // Initial fetch
    fetchSubscriptionData();
    
    // Then set up periodic refresh - only when tab is visible
    const intervalId = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchSubscriptionData();
      }
    }, 60000); // refresh every minute when active
    
    return () => clearInterval(intervalId);
  }, [isClient, user?.id]);

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

  // Handle redirects from Spotify authorization using the data from SearchParamsHandler
  useEffect(() => {
    if (!isClient || (!urlParams.success && !urlParams.error)) return;
    
    const { success, error } = urlParams;
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
  }, [isClient, urlParams, refreshSession, router, user?.id, determineSpotifyStatus]);
  
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
    // Prevent multiple requests
    if (isDisconnecting) {
      toast.error('Disconnection already in progress, please wait');
      return;
    }
    
    try {
      setIsDisconnecting(true);
      
      console.log('Disconnecting Spotify account...');
      
      // Add timeout for fetch to prevent hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      // Use API endpoint instead of direct database update
      const response = await fetch('/api/spotify/disconnect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to disconnect Spotify account: ${response.status}`);
      }
      
      // Update local state immediately for UI responsiveness
      setSpotifyStatus(false);
      
      // Then refresh the session to get updated profile
      await refreshSession();
      toast.success('Spotify account disconnected successfully');
      
      console.log('Spotify account disconnected successfully');
    } catch (error) {
      console.error('Error disconnecting from Spotify:', error);
      
      // Fallback direct database update if API fails with "Failed to fetch"
      if (error instanceof Error && error.message.includes('fetch')) {
        try {
          console.log('API fetch failed, attempting direct database update...');
          
          const { error: dbError } = await supabase
            .from('users')
            .update({
              spotify_connected: false,
              spotify_refresh_token: null,
              updated_at: new Date().toISOString()
            })
            .eq('id', user?.id);
          
          if (dbError) {
            throw new Error(`Database fallback failed: ${dbError.message}`);
          }
          
          // Update local state
          setSpotifyStatus(false);
          await refreshSession();
          toast.success('Spotify account disconnected successfully (fallback method)');
          return;
        } catch (fallbackError) {
          console.error('Fallback disconnect method failed:', fallbackError);
        }
      }
      
      toast.error(error instanceof Error ? error.message : 'Failed to disconnect from Spotify. Please try again.');
    } finally {
      setIsDisconnecting(false);
    }
  };

  // Añadir la función de manejo de cierre de sesión
  const handleSignOut = async () => {
    try {
      // Mostrar notificación de carga
      toast.loading('Signing out...', { id: 'signout' });
      
      // Esperar a que se complete el signOut
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out. Please try again.');
      
      // Asegurarse de limpiar la notificación de carga
      toast.dismiss('signout');
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
          <p className="text-xl font-medium">Loading your settings...</p>
        </motion.div>
      </div>
    );
  }

  if (isClient && !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-[#121212]"></div>
          <div className="absolute top-0 -left-40 w-96 h-96 bg-gradient-to-br from-purple-500/20 via-[#1DB954]/20 to-transparent rounded-full filter blur-3xl opacity-50 animate-blob"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-br from-[#1DB954]/20 via-purple-500/20 to-transparent rounded-full filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
        </div>
        
        <motion.div 
          className="flex flex-col items-center space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-xl">Redirecting to login...</p>
        </motion.div>
      </div>
    );
  }
  
  return (
    <>
      {/* This Suspense wrapper only handles the search params */}
      <Suspense fallback={null}>
        <SearchParamsHandler onParamsChange={handleParamsChange} />
      </Suspense>
      
      <div className="min-h-screen bg-black overflow-hidden">
        {/* Animated background */}
        <div className="fixed inset-0 -z-10">
          <div className="absolute inset-0 bg-[#121212]"></div>
          <div className="absolute top-0 -left-40 w-96 h-96 bg-gradient-to-br from-purple-500/20 via-[#1DB954]/20 to-transparent rounded-full filter blur-3xl opacity-50 animate-blob"></div>
          <div className="absolute top-0 -right-40 w-96 h-96 bg-gradient-to-br from-[#1DB954]/20 via-purple-500/20 to-transparent rounded-full filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-gradient-to-br from-purple-500/20 via-[#1DB954]/20 to-transparent rounded-full filter blur-3xl opacity-50 animate-blob animation-delay-4000"></div>
        </div>

        <motion.header 
          className="w-full sticky top-0 z-50 bg-black/50 backdrop-blur-xl border-b border-white/10 shadow-lg"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Link href="/" className="flex items-center">
                <img src="/images/diggr.png" alt="Diggr" className="h-12" />
              </Link>
            </motion.div>
            <motion.div 
              className="flex items-center space-x-4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Button 
                href="/dashboard" 
                variant="primary"
                size="md"
                className="rounded-full w-12 h-12 flex items-center justify-center p-0"
                icon={
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 12L5 10M5 10L12 3L19 10M5 10V20C5 20.5523 5.44772 21 6 21H9M19 10L21 12M19 10V20C19 20.5523 18.5523 21 18 21H15M9 21C9.55228 21 10 20.5523 10 20V16C10 15.4477 10.4477 15 11 15H13C13.5523 15 14 15.4477 14 16V20C14 20.5523 14.4477 21 15 21M9 21H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                }
              />
            </motion.div>
          </div>
        </motion.header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Anuncio sutil en la parte superior */}
          <AdBanner variant="inline" className="mb-8" />
          
          <motion.h1
            className="text-4xl font-bold mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Settings
          </motion.h1>
          
          <div className="space-y-8">
            {/* Show success/error messages from params */}
            {urlParams.success && (
              <motion.div
                className="relative mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-green-500/30 to-[#1DB954]/30 opacity-70 blur-md"></div>
                <div className="relative bg-[#181818]/80 backdrop-filter backdrop-blur-md border border-green-500/20 rounded-xl p-4">
                  <p className="flex items-center text-green-100">
                    <span className="mr-2 text-xl">✅</span>
                    {urlParams.success === 'spotify_connected' ? 'Spotify connected successfully!' : 
                     urlParams.success === 'spotify_disconnected' ? 'Spotify disconnected successfully.' : 
                     urlParams.success === 'subscription_updated' ? 'Subscription updated successfully!' :
                     'Operation completed successfully.'}
                  </p>
                </div>
              </motion.div>
            )}

            {urlParams.error && (
              <motion.div
                className="relative mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-red-500/30 to-purple-500/30 opacity-70 blur-md"></div>
                <div className="relative bg-[#181818]/80 backdrop-filter backdrop-blur-md border border-red-500/20 rounded-xl p-4">
                  <p className="flex items-center text-red-100">
                    <span className="mr-2 text-xl">❌</span>
                    {urlParams.error === 'spotify_connection_required' ? 'Please connect your Spotify account to create playlists.' :
                     urlParams.error === 'spotify_connection_failed' ? 'Failed to connect Spotify account. Please try again.' : 
                     urlParams.error}
                  </p>
                </div>
              </motion.div>
            )}
            
            {/* Account Information */}
            <motion.div
              className="relative"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-[#1DB954]/30 via-purple-500/20 to-[#1DB954]/30 opacity-60 blur-lg"></div>
              <motion.div 
                className="relative bg-[#181818]/80 backdrop-filter backdrop-blur-md border border-white/5 p-8 rounded-2xl"
                whileHover={{ y: -5, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)" }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <h2 className="text-xl font-semibold mb-6">Account Information</h2>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-[#A3A3A3] mb-2">Email</label>
                    <div className="bg-black/30 backdrop-blur-md rounded-xl px-4 py-3 border border-white/10">
                      <p className="text-white">{user?.email}</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#A3A3A3] mb-2">Member Since</label>
                    <div className="bg-black/30 backdrop-blur-md rounded-xl px-4 py-3 border border-white/10">
                      <div className="flex justify-between items-center">
                        <p className="text-white"><SettingsMemberDate /></p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
            
            {/* Subscription Management */}
            <motion.div
              className="relative"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
            >
              <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-purple-500/30 via-[#1DB954]/30 to-purple-500/30 opacity-70 blur-lg"></div>
              <motion.div 
                className="relative bg-[#181818]/80 backdrop-filter backdrop-blur-md border border-white/5 p-8 rounded-2xl"
                whileHover={{ y: -5, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)" }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <div className="flex items-center mb-4">
                  <h2 className="text-xl font-semibold">Subscription Plan</h2>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <div className="bg-black/30 backdrop-blur-md rounded-xl px-6 py-4 border border-white/10">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 ${subscriptionData?.isPremium ? 'bg-[#1DB954]' : 'bg-[#A3A3A3]'} rounded-full mr-2`}></div>
                        <span className="font-medium">{subscriptionData?.isPremium ? 'Pro Plan' : 'Free Plan'}</span>
                      </div>
                    </div>
                    
                    <p className="text-sm text-[#A3A3A3] mt-4">
                      {subscriptionData?.isPremium 
                        ? 'Enjoy unlimited playlists and no ads.' 
                        : 'Limited to 5 playlists per month with ads.'}
                    </p>
                    
                    {/* Current subscription period info */}
                    {subscriptionData?.isPremium && subscriptionData?.subscription?.currentPeriodEnd && (
                      <p className="text-sm text-[#A3A3A3] mt-2">
                        {subscriptionData?.subscription?.cancelAtPeriodEnd 
                          ? `Your subscription is canceled but remains active until ${new Date(subscriptionData.subscription.currentPeriodEnd).toLocaleDateString()}.`
                          : `Your subscription renews on ${new Date(subscriptionData.subscription.currentPeriodEnd).toLocaleDateString()}.`
                        }
                      </p>
                    )}
                  </div>
                  
                  <div>
                    {subscriptionData?.isPremium ? (
                      <Button 
                        onClick={async () => {
                          try {
                            console.log("Manage Subscription button clicked");
                            
                            // Create a loading toast
                            toast.loading('Opening subscription management...', {
                              duration: 10000, // Long duration
                              id: 'portal-loading'
                            });
                
                            // Create a form and submit it directly to the portal URL
                            // This is a more reliable way to open a new window/tab
                            const form = document.createElement('form');
                            form.method = 'POST';
                            form.action = '/api/subscriptions/portal-direct'; // New endpoint
                            form.target = '_blank'; // Open in new tab
                            
                            // Add hidden input for returnUrl
                            const returnUrlInput = document.createElement('input');
                            returnUrlInput.type = 'hidden';
                            returnUrlInput.name = 'returnUrl';
                            returnUrlInput.value = window.location.origin + '/settings';
                            form.appendChild(returnUrlInput);
                            
                            // Add CSRF protection
                            const csrfInput = document.createElement('input');
                            csrfInput.type = 'hidden';
                            csrfInput.name = 'csrfToken';
                            csrfInput.value = Math.random().toString(36).substring(2);
                            form.appendChild(csrfInput);
                            
                            // Add the form to the body and submit it
                            document.body.appendChild(form);
                            form.submit();
                            
                            // Remove the form
                            document.body.removeChild(form);
                            
                            // Clear the loading toast
                            setTimeout(() => toast.dismiss('portal-loading'), 2000);
                          } catch (error) {
                            console.error('Error in portal redirect:', error);
                            toast.dismiss('portal-loading');
                            toast.error('Failed to open subscription management');
                          }
                        }}
                        variant="primary"
                        size="md"
                      >
                        Manage Subscription
                      </Button>
                    ) : (
                      <CheckoutButton 
                        returnUrl={`${typeof window !== 'undefined' ? window.location.origin : ''}/settings`}
                        variant="primary"
                        size="md"
                      />
                    )}
                  </div>
                </div>
                
                {subscriptionData?.isPremium ? (
                  <div className="bg-[#1DB954]/10 border border-[#1DB954]/20 rounded-xl p-4 mt-6">
                    <div className="flex items-center">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#1DB954] mr-3">
                        <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M9 12.5714L11 14.5714L15.5 10.0714" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span className="text-[#1DB954]">You have access to all Pro features: unlimited playlists, no ads, and premium recommendations!</span>
                    </div>
                  </div>
                ) : (
                  <div className="bg-gradient-to-r from-purple-500/10 to-[#1DB954]/10 border border-white/10 rounded-xl p-4 mt-6">
                    <div className="flex items-center">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-purple-400 mr-3">
                        <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M12 16V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M12 8H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span className="text-white">
                        Upgrade to Pro for unlimited playlists, no ads, and premium recommendations!
                      </span>
                    </div>
                  </div>
                )}
              </motion.div>
            </motion.div>
            
            {/* Anuncio entre las secciones principales */}
            <AdBanner variant="card" className="my-8" />
            
            {/* Spotify Connection */}
            <motion.div
              className="relative"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-[#1DB954]/40 via-purple-500/20 to-[#1DB954]/40 opacity-70 blur-lg"></div>
              <motion.div 
                className="relative bg-[#181818]/80 backdrop-filter backdrop-blur-md border border-white/5 p-8 rounded-2xl"
                whileHover={{ y: -5, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)" }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <div className="flex items-center mb-4">
                  <h2 className="text-xl font-semibold">Spotify Connection</h2>
                  <div className="ml-4">
                    {spotifyStatus === true ? (
                      <div className="flex items-center">
                        <span className="w-3 h-3 bg-[#1DB954] rounded-full animate-pulse mr-2"></span>
                        <span className="text-sm text-[#1DB954]">Connected</span>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse mr-2"></span>
                        <span className="text-sm text-red-500">Disconnected</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white text-lg mb-2">Connect your Spotify account to create playlists</p>
                      <p className="text-sm text-[#A3A3A3]">
                        {spotifyStatus === true 
                          ? 'Your Spotify account is connected. You can now create and save playlists to your Spotify account.' 
                          : spotifyStatus === false 
                          ? 'You need to connect your Spotify account to create and save playlists.'
                          : 'Checking connection status...'}
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {spotifyStatus === true ? (
                        <Button 
                          onClick={disconnectSpotify}
                          disabled={isDisconnecting}
                          variant="danger"
                          size="md"
                        >
                          {isDisconnecting ? 'Disconnecting...' : 'Disconnect'}
                        </Button>
                      ) : spotifyStatus === false ? (
                        <Button 
                          onClick={connectSpotify}
                          disabled={isConnecting}
                          variant="primary" 
                          size="md"
                        >
                          {isConnecting ? 'Connecting...' : 'Connect to Spotify'}
                        </Button>
                      ) : (
                        <div className="bg-black/30 backdrop-blur-sm px-6 py-2 rounded-full text-[#A3A3A3] animate-pulse">
                          Checking status...
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {spotifyStatus === true && (
                    <div className="bg-[#1DB954]/10 border border-[#1DB954]/20 rounded-xl p-4">
                      <div className="flex items-center">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#1DB954] mr-3">
                          <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M9 12.5714L11 14.5714L15.5 10.0714" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span className="text-[#1DB954]">Spotify account is connected and ready to use!</span>
                      </div>
                    </div>
                  )}
                  
                  {spotifyStatus === false && (
                    <div className="bg-[#181818] border border-white/10 rounded-xl p-4">
                      <div className="flex items-center">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#A3A3A3] mr-3">
                          <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M12 16V12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M12 8H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span className="text-[#A3A3A3]">
                          Connecting with Spotify allows Diggr to create playlists and save them directly to your account.
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
            
            {/* Bottom actions section */}
            <motion.div 
              className="flex justify-center mt-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="flex flex-col w-full max-w-xs gap-4 pb-20">
                <Button 
                  onClick={handleSignOut}
                  variant="danger"
                  size="lg"
                  fullWidth
                  icon={
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M17 16L21 12M21 12L17 8M21 12H9M13 16V17C13 18.6569 11.6569 20 10 20H6C4.34315 20 3 18.6569 3 17V7C3 5.34315 4.34315 4 6 4H10C11.6569 4 13 5.34315 13 7V8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  }
                >
                  Log Out
                </Button>
                
                <Button 
                  href="/settings/delete-account"
                  variant="danger"
                  size="lg"
                  fullWidth
                  icon={
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M19 7L18.1327 19.1425C18.0579 20.1891 17.187 21 16.1378 21H7.86224C6.81296 21 5.94208 20.1891 5.86732 19.1425L5 7M10 11V17M14 11V17M15 7V4C15 3.44772 14.5523 3 14 3H10C9.44772 3 9 3.44772 9 4V7M4 7H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  }
                >
                  Delete Account
                </Button>
              </div>
            </motion.div>
            
            {/* Anuncio al final de la página */}
            <AdBanner variant="inline" className="mt-12" />
          </div>
        </main>
      </div>
    </>
  );
} 