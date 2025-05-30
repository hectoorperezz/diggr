'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useSupabase } from '@/components/providers/SupabaseProvider';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import Button from '@/components/ui/Button';

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
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Handle file selection and upload
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Check if the file is a jpeg or png
    if (file.type !== 'image/jpeg' && file.type !== 'image/png') {
      toast.error('Please select a JPEG or PNG image');
      return;
    }
    
    // Check if the file is less than 256KB (Spotify limit)
    if (file.size > 256 * 1024) {
      toast.error('Image must be less than 256KB');
      return;
    }
    
    const reader = new FileReader();
    reader.onloadend = () => {
      uploadCoverImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };
  
  const uploadCoverImage = async (imageDataUrl: string) => {
    if (!playlist) return;
    
    setIsUploading(true);
    const toastId = toast.loading('Uploading cover image...');
    
    try {
      // Convert PNG to JPEG if needed
      let jpegDataUrl = imageDataUrl;
      if (imageDataUrl.startsWith('data:image/png')) {
        jpegDataUrl = await convertPngToJpeg(imageDataUrl);
      }
      
      const response = await fetch(`/api/playlists/${params.id}/cover`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageBase64: jpegDataUrl,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to upload cover image');
      }
      
      const data = await response.json();
      
      // Update the playlist in state with the new image URL
      if (data.imageUrl && playlist) {
        setPlaylist({
          ...playlist,
          image_url: data.imageUrl,
        });
      }
      
      toast.success('Cover image updated successfully!', { id: toastId });
    } catch (error) {
      console.error('Error uploading cover image:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to upload cover image', { id: toastId });
    } finally {
      setIsUploading(false);
      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  // Convert PNG to JPEG using Canvas
  const convertPngToJpeg = (pngDataUrl: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Could not get canvas context'));
          return;
        }
        
        // Fill with white background (since JPEG doesn't support transparency)
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw the image on top
        ctx.drawImage(img, 0, 0);
        
        // Convert to JPEG data URL
        const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.9);
        resolve(jpegDataUrl);
      };
      
      img.onerror = () => {
        reject(new Error('Error loading image'));
      };
      
      img.src = pngDataUrl;
    });
  };

  // Loading state
  if (isLoading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#121212]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#1DB954] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-xl font-medium">Loading playlist...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#121212]">
        <div className="bg-[#181818] rounded-2xl p-6 max-w-md w-full text-center">
          <div className="text-red-500 text-5xl mb-4">😞</div>
          <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
          <p className="mb-6 text-[#A3A3A3]">{error}</p>
          <Button href="/dashboard" variant="primary">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // No playlist found
  if (!playlist) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#121212]">
        <div className="bg-[#181818] rounded-2xl p-6 max-w-md w-full text-center">
          <div className="text-5xl mb-4">🧐</div>
          <h1 className="text-2xl font-bold mb-4">Playlist Not Found</h1>
          <p className="mb-6 text-[#A3A3A3]">We couldn't find the playlist you're looking for.</p>
          <Button href="/dashboard" variant="primary">
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212] text-white">
      {/* Header with logo */}
      <header className="bg-[#181818]/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center">
            <img src="/images/diggr.png" alt="Diggr" className="h-12" />
          </Link>
          <div className="flex items-center space-x-4">
            <Button 
              href="/playlists" 
              variant="outline"
              size="md"
              icon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M9 17L5 12M5 12L9 7M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              }
            >
              All Playlists
            </Button>
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
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-center md:items-start gap-8 mb-10">
          {/* Playlist Image with Upload Option */}
          <div className="w-64 h-64 flex-shrink-0 relative group">
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
            
            {/* Overlay for upload button */}
            <div className="absolute inset-0 bg-black/60 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center">
              <p className="text-sm text-white/80 mb-2">Change cover image</p>
              <input
                type="file"
                accept="image/jpeg,image/png"
                className="hidden"
                onChange={handleFileChange}
                ref={fileInputRef}
                disabled={isUploading}
              />
              <motion.button
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-3 bg-[#1DB954] text-white rounded-full text-sm font-medium"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                disabled={isUploading}
              >
                {isUploading ? 'Uploading...' : 'Upload Image'}
              </motion.button>
              <p className="text-xs text-white/60 mt-2 px-4 text-center">
                JPEG/PNG, max 256KB
              </p>
            </div>
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
    </div>
  );
} 