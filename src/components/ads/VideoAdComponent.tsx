import React, { useEffect, useRef, useState } from 'react';

// Add type declarations for global objects
declare global {
  interface Window {
    adsbygoogle: any[];
    gtag: (command: string, action: string, params?: any) => void;
  }
}

interface VideoAdProps {
  onAdComplete?: () => void;
  onAdError?: (error: any) => void;
}

const VideoAdComponent: React.FC<VideoAdProps> = ({
  onAdComplete,
  onAdError,
}) => {
  const adContainerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [adError, setAdError] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(5); // Skip countdown
  const [canSkip, setCanSkip] = useState(false);
  
  // Handle ad initialization
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      // Initialize Google AdSense
      const adScript = document.createElement('script');
      adScript.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js";
      adScript.async = true;
      adScript.crossOrigin = "anonymous";
      adScript.dataset.adClient = "ca-pub-XXXXXXXXXXXXXXXX"; // Replace with your Publisher ID
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
            
            // For development testing
            if (process.env.NODE_ENV === 'development') {
              console.log('DEV MODE: Simulating ad display');
              setTimeout(() => {
                console.log('DEV MODE: Simulated ad completed');
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
  }, [onAdError]);
  
  // Skip button timer
  useEffect(() => {
    if (isLoaded && timeRemaining > 0) {
      const timer = setTimeout(() => {
        setTimeRemaining(timeRemaining - 1);
      }, 1000);
      
      return () => clearTimeout(timer);
    } else if (isLoaded && timeRemaining === 0) {
      setCanSkip(true);
    }
  }, [timeRemaining, isLoaded]);
  
  // Handle ad completion
  const handleSkip = () => {
    // Track skip event in Google Analytics
    if (window.gtag) {
      window.gtag('event', 'ad_skipped', {
        'event_category': 'ads',
        'event_label': 'playlist_creation'
      });
    }
    
    onAdComplete?.();
  };
  
  return (
    <div className="video-ad-container relative w-full max-w-xl mx-auto">
      {/* Loading state */}
      {!isLoaded && !adError && (
        <div className="flex flex-col items-center justify-center h-40 bg-black/20 backdrop-blur-lg rounded-xl p-6">
          <div className="animate-spin h-10 w-10 border-4 border-[#1DB954] border-t-transparent rounded-full mb-4"></div>
          <p className="text-gray-300">Loading advertisement...</p>
        </div>
      )}
      
      {/* Error state */}
      {adError && (
        <div className="bg-black/20 backdrop-blur-lg rounded-xl p-6 text-center">
          <p className="text-red-400 mb-4">Unable to load advertisement</p>
          <button
            onClick={handleSkip}
            className="px-4 py-2 bg-[#1DB954] rounded-full text-sm"
          >
            Continue to Your Playlist
          </button>
        </div>
      )}
      
      {/* Ad display */}
      <div className={`ad-wrapper relative ${!isLoaded ? 'hidden' : ''}`}>
        <ins
          className="adsbygoogle"
          style={{ display: 'block', minHeight: '250px' }}
          data-ad-client="ca-pub-XXXXXXXXXXXXXXXX" // Replace with your Publisher ID
          data-ad-slot="XXXXXXXXXX" // Replace with your Ad Slot ID
          data-ad-format="video"
          ref={adContainerRef as any}
        />
        
        {/* Skip button */}
        <div className="absolute bottom-4 right-4 z-10">
          {canSkip ? (
            <button
              onClick={handleSkip}
              className="px-3 py-1 bg-black/70 text-white text-sm rounded-full flex items-center"
            >
              Skip Ad
              <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ) : (
            <div className="px-3 py-1 bg-black/70 text-white/70 text-sm rounded-full">
              Skip in {timeRemaining}s
            </div>
          )}
        </div>
      </div>
      
      {/* Premium upgrade CTA */}
      {isLoaded && (
        <div className="mt-4 bg-black/30 backdrop-blur-md rounded-xl p-4 text-center">
          <p className="text-sm text-gray-300 mb-2">
            Enjoy an ad-free experience with Diggr Premium
          </p>
          <a
            href="/pricing"
            className="inline-block px-4 py-2 bg-gradient-to-r from-[#1DB954] to-purple-500 rounded-full text-sm font-medium"
            onClick={() => {
              // Track upgrade click
              if (window.gtag) {
                window.gtag('event', 'premium_cta_click', {
                  'event_category': 'conversion',
                  'event_label': 'from_ad'
                });
              }
            }}
          >
            Upgrade to Premium
          </a>
        </div>
      )}
    </div>
  );
};

export default VideoAdComponent; 