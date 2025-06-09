'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSupabase } from '@/components/providers/SupabaseProvider';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import AnimatedBackground from '@/components/ui/AnimatedBackground';
import Button from '@/components/ui/Button';
import AdBanner from '@/components/ads/AdBanner';

interface Playlist {
  id: string;
  name: string;
  description: string;
  spotify_playlist_id: string;
  spotify_url: string;
  image_url: string;
  track_count: number;
  is_public: boolean;
  created_at: string;
  criteria: {
    genres?: string[];
    moods?: string[];
    eras?: string[];
    regions?: string[];
    uniquenessLevel?: number;
  };
}

export default function PlaylistsPage() {
  const router = useRouter();
  const { user, session, isLoading: authLoading } = useSupabase();
  
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch playlists data
  useEffect(() => {
    const fetchPlaylists = async () => {
      if (!session?.user) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/playlists');
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to fetch playlists');
        }
        
        const data = await response.json();
        setPlaylists(data.playlists || []);
      } catch (error) {
        console.error('Error fetching playlists:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch playlists');
      } finally {
        setIsLoading(false);
      }
    };

    if (!authLoading && session) {
      fetchPlaylists();
    } else if (!authLoading && !session) {
      setIsLoading(false);
    }
  }, [authLoading, session]);

  // Check authentication
  useEffect(() => {
    if (!authLoading && !session) {
      router.push('/auth/login?returnTo=/playlists');
    }
  }, [authLoading, session, router]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <AnimatedBackground variant="green" />
        
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
          <p className="text-xl font-medium">Loading your playlists...</p>
        </motion.div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <AnimatedBackground variant="purple" />
        
        <motion.div 
          className="flex flex-col items-center space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-xl">Please log in to view your playlists</p>
          <Button href="/auth/login" variant="primary">
            Go to Login
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black overflow-hidden">
      {/* Animated background */}
      <AnimatedBackground variant="default" />

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
              icon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 12L5 10M5 10L12 3L19 10M5 10V20C5 20.5523 5.44772 21 6 21H9M19 10L21 12M19 10V20C19 20.5523 18.5523 21 18 21H15M9 21C9.55228 21 10 20.5523 10 20V16C10 15.4477 10.4477 15 11 15H13C13.5523 15 14 15.4477 14 16V20C14 20.5523 14.4477 21 15 21M9 21H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              }
            >
              Dashboard
            </Button>
          </motion.div>
        </div>
      </motion.header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          className="flex justify-between items-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold">Your Playlists</h1>
          <Button href="/create-playlist" variant="primary" size="lg" icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          }>
            Create New Playlist
          </Button>
        </motion.div>

        {/* Ad banner at the top of the playlists page */}
        <AdBanner variant="inline" className="mb-8" />

        {error && (
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
                Error loading playlists: {error}
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <button onClick={() => window.location.reload()} className="ml-4 px-4 py-1 bg-red-700/80 backdrop-blur-sm rounded-full text-sm hover:bg-red-600 transition-colors">
                    Retry
                  </button>
                </motion.div>
              </p>
            </div>
          </motion.div>
        )}

        {playlists.length === 0 && !error ? (
          <motion.div
            className="relative"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-[#1DB954]/30 via-purple-500/20 to-[#1DB954]/30 opacity-60 blur-lg"></div>
            <motion.div 
              className="relative bg-[#181818]/80 backdrop-filter backdrop-blur-md border border-white/5 p-8 rounded-2xl text-center"
              whileHover={{ y: -5, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)" }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <div className="text-7xl mb-4">🎵</div>
              <h2 className="text-2xl font-bold mb-4">No Playlists Yet</h2>
              <p className="text-[#A3A3A3] mb-6">You haven't created any playlists yet. Create your first AI-generated playlist now!</p>
              <Button href="/create-playlist" variant="primary" fullWidth>
                Create Your First Playlist
              </Button>
            </motion.div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {playlists.map((playlist, index) => (
              <motion.div
                key={playlist.id}
                className="relative"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 + index * 0.05 }}
              >
                <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-[#1DB954]/30 via-purple-500/20 to-[#1DB954]/30 opacity-60 blur-lg"></div>
                <motion.div 
                  className="relative bg-[#181818]/80 backdrop-filter backdrop-blur-md border border-white/5 p-6 rounded-2xl h-full group"
                  whileHover={{ y: -5, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)" }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-[#1DB954]/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 ease-in-out rounded-2xl"></div>
                  
                  {/* Playlist Image */}
                  <div className="w-full aspect-square mb-4 overflow-hidden rounded-xl">
                    {playlist.image_url ? (
                      <img 
                        src={playlist.image_url} 
                        alt={playlist.name} 
                        className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-700"
                        onError={(e) => {
                          // If image fails to load, show placeholder
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = '';
                          if (e.currentTarget.parentElement) {
                            e.currentTarget.parentElement.innerHTML = `
                              <div class="w-full h-full bg-[#282828] flex flex-col items-center justify-center">
                                <span class="text-5xl mb-2">🎵</span>
                                <button class="text-xs text-[#1DB954] hover:underline" onClick="window.location.reload()">
                                  Reload
                                </button>
                              </div>
                            `;
                          }
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-[#282828] flex flex-col items-center justify-center">
                        <span className="text-5xl mb-2">🎵</span>
                        <span className="text-xs text-[#A3A3A3]">No image available</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Playlist Info */}
                  <div className="mb-4">
                    <h3 className="text-xl font-semibold mb-1 line-clamp-1 relative z-10">{playlist.name}</h3>
                    <p className="text-[#A3A3A3] text-sm line-clamp-2 relative z-10">
                      {playlist.description || 'No description'}
                    </p>
                  </div>
                  
                  {/* Playlist Meta */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="px-2 py-1 bg-black/30 backdrop-blur-sm rounded-full text-xs text-[#A3A3A3]">
                      {playlist.track_count} tracks
                    </span>
                    {playlist.criteria?.genres && playlist.criteria.genres[0] && (
                      <span className="px-2 py-1 bg-black/30 backdrop-blur-sm rounded-full text-xs text-[#A3A3A3]">
                        {playlist.criteria.genres[0]}
                      </span>
                    )}
                    {playlist.criteria?.moods && playlist.criteria.moods[0] && (
                      <span className="px-2 py-1 bg-black/30 backdrop-blur-sm rounded-full text-xs text-[#A3A3A3]">
                        {playlist.criteria.moods[0]}
                      </span>
                    )}
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-[#121212] relative z-10 flex gap-3">
                    <Button 
                      href={`/playlists/${playlist.id}`} 
                      variant="primary"
                      size="md"
                      fullWidth
                    >
                      View Details
                    </Button>
                    
                    {playlist.spotify_url && (
                      <Button
                        href={playlist.spotify_url}
                        variant="outline"
                        size="md"
                        icon={
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                          </svg>
                        }
                      >
                        Spotify
                      </Button>
                    )}
                  </div>
                  
                  {/* Decorative elements */}
                  <div className="absolute -bottom-16 -right-16 w-32 h-32 bg-gradient-to-br from-[#1DB954]/10 to-transparent rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                </motion.div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Ad banner at the bottom of the playlists page */}
        <AdBanner variant="card" className="mt-12" />
      </main>
    </div>
  );
} 