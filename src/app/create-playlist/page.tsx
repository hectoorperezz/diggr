'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useSupabase } from '@/components/providers/SupabaseProvider';
import { 
  GenreSelection,
  MoodSelection,
  EraSelection,
  RegionSelection,
  PlaylistDetails,
  Review
} from '@/components/playlist-wizard';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import Button from '@/components/ui/Button';

// Define the wizard steps
type WizardStep = 'genre' | 'mood' | 'era' | 'region' | 'details' | 'review';

// Define the form data structure
export interface PlaylistFormData {
  // Genres
  genres: string[];
  subGenres: string[];
  
  // Moods
  moods: string[];
  
  // Era
  eras: string[];
  
  // Region and Language
  regions: string[];
  languages: string[];
  
  // Playlist details
  playlistName: string;
  description: string;
  trackCount: number;
  isPublic: boolean;
  uniquenessLevel: number; // 1-5 scale (mainstream to deep cuts)
  coverImage?: string; // Base64 encoded image data
}

export default function CreatePlaylistPage() {
  const router = useRouter();
  const { session, isLoading: authLoading } = useSupabase();
  
  // State for tracking current step
  const [currentStep, setCurrentStep] = useState<WizardStep>('genre');
  
  // Loading state
  const [isLoading, setIsLoading] = useState(false);
  
  // Form data state
  const [formData, setFormData] = useState<PlaylistFormData>({
    genres: [],
    subGenres: [],
    moods: [],
    eras: [],
    regions: [],
    languages: [],
    playlistName: '',
    description: '',
    trackCount: 25,
    isPublic: true,
    uniquenessLevel: 3,
    coverImage: undefined
  });
  
  // Update form data
  const updateFormData = (field: keyof PlaylistFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Handle navigation
  const nextStep = () => {
    if (currentStep === 'genre') setCurrentStep('mood');
    else if (currentStep === 'mood') setCurrentStep('era');
    else if (currentStep === 'era') setCurrentStep('region');
    else if (currentStep === 'region') setCurrentStep('details');
    else if (currentStep === 'details') setCurrentStep('review');
    
    window.scrollTo(0, 0);
  };
  
  const prevStep = () => {
    if (currentStep === 'mood') setCurrentStep('genre');
    else if (currentStep === 'era') setCurrentStep('mood');
    else if (currentStep === 'region') setCurrentStep('era');
    else if (currentStep === 'details') setCurrentStep('region');
    else if (currentStep === 'review') setCurrentStep('details');
    
    window.scrollTo(0, 0);
  };
  
  // Calculate progress percentage
  const progressSteps: WizardStep[] = ['genre', 'mood', 'era', 'region', 'details', 'review'];
  const currentStepIndex = progressSteps.indexOf(currentStep);
  const progressPercentage = ((currentStepIndex) / (progressSteps.length - 1)) * 100;

  // Define creation process states
  const [creationStep, setCreationStep] = useState<string>('idle');
  const [creationProgress, setCreationProgress] = useState(0);

  // Handle form submission with improved UI feedback
  const handleSubmit = async () => {
    if (!session?.user) {
      router.push('/auth?returnTo=/create-playlist');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Check if user can create more playlists based on subscription
      const quotaResponse = await fetch('/api/user/subscription');
      if (!quotaResponse.ok) {
        throw new Error('Failed to check subscription status');
      }
      
      const quota = await quotaResponse.json();
      
      // If user is on free plan and has reached limit, redirect to pricing page
      if (!quota.isPremium && quota.playlistsCreated >= quota.playlistLimit) {
        toast.error(`You've reached the limit of ${quota.playlistLimit} playlists this month. Upgrade to Pro for unlimited playlists!`);
        router.push('/pricing?reason=playlist_limit');
        return;
      }
      
      setCreationStep('generating');
      setCreationProgress(10);
      
      // Step 1: Generate recommendations with OpenAI
      setCreationStep('generating');
      setCreationProgress(20);
      
      const generateResponse = await fetch('/api/playlists/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ formData }),
      });
      
      setCreationProgress(40);
      
      if (!generateResponse.ok) {
        const errorData = await generateResponse.json();
        console.error('Error generating playlist:', errorData);
        
        // Handle specific errors
        if (errorData.needsSpotifyConnection) {
          // Redirect to settings page to connect Spotify
          router.push('/settings?error=spotify_connection_required');
          return;
        }
        
        throw new Error(errorData.error || 'Failed to generate playlist recommendations');
      }
      
      const generatedData = await generateResponse.json();
      console.log('Generated playlist data:', generatedData);
      
      setCreationStep('finding_tracks');
      setCreationProgress(60);
      
      // Step 2: Create the playlist in Spotify
      if (generatedData.spotifyTracks && generatedData.spotifyTracks.length > 0) {
        setCreationStep('creating_playlist');
        setCreationProgress(80);
        
        const createResponse = await fetch('/api/playlists/create', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: formData.playlistName,
            description: formData.description,
            isPublic: formData.isPublic,
            tracks: generatedData.spotifyTracks,
            coverImage: formData.coverImage,
            criteria: {
              genres: formData.genres,
              subGenres: formData.subGenres,
              moods: formData.moods,
              eras: formData.eras,
              regions: formData.regions,
              languages: formData.languages,
              uniquenessLevel: formData.uniquenessLevel
            }
          }),
        });
        
        setCreationProgress(90);
        
        if (!createResponse.ok) {
          const errorData = await createResponse.json();
          console.error('Error creating Spotify playlist:', errorData);
          throw new Error(errorData.error || 'Failed to create playlist in Spotify');
        }
        
        const createdPlaylist = await createResponse.json();
        console.log('Created playlist:', createdPlaylist);
        
        setCreationStep('complete');
        setCreationProgress(100);
        
        // Add a longer delay before redirecting to ensure cover image is fully processed
        if (formData.coverImage) {
          setCreationStep('finalizing');
          // Wait for cover image to be fully processed by Spotify
          setTimeout(() => {
            router.push(`/playlists/${createdPlaylist.dbPlaylist.id}?success=true`);
          }, 2000); // Longer delay to ensure cover image is processed
        } else {
          // No cover image, redirect with a shorter delay
          setTimeout(() => {
            router.push(`/playlists/${createdPlaylist.dbPlaylist.id}?success=true`);
          }, 1000);
        }
      } else {
        throw new Error('No tracks found for your criteria. Please try different selections.');
      }
    } catch (error) {
      console.error('Error creating playlist:', error);
      setCreationStep('error');
      setIsLoading(false);
      toast.error(error instanceof Error ? error.message : 'An unexpected error occurred');
    }
  };

  // Animation variants
  const pageVariants = {
    hidden: { opacity: 0, x: 50 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: { 
        type: "spring", 
        stiffness: 300, 
        damping: 25 
      } 
    },
    exit: { 
      opacity: 0, 
      x: -50,
      transition: { 
        ease: "easeInOut",
        duration: 0.3
      } 
    }
  };

  // Get step content based on current step
  const renderStepContent = () => {
    switch (currentStep) {
      case 'genre':
        return <GenreSelection formData={formData} updateFormData={updateFormData} />;
      case 'mood':
        return <MoodSelection formData={formData} updateFormData={updateFormData} />;
      case 'era':
        return <EraSelection formData={formData} updateFormData={updateFormData} />;
      case 'region':
        return <RegionSelection formData={formData} updateFormData={updateFormData} />;
      case 'details':
        return <PlaylistDetails formData={formData} updateFormData={updateFormData} />;
      case 'review':
        return <Review formData={formData} updateFormData={updateFormData} />;
      default:
        return <div>Invalid step</div>;
    }
  };

  const getCreationMessage = () => {
    switch (creationStep) {
      case 'generating':
        return 'Generating playlist recommendations...';
      case 'finding_tracks':
        return 'Finding the perfect tracks for your playlist...';
      case 'creating_playlist':
        return 'Creating your playlist in Spotify...';
      case 'finalizing':
        return 'Finalizing your playlist with custom cover...';
      case 'complete':
        return 'Playlist created successfully!';
      case 'error':
        return 'Error creating playlist';
      default:
        return 'Processing...';
    }
  };
  
  const getCreationEmoji = () => {
    switch (creationStep) {
      case 'generating':
        return '🧠';
      case 'finding_tracks':
        return '🔍';
      case 'creating_playlist':
        return '🎵';
      case 'finalizing':
        return '🖼️';
      case 'complete':
        return '✅';
      case 'error':
        return '❌';
      default:
        return '⏳';
    }
  };

  // Show loading state during playlist creation
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black overflow-hidden">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-[#121212]"></div>
          <div className="absolute top-0 -left-40 w-96 h-96 bg-gradient-to-br from-purple-500/20 via-[#1DB954]/20 to-transparent rounded-full filter blur-3xl opacity-50 animate-blob"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-br from-[#1DB954]/20 via-purple-500/20 to-transparent rounded-full filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
        </div>
        
        <motion.div
          className="relative bg-[#181818]/80 backdrop-filter backdrop-blur-lg border border-white/5 rounded-3xl p-8 max-w-md w-full"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="text-center mb-6">
            <div className="text-5xl mb-4">{getCreationEmoji()}</div>
            <h1 className="text-2xl font-bold mb-2">{getCreationMessage()}</h1>
            <p className="text-[#A3A3A3]">This may take a moment</p>
          </div>
          
          <div className="relative h-6 w-full bg-[#121212] rounded-full mb-4 overflow-hidden">
            <motion.div 
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#1DB954] to-purple-500 rounded-full"
              initial={{ width: "0%" }}
              animate={{ width: `${creationProgress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          
          <p className="text-center text-sm text-[#A3A3A3]">{creationProgress}% complete</p>
        </motion.div>
      </div>
    );
  }

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
        
        {/* Progress bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-[#A3A3A3]">Step {currentStepIndex + 1} of {progressSteps.length}</span>
            <span className="text-sm text-[#A3A3A3]">{Math.round(progressPercentage)}% complete</span>
          </div>
          <div className="h-2 w-full bg-[#181818] rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-[#1DB954] to-purple-500 rounded-full"
              initial={{ width: `${progressPercentage}%` }}
              animate={{ width: `${progressPercentage}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </motion.header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div
          className="relative"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={pageVariants}
              className="min-h-[50vh]"
            >
              <div className="relative">
                <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-[#1DB954]/30 via-purple-500/20 to-[#1DB954]/30 opacity-60 blur-lg -z-10"></div>
                <motion.div 
                  className="relative bg-[#181818]/80 backdrop-filter backdrop-blur-md border border-white/5 p-8 rounded-2xl"
                  whileHover={{ boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)" }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  {renderStepContent()}
                  
                  <div className="mt-8 pt-6 border-t border-[#121212] flex justify-between">
                    {currentStep !== 'genre' ? (
                      <motion.button
                        onClick={prevStep}
                        className="relative overflow-hidden group rounded-full"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <div className="absolute inset-0 bg-white/10 group-hover:scale-105 transition-transform duration-300"></div>
                        <div className="absolute inset-[2px] rounded-full bg-black/50 backdrop-blur-xl z-10"></div>
                        <span className="relative z-20 px-6 py-2 inline-block font-medium text-white">
                          Previous
                        </span>
                      </motion.button>
                    ) : (
                      <div></div> // Empty div to maintain spacing
                    )}
                    
                    {currentStep !== 'review' ? (
                      <motion.button
                        onClick={nextStep}
                        className="relative overflow-hidden group rounded-full"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-[#1DB954] to-[#1DB954]/80 group-hover:scale-105 transition-transform duration-300"></div>
                        <div className="absolute inset-[2px] rounded-full bg-black/50 backdrop-blur-xl z-10"></div>
                        <span className="relative z-20 px-6 py-2 inline-block font-medium text-white">
                          Next
                        </span>
                      </motion.button>
                    ) : (
                      <motion.button
                        onClick={handleSubmit}
                        className="relative overflow-hidden group rounded-full"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-[#1DB954] to-purple-500 group-hover:scale-105 transition-transform duration-300"></div>
                        <div className="absolute inset-[2px] rounded-full bg-black/50 backdrop-blur-xl z-10"></div>
                        <span className="relative z-20 px-6 py-2 inline-block font-medium text-white">
                          Create Playlist
                        </span>
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </main>
    </div>
  );
} 