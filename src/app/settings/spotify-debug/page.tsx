'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

// Loading fallback component
function SpotifyDebugLoading() {
  return (
    <div className="min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-6">Spotify Integration Debug</h1>
      <div className="flex items-center space-x-2">
        <svg className="animate-spin h-5 w-5 text-[#1DB954]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span>Loading...</span>
      </div>
    </div>
  );
}

// Main component that uses searchParams
function SpotifyDebugContent() {
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [timeTaken, setTimeTaken] = useState<number | null>(null);

  useEffect(() => {
    async function debugTokenExchange() {
      try {
        if (!searchParams) {
          setError('Search parameters not available');
          setIsLoading(false);
          return;
        }
        
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        const startTime = Date.now();

        if (!code) {
          setError('No authorization code found in URL');
          setIsLoading(false);
          return;
        }

        // Use the environment variable for redirect URI
        const redirectUri = process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI || `${window.location.origin}/api/auth/callback/spotify`;
        
        // Display the redirect URI being used
        console.log('Using redirect URI:', redirectUri);
        
        // Call our debug API endpoint
        const response = await fetch('/api/spotify/debug', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code,
            redirect_uri: redirectUri,
          }),
        });

        const data = await response.json();
        setResult(data);
        setTimeTaken(Date.now() - startTime);
        
        if (!response.ok) {
          if (data.error === 'Invalid authorization code') {
            setError('The authorization code has expired or has already been used. Try connecting again from the settings page.');
          } else {
            setError(data.error || 'Unknown error occurred');
          }
        }
      } catch (err: any) {
        console.error('Error in debug page:', err);
        setError(err.message || 'An unexpected error occurred');
      } finally {
        setIsLoading(false);
      }
    }

    debugTokenExchange();
  }, [searchParams]);

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-6">Spotify Integration Debug</h1>
      
      {isLoading ? (
        <div className="flex items-center space-x-2">
          <svg className="animate-spin h-5 w-5 text-[#1DB954]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span>Testing Spotify token exchange...</span>
        </div>
      ) : (
        <div>
          {error ? (
            <div className="p-4 bg-red-500/10 border border-red-500 rounded-md mb-4">
              <h2 className="text-lg font-semibold text-red-500 mb-2">Error</h2>
              <p className="whitespace-pre-wrap">{error}</p>
              
              {error.includes('authorization code') && (
                <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500 rounded-md">
                  <h3 className="font-semibold mb-1 text-yellow-500">Authorization Code Issues</h3>
                  <p>Spotify authorization codes:</p>
                  <ul className="list-disc list-inside mt-2 ml-2 space-y-1">
                    <li>Can only be used once</li>
                    <li>Expire quickly (usually within a minute)</li>
                    <li>Must be used with the exact same redirect URI that was used to get them</li>
                  </ul>
                  <p className="mt-3">Time taken: {timeTaken ? `${timeTaken}ms` : 'Unknown'}</p>
                  <p className="mt-1 text-sm">If this is more than 60 seconds, the code likely expired before use.</p>
                </div>
              )}
              
              {result?.details && (
                <div className="mt-4">
                  <h3 className="font-semibold mb-1">Details:</h3>
                  <pre className="p-2 bg-black/50 rounded overflow-x-auto text-xs">
                    {typeof result.details === 'string' 
                      ? result.details 
                      : JSON.stringify(result.details, null, 2)
                    }
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 bg-green-500/10 border border-green-500 rounded-md mb-4">
              <h2 className="text-lg font-semibold text-green-500 mb-2">Success</h2>
              <p className="mb-2">Successfully exchanged the authorization code for tokens!</p>
              <p className="text-sm mb-3">Time taken: {timeTaken ? `${timeTaken}ms` : 'Unknown'}</p>
              <pre className="p-2 bg-black/50 rounded overflow-x-auto text-xs">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
          
          <div className="flex space-x-4 mt-6">
            <Link 
              href="/settings" 
              className="px-4 py-2 bg-[#181818] rounded-md hover:bg-[#282828] transition-colors"
            >
              Back to Settings
            </Link>
            <button 
              onClick={() => window.location.href = '/settings'}
              className="px-4 py-2 bg-[#1DB954] text-white rounded-md hover:bg-[#1ED760] transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Main export that wraps in Suspense
export default function SpotifyDebugPage() {
  return (
    <Suspense fallback={<SpotifyDebugLoading />}>
      <SpotifyDebugContent />
    </Suspense>
  );
} 