'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useSupabase } from '@/components/providers/SupabaseProvider';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
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
}

export default function PlaylistDetailPage() {
  const params = useParams() as { id: string };
  const searchParams = useSearchParams();
  const router = useRouter();
  const { session, isLoading: authLoading } = useSupabase();
  
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Show success toast if redirected from playlist creation
  useEffect(() => {
    if (searchParams && searchParams.get('success') === 'true') {
      toast.success('Playlist created successfully! 🎉');
      
      // Add a delay and re-fetch the playlist to make sure we have the latest image
      const refreshTimer = setTimeout(async () => {
        try {
          const response = await fetch(`/api/playlists/${params.id}`);
          
          if (response.ok) {
            const data = await response.json();
            setPlaylist(data.playlist);
          }
        } catch (error) {
          console.error('Error refreshing playlist data:', error);
        }
      }, 1000);
      
      return () => clearTimeout(refreshTimer);
    }
  }, [searchParams, params.id]);

  // Fetch playlist data
  useEffect(() => {
    const fetchPlaylist = async () => {
      if (!session?.user) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/playlists/${params.id}`);
        
        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to fetch playlist');
        }
        
        const data = await response.json();
        setPlaylist(data.playlist);
      } catch (error) {
        console.error('Error fetching playlist:', error);
        setError(error instanceof Error ? error.message : 'Failed to fetch playlist');
      } finally {
        setIsLoading(false);
      }
    };

    if (!authLoading && session) {
      fetchPlaylist();
    }
  }, [authLoading, session, params.id]);

  // Check authentication
  useEffect(() => {
    if (!authLoading && !session) {
      router.push('/auth/login?returnTo=/playlists/' + params.id);
    }
  }, [authLoading, session, router, params.id]);

  // Render loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-[#121212]"></div>
          <div className="absolute top-0 -left-40 w-96 h-96 bg-gradient-to-br from-purple-500/20 via-[#1DB954]/20 to-transparent rounded-full filter blur-3xl opacity-50 animate-blob"></div>
          <div className="absolute top-0 -right-40 w-96 h-96 bg-gradient-to-br from-[#1DB954]/20 via-purple-500/20 to-transparent rounded-full filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
        </div>
        <div className="flex flex-col items-center">
          <svg className="animate-spin h-12 w-12 text-[#1DB954] mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="text-white">Loading playlist...</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (error) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-[#121212]"></div>
          <div className="absolute top-0 -left-40 w-96 h-96 bg-gradient-to-br from-red-500/20 via-purple-500/20 to-transparent rounded-full filter blur-3xl opacity-50 animate-blob"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-br from-purple-500/20 via-red-500/20 to-transparent rounded-full filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
        </div>
        <div className="max-w-md w-full bg-[#181818]/80 backdrop-filter backdrop-blur-md border border-white/5 rounded-2xl p-8 text-center">
          <div className="text-red-500 text-5xl mb-4">😕</div>
          <h1 className="text-2xl font-bold mb-4">Playlist Not Found</h1>
          <p className="text-[#A3A3A3] mb-6">{error}</p>
          <Button
            href="/dashboard"
            variant="primary"
            size="lg"
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            }
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // If playlist not found
  if (!playlist) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-[#121212]"></div>
          <div className="absolute top-0 -left-40 w-96 h-96 bg-gradient-to-br from-purple-500/20 via-[#1DB954]/20 to-transparent rounded-full filter blur-3xl opacity-50 animate-blob"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-br from-[#1DB954]/20 via-purple-500/20 to-transparent rounded-full filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
        </div>
        <div className="max-w-md w-full bg-[#181818]/80 backdrop-filter backdrop-blur-md border border-white/5 rounded-2xl p-8 text-center">
          <div className="text-yellow-500 text-5xl mb-4">🔍</div>
          <h1 className="text-2xl font-bold mb-4">Playlist Not Found</h1>
          <p className="text-[#A3A3A3] mb-6">We couldn't find the playlist you're looking for.</p>
          <Button
            href="/dashboard"
            variant="primary"
            size="lg"
            icon={
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            }
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
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
            className="flex items-center space-x-6"
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Ad banner at the top of the playlist detail page */}
        <AdBanner variant="inline" className="mb-8" />
        
        <div className="max-w-5xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-10">
            {/* Playlist Image */}
            <div className="w-64 h-64 flex-shrink-0">
              {playlist.image_url ? (
                <img 
                  src={playlist.image_url} 
                  alt={playlist.name} 
                  className="w-full h-full object-cover rounded-xl shadow-lg"
                />
              ) : (
                <div className="w-full h-full bg-[#282828] rounded-xl shadow-lg flex items-center justify-center">
                  <span className="text-6xl">🎵</span>
                </div>
              )}
            </div>
            
            {/* Playlist Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl md:text-4xl font-bold mb-2">{playlist.name}</h1>
              <p className="text-[#A3A3A3] mb-4">{playlist.description}</p>
              
              <div className="flex flex-wrap gap-4 mb-6 justify-center md:justify-start">
                <div className="bg-[#181818]/80 backdrop-blur-sm px-3 py-1 rounded-full text-sm">
                  {playlist.track_count} tracks
                </div>
                <div className="bg-[#181818]/80 backdrop-blur-sm px-3 py-1 rounded-full text-sm">
                  {playlist.is_public ? 'Public' : 'Private'}
                </div>
                <div className="bg-[#181818]/80 backdrop-blur-sm px-3 py-1 rounded-full text-sm">
                  Created {new Date(playlist.created_at).toLocaleDateString()}
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                <Button 
                  href={playlist.spotify_url}
                  variant="primary"
                  size="lg"
                  icon={
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                    </svg>
                  }
                >
                  Open in Spotify
                </Button>
                
                <Button 
                  href="/playlists"
                  variant="outline"
                  size="lg"
                >
                  Back to Playlists
                </Button>
              </div>
            </div>
          </div>
          
          {/* Playlist Details */}
          <div className="bg-[#181818]/80 backdrop-blur-md border border-white/10 rounded-2xl p-6 mb-10">
            <h2 className="text-2xl font-bold mb-6">Playlist Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-xl font-semibold mb-3">Spotify Info</h3>
                <p className="text-[#A3A3A3] mb-2">
                  <span className="font-medium text-white">Playlist ID:</span> {playlist.spotify_playlist_id}
                </p>
                <p className="text-[#A3A3A3] mb-2">
                  <span className="font-medium text-white">Track Count:</span> {playlist.track_count}
                </p>
                <p className="text-[#A3A3A3]">
                  <span className="font-medium text-white">Privacy:</span> {playlist.is_public ? 'Public' : 'Private'}
                </p>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold mb-3">Creation Info</h3>
                <p className="text-[#A3A3A3] mb-2">
                  <span className="font-medium text-white">Created:</span> {new Date(playlist.created_at).toLocaleString()}
                </p>
                <p className="text-[#A3A3A3]">
                  <span className="font-medium text-white">Created with:</span> Diggr AI Playlist Generator
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Add another ad at the bottom of the page */}
        <AdBanner variant="card" className="mt-12" />
      </main>
    </div>
  );
} 