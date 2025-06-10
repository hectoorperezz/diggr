'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export default function SpotifyDebugPage() {
  const router = useRouter();
  const [logs, setLogs] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const addLog = (message: string) => {
    console.log(message);
    setLogs(prev => [...prev, `${new Date().toISOString().substring(11, 19)}: ${message}`]);
  };
  
  const attemptSpotifyAuth = async () => {
    setIsLoading(true);
    try {
      addLog('Creating Supabase client...');
      const supabase = createClient();
      addLog('Supabase client created successfully');
      
      // First get current session state
      const { data: sessionData } = await supabase.auth.getSession();
      addLog(`Current session: ${sessionData.session ? 'Active' : 'None'}`);
      
      // Try Spotify login with debug scopes
      addLog('Initiating Spotify auth with minimal scopes...');
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'spotify',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          scopes: 'user-read-email', // Minimal scope to test
          queryParams: {
            // Add a debug parameter to identify this auth attempt
            debug_attempt: 'true' 
          }
        }
      });
      
      if (error) {
        addLog(`Spotify auth error: ${error.message}`);
      } else if (data && data.url) {
        addLog(`Auth initiated! Redirecting to Spotify...`);
        addLog(`URL: ${data.url.substring(0, 60)}...`);
        // Don't need to manually redirect, the SDK will do it
      }
    } catch (err: any) {
      addLog(`Unexpected error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Spotify Auth Debug</h1>
        <p className="mb-6 text-gray-400">This page tests Spotify authentication with minimal scopes and enhanced logging.</p>
        
        <div className="bg-[#121212]/60 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/5 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Spotify Authentication</h2>
          
          <button
            onClick={attemptSpotifyAuth}
            disabled={isLoading}
            className="w-full px-4 py-3 rounded-xl font-medium transition-all duration-200 
                    bg-[#1DB954] text-white hover:bg-[#1DB954]/90 
                    disabled:opacity-50 disabled:cursor-not-allowed
                    flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Connecting to Spotify...
              </>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
                  <path d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2Z" fill="#1DB954"/>
                  <path d="M16.7294 16.5891C16.4862 16.977 15.977 17.091 15.5891 16.8479C13.3614 15.4902 10.6134 15.1256 6.60943 16.0641C6.16495 16.1604 5.72621 15.8771 5.62986 15.4327C5.53351 14.9882 5.81683 14.5495 6.26132 14.4531C10.6526 13.4182 13.765 13.8444 16.3337 15.4185C16.7216 15.6617 16.8355 16.1709 16.5924 16.5587M16.4384 13.5332C16.1377 14.0123 15.5102 14.153 15.031 13.8523C12.4711 12.2778 8.86808 11.7566 5.93771 12.8446C5.40461 13.0192 4.82301 12.7344 4.64846 12.2013C4.47392 11.6682 4.7587 11.0866 5.29179 10.9121C8.7564 9.64038 12.8255 10.2245 15.8194 12.0957C16.2985 12.3964 16.4392 13.0239 16.1385 13.5031M16.5581 10.3533C13.4449 8.52345 8.39277 8.36323 5.19385 9.46837C4.55877 9.67496 3.86965 9.32765 3.66306 8.69257C3.45648 8.05749 3.80378 7.36837 4.43886 7.16179C8.15326 5.87824 13.8498 6.07131 17.511 8.22583C18.0824 8.57457 18.2521 9.31449 17.9034 9.88586C17.5547 10.4572 16.8147 10.627 16.2434 10.2782" fill="white"/>
                </svg>
                Test Spotify Auth
              </>
            )}
          </button>
        </div>
        
        <div className="bg-[#121212]/60 backdrop-blur-xl rounded-2xl p-6 shadow-xl border border-white/5">
          <h2 className="text-xl font-semibold mb-4">Debug Logs</h2>
          <div className="bg-black/50 p-4 rounded-lg font-mono text-sm overflow-auto max-h-80">
            {logs.length === 0 ? (
              <div className="text-gray-500">No logs yet. Click the button above to start the test.</div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="mb-1">{log}</div>
              ))
            )}
          </div>
        </div>
        
        <div className="mt-6 flex justify-between">
          <button 
            onClick={() => router.push('/auth/test-providers')}
            className="px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Provider Test Page
          </button>
          <button 
            onClick={() => router.push('/auth/login')}
            className="px-4 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
} 