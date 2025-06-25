import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import CheckoutButton from '@/components/stripe/CheckoutButton';

interface VideoAdComponentProps {
  onAdComplete?: () => void;
  onAdError?: (error: any) => void;
}

// Choose which approach to use
const USE_ADSENSE = false; // Set to true to use actual AdSense ads, false to use simulated video ad

/**
 * A component that displays a video ad with a skip timer
 * This simulates a video ad experience for free users
 */
const VideoAdComponent: React.FC<VideoAdComponentProps> = ({
  onAdComplete,
  onAdError,
}) => {
  const adContainerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [adError, setAdError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(5);
  const [isPlaying, setIsPlaying] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // For simulated video ad
  const [simulatedProgress, setSimulatedProgress] = useState(0);
  
  // Handle ad initialization
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    if (USE_ADSENSE) {
      try {
        // Initialize Google AdSense
        const adScript = document.createElement('script');
        adScript.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js";
        adScript.async = true;
        adScript.crossOrigin = "anonymous";
        adScript.dataset.adClient = "ca-pub-3838039470797804"; // User's Publisher ID
        document.head.appendChild(adScript);
        
        adScript.onload = () => {
          if (adContainerRef.current) {
            try {
              (window.adsbygoogle = window.adsbygoogle || []).push({});
              setIsLoaded(true);
              
              // Track ad impression in Google Analytics
              if (window.gtag) {
                window.gtag('event', 'ad_impression', {
                  'event_category': 'ads',
                  'event_label': 'playlist_creation'
                });
              }
              
              // For development testing - simulate ad loading
              if (process.env.NODE_ENV === 'development') {
                console.log('DEV MODE: Simulating ad display');
                setTimeout(() => {
                  console.log('DEV MODE: Simulated ad completed');
                  // Auto-complete the ad after 6 seconds in dev mode
                  setTimeLeft(0);
                }, 6000);
              }
            } catch (e) {
              console.error("Ad push error:", e);
              setAdError("Failed to load advertisement");
              onAdError?.(e);
            }
          }
        };
        
        // Error handling
        adScript.onerror = (e) => {
          console.error("Ad loading error:", e);
          setAdError("Failed to load advertisement");
          onAdError?.(e);
        };
        
        // Cleanup
        return () => {
          try {
            if (document.head.contains(adScript)) {
              document.head.removeChild(adScript);
            }
          } catch (e) {
            console.error("Error removing ad script:", e);
          }
        };
      } catch (e) {
        console.error("Ad initialization error:", e);
        setAdError("Failed to load advertisement");
        onAdError?.(e);
      }
    } else {
      // Simulated video ad - just set to loaded after a short delay
      const timer = setTimeout(() => {
        setIsLoaded(true);
        
        // Track simulated ad impression in analytics
        if (window.gtag) {
          window.gtag('event', 'ad_impression', {
            'event_category': 'ads',
            'event_label': 'simulated_video_ad'
          });
        }
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [onAdError]);
  
  // Start the countdown timer
  useEffect(() => {
    if (!isPlaying) return;
    
    if (timeLeft > 0) {
      const timerId = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      
      return () => clearTimeout(timerId);
    }
  }, [timeLeft, isPlaying]);
  
  // Simulated video progress
  useEffect(() => {
    if (isLoaded && !USE_ADSENSE && simulatedProgress < 100) {
      const interval = setInterval(() => {
        setSimulatedProgress(prev => Math.min(prev + 1, 100));
      }, 150);
      
      return () => clearInterval(interval);
    }
  }, [isLoaded, simulatedProgress]);
  
  // Track ad impression in analytics
  useEffect(() => {
    try {
      if (window.gtag) {
        window.gtag('event', 'video_ad_impression', {
          'event_category': 'ads',
          'event_label': 'playlist_creation'
        });
      }
    } catch (error) {
      console.error('Error tracking ad impression:', error);
    }
  }, []);
  
  // Handle ad completion
  const handleAdComplete = () => {
    try {
      if (window.gtag) {
        window.gtag('event', 'video_ad_complete', {
          'event_category': 'ads',
          'event_label': 'playlist_creation'
        });
      }
      
      if (onAdComplete) {
        onAdComplete();
      }
    } catch (error) {
      console.error('Error completing ad:', error);
      if (onAdError) {
        onAdError(error);
      }
    }
  };
  
  // Handle ad skip
  const handleAdSkip = () => {
    try {
      if (window.gtag) {
        window.gtag('event', 'video_ad_skip', {
          'event_category': 'ads',
          'event_label': 'playlist_creation'
        });
      }
      
      if (onAdComplete) {
        onAdComplete();
      }
    } catch (error) {
      console.error('Error skipping ad:', error);
      if (onAdError) {
        onAdError(error);
      }
    }
  };
  
  // Handle video error
  const handleVideoError = (error: any) => {
    console.error('Video ad error:', error);
    if (onAdError) {
      onAdError(error);
    }
  };
  
  // Handle video pause/play
  const togglePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };
  
  return (
    <div className="relative bg-black rounded-xl overflow-hidden w-full max-w-2xl mx-auto">
      {/* Brand overlay - shows who is advertising */}
      <div className="absolute top-4 left-4 z-20 bg-black/50 backdrop-blur-sm py-1 px-3 rounded-full">
        <div className="flex items-center">
          <img src="/images/diggr.png" alt="Diggr" className="h-5 mr-2" />
          <span className="text-xs font-medium">Diggr Premium</span>
        </div>
      </div>
      
      {/* Skip button - disabled until timer reaches 0 */}
      <div className="absolute bottom-4 right-4 z-20">
        <button 
          className={`py-2 px-4 rounded-full text-sm font-medium flex items-center ${
            timeLeft > 0 
              ? 'bg-white/20 text-white/50 cursor-not-allowed' 
              : 'bg-white text-black hover:bg-opacity-90'
          }`}
          onClick={timeLeft === 0 ? handleAdSkip : undefined}
          disabled={timeLeft > 0}
        >
          {timeLeft > 0 ? `Skip ad in ${timeLeft}` : 'Skip ad'}
        </button>
      </div>
      
      {/* Play/Pause button */}
      <div className="absolute bottom-4 left-4 z-20">
        <button 
          className="w-8 h-8 bg-black/50 rounded-full flex items-center justify-center"
          onClick={togglePlayPause}
        >
          {isPlaying ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white">
              <path d="M10 4H6V20H10V4Z" fill="currentColor" />
              <path d="M18 4H14V20H18V4Z" fill="currentColor" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white">
              <path d="M6 4L18 12L6 20V4Z" fill="currentColor" />
            </svg>
          )}
        </button>
      </div>
      
      {/* Ad content - in a real implementation, this would be a real video ad */}
      <div className="relative aspect-video w-full bg-gradient-to-r from-purple-900 via-[#1DB954] to-purple-900">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          autoPlay
          muted
          playsInline
          onEnded={handleAdComplete}
          onError={handleVideoError}
          loop
        >
          <source src="/videos/premium-ad.mp4" type="video/mp4" />
          {/* Fallback for browsers that don't support video */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <h3 className="text-xl font-bold mb-2">Upgrade to Diggr Premium</h3>
              <p className="text-sm">Enjoy ad-free music recommendations</p>
            </div>
          </div>
        </video>
        
        {/* Overlay with animated elements when no video is available */}
        <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
          {/* Premium logo */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1 }}
            className="mb-6"
          >
            <div className="bg-black/30 backdrop-blur-md px-6 py-3 rounded-full">
              <div className="flex items-center">
                <img src="/images/diggr.png" alt="Diggr" className="h-8 mr-3" />
                <span className="text-xl font-bold">Diggr Premium</span>
              </div>
            </div>
          </motion.div>
          
          {/* Premium message */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-center mb-8"
          >
            <h2 className="text-2xl md:text-3xl font-bold mb-2">Upgrade to Premium</h2>
            <p className="text-lg text-white/80">Unlimited playlists. No ads. Better recommendations.</p>
          </motion.div>
          
          {/* CTA Button */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="relative"
            onClick={(e) => {
              // Track conversion click in analytics
              if (window.gtag) {
                window.gtag('event', 'premium_conversion_click', {
                  'event_category': 'ads',
                  'event_label': 'video_ad'
                });
              }
            }}
          >
            <CheckoutButton
              returnUrl={typeof window !== 'undefined' ? window.location.origin + '/settings' : ''}
              buttonText="Get Premium Now"
              variant="primary"
              className="relative overflow-hidden group rounded-full bg-gradient-to-r from-[#1DB954] to-purple-500 hover:scale-105 transition-transform duration-300"
            />
          </motion.div>
          
          {/* Progress bar */}
          <motion.div 
            className="absolute bottom-0 left-0 right-0 h-1 bg-white/20"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 5, ease: "linear" }}
            onAnimationComplete={handleAdComplete}
          >
            <div className="h-full bg-[#1DB954]"></div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default VideoAdComponent; 