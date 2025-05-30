'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSupabase } from '@/components/providers/SupabaseProvider';
import { motion } from 'framer-motion';

export default function DashboardPage() {
  const router = useRouter();
  const { user, userProfile, session, isLoading, signOut } = useSupabase();
  const [isClient, setIsClient] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);
  const [localLoading, setLocalLoading] = useState(true);

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
    }, 5000); // 5 second timeout
    
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
    await signOut();
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
          <div className="flex justify-center">
            <motion.button 
              onClick={handleSignOut}
              className="relative overflow-hidden group rounded-full"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#1DB954] to-purple-500 group-hover:scale-105 transition-transform duration-300"></div>
              <span className="relative bg-black/30 backdrop-blur-sm m-[2px] px-8 py-3 rounded-full inline-block font-medium text-white">
                Sign Out and Try Again
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
            <span className="text-[#A3A3A3]">{user?.email}</span>
            <motion.button 
              onClick={handleSignOut}
              className="relative overflow-hidden group rounded-full"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="absolute inset-0 bg-white/10 group-hover:scale-105 transition-transform duration-300"></div>
              <span className="relative bg-black/30 backdrop-blur-sm m-[2px] px-4 py-2 rounded-full inline-block font-medium text-white">
                Sign Out
              </span>
            </motion.button>
          </motion.div>
        </div>
      </motion.header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.h1 
          className="text-4xl font-bold mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Your Dashboard
        </motion.h1>

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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              title: "Create New Playlist",
              description: "Create a personalized playlist based on your music preferences.",
              link: "/create-playlist",
              buttonText: "Get Started",
              buttonStyle: "primary",
              delay: 0.2
            },
            {
              title: "Your Playlists",
              description: "View and manage all your created playlists.",
              link: "/playlists",
              buttonText: "View Playlists",
              buttonStyle: "outline",
              delay: 0.3
            },
            {
              title: "Account Settings",
              description: "Manage your account settings and subscription.",
              link: "/settings",
              buttonText: "Settings",
              buttonStyle: "outline",
              delay: 0.4
            }
          ].map((card, index) => (
            <motion.div
              key={index}
              className="relative"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: card.delay }}
            >
              <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-[#1DB954]/30 via-purple-500/20 to-[#1DB954]/30 opacity-60 blur-lg"></div>
              <motion.div 
                className="relative bg-[#181818]/80 backdrop-filter backdrop-blur-md border border-white/5 p-6 rounded-2xl h-full group"
                whileHover={{ y: -5, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)" }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#1DB954]/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 ease-in-out rounded-2xl"></div>
                
                <div className="mb-4">
                  <h3 className="text-xl font-semibold relative z-10">{card.title}</h3>
                </div>
                <div>
                  <p className="text-[#A3A3A3] mb-4 relative z-10">
                    {card.description}
                  </p>
                </div>
                <div className="mt-4 pt-4 border-t border-[#121212] relative z-10">
                  <Link href={card.link} className="block w-full">
                    {card.buttonStyle === "primary" ? (
                      <motion.button 
                        className="w-full relative group overflow-hidden inline-block rounded-full"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-[#1DB954] to-[#1DB954]/80 group-hover:scale-105 transition-transform duration-300"></div>
                        <div className="absolute inset-[2px] rounded-full bg-black/50 backdrop-blur-xl z-10"></div>
                        <span className="relative z-20 py-2 inline-block w-full font-medium text-white">{card.buttonText}</span>
                      </motion.button>
                    ) : (
                      <motion.button 
                        className="w-full relative group overflow-hidden inline-block rounded-full"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="absolute inset-0 bg-white/10 group-hover:scale-105 transition-transform duration-300"></div>
                        <div className="absolute inset-[2px] rounded-full bg-black/50 backdrop-blur-xl z-10"></div>
                        <span className="relative z-20 py-2 inline-block w-full font-medium text-white">{card.buttonText}</span>
                      </motion.button>
                    )}
                  </Link>
                </div>
                
                {/* Decorative elements */}
                <div className="absolute -bottom-16 -right-16 w-32 h-32 bg-gradient-to-br from-[#1DB954]/10 to-transparent rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
} 