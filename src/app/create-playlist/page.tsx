'use client';

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useSupabase } from '@/components/providers/SupabaseProvider';
import { 
  GenreSelection,
  MoodSelection,
  EraSelection,
  RegionSelection,
  PlaylistDetails,
  Review,
  UserPrompt
} from '@/components/playlist-wizard';
import { toast } from 'react-hot-toast';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import ConditionalAdDisplay from '@/components/ads/ConditionalAdDisplay';
import AdBanner from '@/components/ads/AdBanner';

// For TypeScript
type UserProfileWithPlan = {
  id: string;
  email: string;
  spotify_connected: boolean;
  created_at: string;
  updated_at?: string;
  spotify_refresh_token?: string | null;
  plan_type?: 'free' | 'premium';
};

// Define the wizard steps
type WizardStep = 'genre' | 'mood' | 'era' | 'region' | 'details' | 'review' | 'prompt';

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
  
  // User prompt
  userPrompt: string;
  
  // Playlist details
  playlistName: string;
  description: string;
  trackCount: number;
  isPublic: boolean;
  uniquenessLevel: number; // 1-5 scale (mainstream to deep cuts)
}

export default function CreatePlaylistPage() {
  const router = useRouter();
  const { session, isLoading: authLoading, userProfile } = useSupabase();
  
  // Type assertion for userProfile to include plan_type
  const userProfileWithPlan = userProfile as UserProfileWithPlan | null;
  
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
    userPrompt: '',
    playlistName: '',
    description: '',
    trackCount: 25,
    isPublic: true,
    uniquenessLevel: 3
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
    if (currentStep === 'genre') setCurrentStep('era');
    else if (currentStep === 'era') setCurrentStep('region');
    else if (currentStep === 'region') setCurrentStep('mood');
    else if (currentStep === 'mood') setCurrentStep('prompt');
    else if (currentStep === 'prompt') setCurrentStep('details');
    else if (currentStep === 'details') setCurrentStep('review');
    
    window.scrollTo(0, 0);
  };
  
  const prevStep = () => {
    if (currentStep === 'era') setCurrentStep('genre');
    else if (currentStep === 'region') setCurrentStep('era');
    else if (currentStep === 'mood') setCurrentStep('region');
    else if (currentStep === 'prompt') setCurrentStep('mood');
    else if (currentStep === 'details') setCurrentStep('prompt');
    else if (currentStep === 'review') setCurrentStep('details');
    
    window.scrollTo(0, 0);
  };
  
  // Calculate progress percentage
  const progressSteps: WizardStep[] = ['genre', 'era', 'region', 'mood', 'prompt', 'details', 'review'];
  const currentStepIndex = progressSteps.indexOf(currentStep);
  const progressPercentage = ((currentStepIndex) / (progressSteps.length - 1)) * 100;

  // Handle direct step navigation with validation
  const handleStepChange = (step: WizardStep) => {
    // Always allow navigation to any step
    setCurrentStep(step);
    
    // Scroll to top when changing steps
    window.scrollTo(0, 0);
  };

  // Define creation process states
  const [creationStep, setCreationStep] = useState<string>('idle');
  const [creationProgress, setCreationProgress] = useState(0);
  const [playlistId, setPlaylistId] = useState<string | null>(null);

  // Function to simulate natural progress increments
  const simulateNaturalProgress = useCallback(() => {
    // Start with smaller increments that get larger as we go
    const progressIntervals = [
      { target: 10, delay: 2000, step: 1 },   // 0-10%: Very slow start
      { target: 25, delay: 3000, step: 1 },   // 10-25%: Still slow
      { target: 45, delay: 3500, step: 2 },   // 25-45%: Medium steps
      { target: 65, delay: 4000, step: 2 },   // 45-65%: Medium steps
      { target: 80, delay: 4500, step: 1 },   // 65-80%: Slowing down
      { target: 90, delay: 5000, step: 0.5 }  // 80-90%: Very slow at the end
    ];
    
    let currentProgress = 0;
    
    // Process each interval
    const processInterval = (intervalIndex: number) => {
      if (intervalIndex >= progressIntervals.length) return;
      
      const interval = progressIntervals[intervalIndex];
      const timer = setInterval(() => {
        if (currentProgress >= interval.target) {
          clearInterval(timer);
          processInterval(intervalIndex + 1);
          return;
        }
        
        currentProgress += interval.step;
        setCreationProgress(currentProgress);
      }, interval.delay / (interval.target / interval.step));
    };
    
    // Start the progress simulation
    processInterval(0);
  }, []);

  // Handle form submission with improved UI feedback
  const handleSubmit = async () => {
    if (!session?.user) {
      router.push('/auth?returnTo=/create-playlist');
      return;
    }
    
    setIsLoading(true);
    simulateNaturalProgress(); // Start the natural progress simulation
    
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
      
      // Step 1: Generate recommendations with OpenAI
      const generateResponse = await fetch('/api/playlists/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ formData }),
      });
      
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
      
      // Step 2: Create the playlist in Spotify
      if (generatedData.spotifyTracks && generatedData.spotifyTracks.length > 0) {
        setCreationStep('creating_playlist');
        
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
        
        if (!createResponse.ok) {
          const errorData = await createResponse.json();
          console.error('Error creating Spotify playlist:', errorData);
          throw new Error(errorData.error || 'Failed to create playlist in Spotify');
        }
        
        const createdPlaylist = await createResponse.json();
        console.log('Created playlist:', createdPlaylist);
        
        setCreationStep('complete');
        setCreationProgress(100);
        setPlaylistId(createdPlaylist.dbPlaylist.id);
        
        // Redirect directly to the playlist details page
        setTimeout(() => {
          router.push(`/playlists/${createdPlaylist.dbPlaylist.id}?success=true`);
        }, 1500); // Slightly longer delay to show 100% completion
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
  
  // Navigate to the created playlist
  const handleContinueToPlaylist = () => {
    if (!playlistId) return;
    router.push(`/playlists/${playlistId}?success=true`);
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
      case 'prompt':
        return <UserPrompt formData={formData} updateFormData={updateFormData} />;
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
        return 'Redirecting to your new playlist...';
      case 'error':
        return 'Error creating playlist';
      default:
        return 'Processing...';
    }
  };
  
  const getCreationEmoji = () => {
    switch (creationStep) {
      case 'generating':
        return <span className="inline-block transform scale-90 sm:scale-100">🧠</span>;
      case 'finding_tracks':
        return <span className="inline-block transform scale-90 sm:scale-100">🔍</span>;
      case 'creating_playlist':
        return <span className="inline-block transform scale-90 sm:scale-100">🎵</span>;
      case 'finalizing':
        return <span className="inline-block transform scale-90 sm:scale-100">🖼️</span>;
      case 'complete':
        return <span className="inline-block transform scale-90 sm:scale-100">✅</span>;
      case 'error':
        return <span className="inline-block transform scale-90 sm:scale-100">❌</span>;
      default:
        return <span className="inline-block transform scale-90 sm:scale-100">⏳</span>;
    }
  };

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
        
        {/* Step Navigation Bar - Modern Style (Replacing Progress Bar) */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          {!isLoading && (
            <>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-white">
                  Step <span className="text-[#1DB954]">{currentStepIndex + 1}</span> of {progressSteps.length}
                </span>
                <span className="text-sm font-medium text-white">
                  <span className="text-[#1DB954]">{Math.round(progressPercentage)}%</span> complete
                </span>
              </div>
              
              <div className="relative mt-6 mb-10">
                {/* Container for progress bar and steps */}
                <div className="relative max-w-4xl mx-auto px-4">
                  {/* Background track */}
                  <div className="absolute top-[25px] left-0 right-0 h-[2px] bg-[#333] transform z-0"></div>
                  
                  {/* Progress track - only show form progress, not creation progress */}
                  <motion.div 
                    className="absolute top-[25px] left-0 h-[2px] bg-[#1DB954] transform z-0"
                    style={{ 
                      width: `${(currentStepIndex / (progressSteps.length - 1)) * 100}%`
                    }}
                    initial={{ width: 0 }}
                    animate={{ 
                      width: `${(currentStepIndex / (progressSteps.length - 1)) * 100}%`
                    }}
                    transition={{ duration: 0.5 }}
                  />

                  {/* Step indicators */}
                  <div className="relative h-24">
                    {progressSteps.map((step, index) => {
                      const isPast = index < currentStepIndex;
                      const isActive = index === currentStepIndex;
                      const isComplete = isPast || isActive;
                      
                      // Calculate position for all steps
                      const position = `${(index / (progressSteps.length - 1)) * 100}%`;
                      
                      // Step labels for each step
                      const stepLabels: Record<WizardStep, string> = {
                        genre: 'Genres',
                        mood: 'Mood',
                        era: 'Era',
                        region: 'Region',
                        prompt: 'Prompt',
                        details: 'Details',
                        review: 'Review'
                      };
                      
                      // Step icons for active steps
                      const stepIcons: Record<WizardStep, string> = {
                        genre: '🎸',
                        mood: '😊',
                        era: '🕰️',
                        region: '🌎',
                        prompt: '💬',
                        details: '📝',
                        review: '✓'
                      };
                      
                      return (
                        <div 
                          key={step} 
                          className="flex flex-col items-center absolute transform -translate-x-1/2"
                          style={{ left: position }}
                        >
                          <motion.button
                            className="relative flex flex-col items-center justify-center cursor-pointer"
                            onClick={() => handleStepChange(step)}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            {/* Step indicator */}
                            <motion.div
                              className={`w-9 h-9 rounded-full flex items-center justify-center z-10 ${
                                isActive 
                                  ? 'bg-[#1DB954]' 
                                  : isPast
                                    ? 'bg-[#1DB954]'
                                    : 'bg-[#333]'
                              }`}
                              animate={isActive ? {
                                scale: [1, 1.1, 1],
                                boxShadow: ['0 0 0 0 rgba(29, 185, 84, 0)', '0 0 0 4px rgba(29, 185, 84, 0.3)', '0 0 0 0 rgba(29, 185, 84, 0)']
                              } : {}}
                              transition={{ duration: 2, repeat: isActive ? Infinity : 0, repeatType: "loop" }}
                            >
                              {isPast && (
                                <motion.svg 
                                  xmlns="http://www.w3.org/2000/svg" 
                                  className="h-4 w-4 text-white" 
                                  viewBox="0 0 20 20" 
                                  fill="currentColor"
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                >
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </motion.svg>
                              )}
                              {isActive && (
                                <motion.div
                                  className="flex items-center justify-center"
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  transition={{ type: "spring", stiffness: 500 }}
                                >
                                  <span className="text-sm font-medium text-white">{stepIcons[step]}</span>
                                </motion.div>
                              )}
                              {!isComplete && (
                                <span className="text-xs font-medium text-white">{index + 1}</span>
                              )}
                            </motion.div>
                            
                            {/* Step label */}
                            <motion.div 
                              className="mt-3"
                              initial={{ opacity: 0, y: 5 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.05 }}
                            >
                              <span className={`text-xs font-medium whitespace-nowrap ${
                                isActive 
                                  ? 'text-[#1DB954]' 
                                  : isPast
                                    ? 'text-white'
                                    : 'text-gray-500'
                              }`}>
                                {stepLabels[step]}
                              </span>
                            </motion.div>
                          </motion.button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </>
          )}
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
              key={isLoading ? 'loading' : currentStep}
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={pageVariants}
              className="min-h-[40vh] sm:min-h-[50vh]"
            >
              <div className="relative">
                <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-[#1DB954]/30 via-purple-500/20 to-[#1DB954]/30 opacity-60 blur-lg -z-10"></div>
                <motion.div 
                  className="relative bg-[#181818]/80 backdrop-filter backdrop-blur-md border border-white/5 p-4 sm:p-8 rounded-2xl"
                  whileHover={{ boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)" }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  {isLoading ? (
                    <div className="py-6 sm:py-12">
                      <div className="text-center mb-6 sm:mb-10">
                        <motion.div 
                          className="text-5xl sm:text-7xl mb-4 sm:mb-8"
                          animate={{ 
                            scale: [1, 1.2, 1],
                            rotate: [0, 5, 0, -5, 0],
                          }}
                          transition={{ 
                            duration: 2, 
                            repeat: Infinity, 
                            repeatType: "loop" 
                          }}
                        >
                          {getCreationEmoji()}
                        </motion.div>
                        <motion.h1 
                          className="text-2xl sm:text-3xl font-bold mb-2 sm:mb-4"
                          animate={{ opacity: [0.8, 1, 0.8] }}
                          transition={{ duration: 2, repeat: Infinity }}
                        >
                          {getCreationMessage()}
                        </motion.h1>
                        <p className="text-base sm:text-lg text-[#A3A3A3] max-w-lg mx-auto">
                          {creationStep === 'generating' && 'Our AI is crafting the perfect playlist for you'}
                          {creationStep === 'finding_tracks' && 'Searching Spotify for the best matches'}
                          {creationStep === 'creating_playlist' && 'Almost there! Adding tracks to your Spotify account'}
                          {creationStep === 'finalizing' && 'Adding finishing touches to your playlist'}
                          {creationStep === 'complete' && 'Redirecting to your new playlist...'}
                          {creationStep === 'error' && 'Please try again with different criteria'}
                        </p>
                      </div>
                      
                      <div className="relative h-8 sm:h-10 w-full max-w-2xl mx-auto bg-[#121212] rounded-full mb-6 sm:mb-10 overflow-hidden">
                        <motion.div 
                          className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#1DB954] to-purple-500 rounded-full"
                          initial={{ width: "0%" }}
                          animate={{ width: `${creationProgress}%` }}
                          transition={{ duration: 0.8 }}
                        />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-sm sm:text-base font-medium text-white">{Math.round(creationProgress)}%</span>
                        </div>
                      </div>
                      
                      {/* Animated music notes */}
                      <div className="relative h-20 sm:h-32 max-w-2xl mx-auto">
                        {[...Array(5)].map((_, i) => (
                          <motion.div
                            key={i}
                            className={`absolute text-[#1DB954]/50 text-${i % 2 === 0 ? '2xl' : 'xl'} sm:text-${i % 2 === 0 ? '3xl' : '2xl'}`}
                            initial={{ 
                              bottom: 0,
                              left: `${10 + i * 15}%`,
                              opacity: 0,
                              scale: 0.5,
                            }}
                            animate={{ 
                              bottom: ['0%', '100%'],
                              opacity: [0, 1, 0],
                              scale: [0.5, i % 2 === 0 ? 1.2 : 1, 0.5],
                              rotate: [0, i % 2 === 0 ? 15 : -15]
                            }}
                            transition={{ 
                              duration: 4 + i * 0.7,
                              repeat: Infinity,
                              delay: i * 0.8,
                              ease: "easeInOut"
                            }}
                          >
                            {i % 3 === 0 ? '♪' : i % 3 === 1 ? '♫' : '♬'}
                          </motion.div>
                        ))}
                      </div>
                      
                      {creationStep === 'error' && (
                        <div className="flex justify-center mt-6">
                          <Button
                            variant="outline"
                            size="md"
                            onClick={() => setIsLoading(false)}
                          >
                            Back to Form
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
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
                    </>
                  )}
                </motion.div>
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </main>
    </div>
  );
} 