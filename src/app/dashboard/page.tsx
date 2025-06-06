'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSupabase } from '@/components/providers/SupabaseProvider';
import { motion } from 'framer-motion';
import Button from '@/components/ui/Button';
import AnimatedBackground from '@/components/ui/AnimatedBackground';
import SubscriptionStatus from '@/components/ui/SubscriptionStatus';
import AdBanner from '@/components/ads/AdBanner';
import ConditionalAdDisplay from '@/components/ads/ConditionalAdDisplay';
import { toast } from 'react-hot-toast';

// Para depuración: Muestra si estamos en desarrollo o producción
const isDevMode = process.env.NODE_ENV === 'development';
console.log(`Entorno Dashboard: ${isDevMode ? 'DESARROLLO' : 'PRODUCCIÓN'}`);

export default function DashboardPage() {
  const router = useRouter();
  const { user, userProfile, session, isLoading, signOut, refreshSession } = useSupabase();
  const [isClient, setIsClient] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);
  const [localLoading, setLocalLoading] = useState(true);
  const [subscriptionData, setSubscriptionData] = useState<any>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  // Set isClient to true when component mounts on client
  useEffect(() => {
    setIsClient(true);
    
    // Set a maximum time for loading
    const timeoutId = setTimeout(() => {
      if (localLoading) {
        console.log('Loading timeout reached, forcing dashboard to render...');
        setLocalLoading(false);
        if (!error && !session) {
          setError('Loading took too long. Please try refreshing the page.');
        }
      }
    }, 10000); // Increased from 5s to 10s timeout
    
    return () => clearTimeout(timeoutId);
  }, []);

  // Check if user is logged in
  useEffect(() => {
    // Skip if we've already checked auth
    if (hasCheckedAuth) return;
    
    console.log('Dashboard - Auth state:', { 
      isLoading, 
      hasSession: !!session, 
      hasUser: !!user,
      userEmail: user?.email,
      hasProfile: !!userProfile,
      localLoading,
    });

    // Only proceed with auth checks if loading is complete
    if (!isLoading) {
      setHasCheckedAuth(true);
      setLocalLoading(false);
      
      if (!session) {
        console.log('No session detected, redirecting to login');
        router.push('/auth/login');
      } else if (!user) {
        // We have a session but no user data
        setError('Session exists but user data is missing. Try signing out and back in.');
        // Only check auth state if we need to debug
        if (process.env.NODE_ENV === 'development') {
          checkAuthState();
        }
      } else if (process.env.NODE_ENV === 'development' && !userProfile) {
        // We have a user but no profile data - only run check in development mode
        console.log('User exists but profile data is missing, checking auth state...');
        checkAuthState();
      }
    }
  }, [isLoading, session, user, userProfile, router, hasCheckedAuth]);

  // Separate function to check auth state to avoid repeated code
  const checkAuthState = async () => {
    try {
      // Call debug endpoint
      const response = await fetch('/api/debug/session');
      const data = await response.json();
      
      console.log('Debug session info:', data);
      
      // If there's an issue with the user data but session exists
      if (data.auth.hasSession && !data.database.hasUserData && data.database.userError) {
        setError(`Database error: ${data.database.userError.message}`);
      }
    } catch (e) {
      console.error('Error checking auth state:', e);
    }
  };

  const handleSignOut = async () => {
    try {
      // Mostrar notificación de carga
      toast.loading('Signing out...', { id: 'signout' });
      
      // Esperar a que se complete el signout
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
      toast.error('Failed to sign out. Please try again.');
      
      // Asegurarse de limpiar la notificación de carga
      toast.dismiss('signout');
    }
  };

  // Fetch subscription data for dashboard display
  useEffect(() => {
    async function fetchSubscriptionData() {
      if (!user) return;
      
      try {
        console.log('Dashboard: Fetching subscription data');
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
          console.log('Dashboard: Subscription data received:', data);
          setSubscriptionData(data);
        }
      } catch (error) {
        console.error('Error fetching subscription data in dashboard:', error);
      }
    }
    
    fetchSubscriptionData();
  }, [user]);

  // Handle retry loading
  const handleRetry = async () => {
    setIsRetrying(true);
    setError(null);
    setLocalLoading(true);
    setHasCheckedAuth(false);
    
    try {
      // Force refresh session
      console.log('Manually refreshing session...');
      await refreshSession();
      
      // Wait a moment to ensure all data is refreshed
      setTimeout(() => {
        setIsRetrying(false);
      }, 1000);
    } catch (err) {
      console.error('Error during retry:', err);
      setError('Failed to refresh session. Please try signing out and back in.');
      setIsRetrying(false);
    }
  };

  // Show loading state
  if ((isLoading || localLoading) && !hasCheckedAuth) {
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
          <p className="text-xl font-medium">Loading your dashboard...</p>
        </motion.div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-[#121212]"></div>
          <div className="absolute top-0 -left-40 w-96 h-96 bg-gradient-to-br from-red-500/20 via-purple-500/20 to-transparent rounded-full filter blur-3xl opacity-50 animate-blob"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-br from-purple-500/20 via-red-500/20 to-transparent rounded-full filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
        </div>
        
        <motion.div 
          className="relative bg-[#181818]/80 backdrop-filter backdrop-blur-lg border border-white/5 rounded-3xl p-8 max-w-md w-full"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-red-500 text-5xl mb-4 text-center">😞</div>
          <h1 className="text-2xl font-bold mb-4 text-center">Something went wrong</h1>
          <p className="mb-6 text-[#A3A3A3] text-center">{error}</p>
          <div className="flex flex-col md:flex-row justify-center gap-4">
            <motion.button 
              onClick={handleRetry}
              className="relative overflow-hidden group rounded-full"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={isRetrying}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 group-hover:scale-105 transition-transform duration-300"></div>
              <span className="relative bg-black/30 backdrop-blur-sm m-[2px] px-8 py-3 rounded-full inline-block font-medium text-white flex items-center justify-center">
                {isRetrying ? (
                  <>
                    <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Retrying...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh and Try Again
                  </>
                )}
              </span>
            </motion.button>
            <motion.button 
              onClick={handleSignOut}
              className="relative overflow-hidden group rounded-full"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              disabled={isRetrying}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#1DB954] to-purple-500 group-hover:scale-105 transition-transform duration-300"></div>
              <span className="relative bg-black/30 backdrop-blur-sm m-[2px] px-8 py-3 rounded-full inline-block font-medium text-white flex items-center justify-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign Out
              </span>
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  // Handle non-authenticated users on the client side
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
          <p className="text-xl">Please log in to access the dashboard</p>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link href="/auth/login" className="relative group overflow-hidden inline-block rounded-full">
              <div className="absolute inset-0 bg-gradient-to-r from-[#1DB954] to-purple-500 group-hover:scale-105 transition-transform duration-300"></div>
              <span className="relative bg-black/30 backdrop-blur-sm m-[2px] px-8 py-3 rounded-full inline-block font-medium text-white">
                Go to Login
              </span>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // Render dashboard even if userProfile is missing - don't let that block the UI
  // At this point, we have a session and user, which is enough to show the dashboard
  return (
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
            <SubscriptionStatus />
            <Button 
              href="/create-playlist" 
              variant="primary"
              size="md"
              icon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              }
            >
              Create Playlist
            </Button>
          </motion.div>
        </div>
      </motion.header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Section with User Metrics */}
        <motion.div
          className="mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <motion.h1 
              className="text-4xl font-bold bg-gradient-to-r from-white via-[#1DB954] to-purple-400 text-transparent bg-clip-text"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              Welcome back, {user?.email?.split('@')[0] || 'there'}!
            </motion.h1>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Link href="/settings">
                <Button variant="outline" size="sm" icon={
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20s-8-2.5-8-10V5l8-3 8 3v5c0 7.5-8 10-8 10z" />
                  </svg>
                }>
                  Account Settings
                </Button>
              </Link>
            </motion.div>
          </div>
          
          {/* User Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Subscription Plan */}
            <motion.div
              className="relative"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-[#1DB954]/30 to-purple-500/30 opacity-60 blur-lg"></div>
              <div className="relative bg-[#181818]/80 backdrop-filter backdrop-blur-md border border-white/5 p-6 rounded-xl h-full">
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 rounded-full bg-[#1DB954]/20 flex items-center justify-center mr-3">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#1DB954]">
                      <path d="M20 12V8H6a2 2 0 100 4h14zm0 2H6a4 4 0 110-8h14V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h13a2 2 0 002-2v-5z" fill="currentColor" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold">Subscription</h3>
                </div>
                <p className="text-3xl font-bold text-[#1DB954] mb-1">
                  {subscriptionData?.isPremium ? 'Pro Plan' : 'Free Plan'}
                </p>
                <p className="text-sm text-[#A3A3A3]">
                  {subscriptionData?.isPremium 
                    ? 'Unlimited playlists' 
                    : `${subscriptionData?.playlistsCreated || 0}/${subscriptionData?.playlistLimit || 5} playlists per month`}
                </p>
              </div>
            </motion.div>
            
            {/* Playlists Created */}
            <motion.div
              className="relative"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-purple-500/30 to-blue-500/30 opacity-60 blur-lg"></div>
              <div className="relative bg-[#181818]/80 backdrop-filter backdrop-blur-md border border-white/5 p-6 rounded-xl h-full">
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center mr-3">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-purple-400">
                      <path d="M19 9l-7 7-7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M19 3l-7 7-7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold">Playlists Created</h3>
                </div>
                <p className="text-3xl font-bold text-purple-400 mb-1">3</p>
                <p className="text-sm text-[#A3A3A3]">This month</p>
              </div>
            </motion.div>
            
            {/* Member Since */}
            <motion.div
              className="relative"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-blue-500/30 to-[#1DB954]/30 opacity-60 blur-lg"></div>
              <div className="relative bg-[#181818]/80 backdrop-filter backdrop-blur-md border border-white/5 p-6 rounded-xl h-full">
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center mr-3">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-blue-400">
                      <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <h3 className="text-lg font-semibold">Member Since</h3>
                </div>
                <p className="text-3xl font-bold text-blue-400 mb-1">
                  <MemberDateDisplay />
                </p>
                <p className="text-sm text-[#A3A3A3]">Diggr account</p>
              </div>
            </motion.div>
          </div>
          
          {/* Anuncio regular usando AdBanner con ConditionalAdDisplay */}
          <ConditionalAdDisplay>
            <AdBanner variant="inline" className="my-8" />
          </ConditionalAdDisplay>
        </motion.div>

        {userProfile?.spotify_connected === false && (
          <motion.div
            className="relative mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-yellow-500/30 to-red-500/30 opacity-70 blur-md"></div>
            <div className="relative bg-[#181818]/80 backdrop-filter backdrop-blur-md border border-yellow-500/20 rounded-xl p-4">
              <p className="flex items-center text-yellow-100">
                <span className="mr-2 text-xl">⚠️</span>
                Your Spotify account is not connected. Connect it in the settings to create playlists.
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Link href="/settings" className="ml-4 px-4 py-1 bg-yellow-700/80 backdrop-blur-sm rounded-full text-sm hover:bg-yellow-600 transition-colors">
                    Go to Settings
                  </Link>
                </motion.div>
              </p>
            </div>
          </motion.div>
        )}

        {/* Create New Playlist Hero Section */}
        <motion.div
          className="relative mb-12 overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="absolute -inset-2 rounded-3xl bg-gradient-to-r from-[#1DB954]/40 via-purple-500/30 to-[#1DB954]/40 opacity-80 blur-xl"></div>
          <div className="relative bg-[#181818]/90 backdrop-filter backdrop-blur-xl border border-white/10 rounded-2xl p-8 md:p-10 overflow-hidden">
            {/* Background decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#1DB954]/10 rounded-full filter blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/10 rounded-full filter blur-3xl"></div>
            
            {/* Floating music notes */}
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute text-[#1DB954]/30 text-2xl md:text-4xl"
                initial={{ 
                  top: `${20 + Math.random() * 60}%`, 
                  left: `${20 + Math.random() * 60}%`,
                  opacity: 0,
                  scale: 0.5,
                }}
                animate={{ 
                  y: [0, -100 - Math.random() * 100],
                  opacity: [0, 0.7, 0],
                  scale: [0.5, 1.2, 0.8]
                }}
                transition={{ 
                  duration: 4 + Math.random() * 4,
                  repeat: Infinity,
                  delay: i * 2
                }}
              >
                {i % 2 === 0 ? '♪' : '♫'}
              </motion.div>
            ))}
            
            <div className="flex flex-col md:flex-row items-center justify-between relative z-10">
              <div className="mb-6 md:mb-0 md:mr-10">
                <motion.h2 
                  className="text-3xl md:text-4xl font-bold mb-4 text-white"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                >
                  Create Your Perfect Playlist
                </motion.h2>
                <motion.p
                  className="text-[#A3A3A3] mb-6 max-w-xl"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  Craft the ultimate listening experience with our AI-powered playlist generator. 
                  Choose your genres, mood, and era to discover new tracks that match your taste.
                </motion.p>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                >
                  <Link href="/create-playlist">
                    <Button
                      variant="primary"
                      size="lg"
                      icon={
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      }
                    >
                      Create New Playlist
                    </Button>
                  </Link>
                </motion.div>
              </div>
              
              <motion.div
                className="w-40 h-40 md:w-64 md:h-64 relative flex-shrink-0"
                initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ duration: 0.7, delay: 0.4, type: "spring" }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#1DB954]/20 via-purple-500/20 to-blue-500/30 rounded-lg opacity-80 blur-md"></div>
                <div className="absolute inset-[3px] bg-black/40 backdrop-blur-sm rounded-lg"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg width="60%" height="60%" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#1DB954]">
                    <path d="M9 17H5v-2h4v2zm0-4H5v-2h4v2zm0-4H5V7h4v2zm10 8h-4v-2h4v2zm0-4h-4v-2h4v2zm0-4h-4V7h4v2z" fill="currentColor" />
                    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" fill="currentColor" />
                  </svg>
                </div>
                <div className="absolute -bottom-2 -right-2 w-12 h-12 bg-[#1DB954] rounded-full flex items-center justify-center shadow-lg transform rotate-12">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-black">
                    <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>

        
        {/* Recent Playlists Section */}
        <motion.div
          className="mt-16"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-bold">Recent Playlists</h2>
            <Link href="/playlists">
              <Button
                variant="outline"
                size="sm"
                icon={
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                }
                iconPosition="right"
              >
                View All
              </Button>
            </Link>
          </div>
          
          <RecentPlaylists />
          
          {/* Ad banner integrated naturally at the bottom of the dashboard - solo si no hay error */}
          <RecentPlaylistsBottomAd />
        </motion.div>
      </main>
    </div>
  );
}

// Componente para mostrar anuncios solo cuando no hay errores de carga
function RecentPlaylistsBottomAd() {
  const [playlistsError, setPlaylistsError] = useState(false);
  
  // Suscribirse al evento custom de error de playlists
  useEffect(() => {
    const handlePlaylistError = (event: CustomEvent) => {
      setPlaylistsError(event.detail.hasError);
    };
    
    // Usar window para evento personalizado
    window.addEventListener('playlistsLoadState' as any, handlePlaylistError as any);
    
    return () => {
      window.removeEventListener('playlistsLoadState' as any, handlePlaylistError as any);
    };
  }, []);
  
  // Solo mostrar anuncios si no hay errores de carga
  if (playlistsError) {
    if (process.env.NODE_ENV === 'development') {
      console.log('No mostrando anuncios debido a error de carga de playlists');
    }
    return null;
  }
  
  return (
    <ConditionalAdDisplay>
      <AdBanner variant="card" className="mt-10" />
    </ConditionalAdDisplay>
  );
}

// Recent Playlists Component
function RecentPlaylists() {
  const [playlists, setPlaylists] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const { session } = useSupabase();
  
  // Dispatchar evento para informar del estado de carga de playlists
  const notifyPlaylistsLoadState = useCallback((hasError: boolean) => {
    // Evento custom para comunicar estado de carga
    const event = new CustomEvent('playlistsLoadState', { 
      detail: { hasError } 
    });
    window.dispatchEvent(event);
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`Playlist load state changed: ${hasError ? 'ERROR' : 'OK'}`);
    }
  }, []);
  
  // Function to fetch playlists with retry
  const fetchRecentPlaylists = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Fetching recent playlists...');
      }
      
      const response = await fetch('/api/playlists?limit=8', { 
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-cache' }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch playlists');
      }
      
      const data = await response.json();
      setPlaylists(data.playlists || []);
      
      // Notificar que la carga fue exitosa
      notifyPlaylistsLoadState(false);
      
      // Reset retry counter on success
      setRetryCount(0);
    } catch (err) {
      console.error('Error fetching recent playlists:', err);
      setError('Unable to load recent playlists');
      
      // Notificar que hubo un error
      notifyPlaylistsLoadState(true);
    } finally {
      setIsLoading(false);
    }
  }, [notifyPlaylistsLoadState]);
  
  // Handle manual retry with exponential backoff
  const handleRetry = useCallback(async () => {
    // Prevent excessive retries
    if (retryCount > 3) {
      console.warn('Too many retry attempts');
      return;
    }
    
    setRetryCount(prev => prev + 1);
    await fetchRecentPlaylists();
  }, [fetchRecentPlaylists, retryCount]);
  
  useEffect(() => {
    fetchRecentPlaylists();
    
    // Use the visibility change event to refresh data when user comes back to the tab
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchRecentPlaylists();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Clean up
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [fetchRecentPlaylists]);
  
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, index) => (
          <div key={index} className="bg-[#181818]/50 rounded-xl h-64 animate-pulse"></div>
        ))}
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-[#181818]/50 rounded-xl p-6 text-center">
        <p className="text-[#A3A3A3]">{error}</p>
        <button 
          onClick={handleRetry}
          className="mt-4 px-4 py-2 bg-[#1DB954]/20 rounded-full text-[#1DB954] text-sm hover:bg-[#1DB954]/30 transition-colors"
          disabled={isLoading}
        >
          {isLoading ? 'Trying...' : 'Try Again'}
        </button>
      </div>
    );
  }
  
  if (playlists.length === 0) {
    return (
      <div className="bg-[#181818]/80 backdrop-filter backdrop-blur-md border border-white/5 rounded-xl p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-[#1DB954]/20 rounded-full flex items-center justify-center">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-[#1DB954]">
            <path d="M9 17H5v-2h4v2zm0-4H5v-2h4v2zm0-4H5V7h4v2zm10 8h-4v-2h4v2zm0-4h-4v-2h4v2zm0-4h-4V7h4v2z" fill="currentColor" />
            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" fill="currentColor" />
          </svg>
        </div>
        <h3 className="text-xl font-medium mb-2">No Playlists Yet</h3>
        <p className="text-[#A3A3A3] mb-6">Create your first playlist to see it here</p>
        <Link href="/create-playlist">
          <Button variant="primary">Create a Playlist</Button>
        </Link>
      </div>
    );
  }
  
  // Add this to display an ad after the second playlist - Solo si no hay error
  const renderPlaylistsWithAds = (playlists) => {
    if (!playlists || playlists.length === 0) {
      return (
        <div className="text-center py-8 text-[#A3A3A3]">
          <p>You haven't created any playlists yet.</p>
        </div>
      );
    }

    // Create a PlaylistCard component inline
    const PlaylistCard = ({ playlist }) => (
      <motion.div
        className="group relative"
        whileHover={{ y: -5 }}
        transition={{ type: "spring", stiffness: 400, damping: 10 }}
      >
        <Link href={`/playlists/${playlist.id}`}>
          <div className="relative bg-[#181818]/80 backdrop-filter backdrop-blur-md border border-white/5 rounded-xl overflow-hidden">
            {/* Playlist Cover */}
            <div className="aspect-square w-full overflow-hidden">
              {playlist.image_url ? (
                <img 
                  src={playlist.image_url} 
                  alt={playlist.name} 
                  className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-700"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = '';
                    if (e.currentTarget.parentElement) {
                      e.currentTarget.parentElement.innerHTML = `
                        <div class="w-full h-full bg-[#282828] flex flex-col items-center justify-center">
                          <span class="text-5xl mb-2">🎵</span>
                        </div>
                      `;
                    }
                  }}
                />
              ) : (
                <div className="w-full h-full bg-[#282828] flex flex-col items-center justify-center">
                  <span className="text-5xl mb-2">🎵</span>
                </div>
              )}
            </div>
            
            {/* Playlist Info */}
            <div className="p-4">
              <h3 className="font-medium text-white truncate">{playlist.name}</h3>
              <p className="text-sm text-[#A3A3A3] mt-1 truncate">{playlist.track_count} tracks</p>
            </div>
            
            {/* Hover Overlay */}
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform">
                <div className="w-12 h-12 rounded-full bg-[#1DB954] flex items-center justify-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="5 3 19 12 5 21 5 3"></polygon>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </Link>
      </motion.div>
    );

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {playlists.map((playlist, index) => (
          <React.Fragment key={playlist.id}>
            <PlaylistCard playlist={playlist} />
            {index === 1 && !error && (
              <ConditionalAdDisplay>
                <AdBanner variant="card" className="flex items-center justify-center" />
              </ConditionalAdDisplay>
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };
  
  return renderPlaylistsWithAds(playlists);
}

// Simple component to display the member date that only fetches once
function MemberDateDisplay() {
  const [memberDate, setMemberDate] = useState('Loading...');
  
  useEffect(() => {
    // Simple one-time fetch of the profile data to get the date
    fetch('/api/user/profile', {
      cache: 'no-store', 
      headers: { 'Cache-Control': 'no-cache' }
    })
    .then(res => res.json())
    .then(data => {
      if (data.profile?.created_at_display) {
        setMemberDate(data.profile.created_at_display);
      } else {
        setMemberDate('New Member');
      }
    })
    .catch(err => {
      console.error('Error fetching member date:', err);
      setMemberDate('New Member');
    });
  }, []);
  
  return memberDate;
} 