'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface AuthProvider {
  name: string;
  id: string;
  configured: boolean;
  url?: string;
  error?: string;
}

export default function TestAuthProvidersPage() {
  const router = useRouter();
  const [providers, setProviders] = useState<AuthProvider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [logMessages, setLogMessages] = useState<string[]>([]);
  
  const addLog = (message: string) => {
    setLogMessages(prev => [...prev, `${new Date().toISOString().split('T')[1].split('.')[0]}: ${message}`]);
  };
  
  useEffect(() => {
    const checkProviders = async () => {
      try {
        setIsLoading(true);
        addLog('Creating Supabase client...');
        
        const supabase = createClient();
        addLog('Supabase client created successfully');
        
        // Check current session
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          addLog(`Session error: ${sessionError.message}`);
          throw sessionError;
        }
        
        addLog(`Current session: ${sessionData.session ? 'Active' : 'None'}`);
        
        // Try to fetch available auth settings
        try {
          addLog('Fetching Supabase settings...');
          
          // This is a workaround to detect configured providers
          // It's not an official API and may change
          const availableProviders: AuthProvider[] = [];
          
          // Test Google provider
          try {
            const googleResult = await supabase.auth.signInWithOAuth({
              provider: 'google',
              options: {
                redirectTo: 'http://localhost:3000/auth/callback',
                skipBrowserRedirect: true
              }
            });
            
            if (googleResult.data?.url) {
              availableProviders.push({
                name: 'Google',
                id: 'google',
                configured: true,
                url: googleResult.data.url.substring(0, 50) + '...'
              });
              addLog('Google provider is configured');
            } else if (googleResult.error) {
              availableProviders.push({
                name: 'Google',
                id: 'google',
                configured: false,
                error: googleResult.error.message
              });
              addLog(`Google provider error: ${googleResult.error.message}`);
            }
          } catch (googleError: any) {
            addLog(`Google provider test error: ${googleError.message}`);
          }
          
          // Test Spotify provider
          try {
            const spotifyResult = await supabase.auth.signInWithOAuth({
              provider: 'spotify',
              options: {
                redirectTo: 'http://localhost:3000/auth/callback',
                skipBrowserRedirect: true
              }
            });
            
            if (spotifyResult.data?.url) {
              availableProviders.push({
                name: 'Spotify',
                id: 'spotify',
                configured: true,
                url: spotifyResult.data.url.substring(0, 50) + '...'
              });
              addLog('Spotify provider is configured');
            } else if (spotifyResult.error) {
              availableProviders.push({
                name: 'Spotify',
                id: 'spotify',
                configured: false,
                error: spotifyResult.error.message
              });
              addLog(`Spotify provider error: ${spotifyResult.error.message}`);
            }
          } catch (spotifyError: any) {
            addLog(`Spotify provider test error: ${spotifyError.message}`);
          }
          
          setProviders(availableProviders);
        } catch (error: any) {
          addLog(`Error fetching providers: ${error.message}`);
          setError(`Error fetching providers: ${error.message}`);
        }
      } catch (error: any) {
        addLog(`Unexpected error: ${error.message}`);
        setError(`Unexpected error: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    };
    
    checkProviders();
  }, []);
  
  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Auth Providers Test Page</h1>
        
        <div className="bg-[#121212]/60 backdrop-blur-xl rounded-2xl p-8 shadow-xl border border-white/5 mb-8">
          <h2 className="text-xl font-semibold mb-4">Available Auth Providers</h2>
          
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <svg className="animate-spin h-8 w-8 text-[#1DB954] mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Checking available providers...</span>
            </div>
          ) : (
            <>
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6 text-red-400">
                  {error}
                </div>
              )}
              
              {providers.length === 0 ? (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 text-yellow-400">
                  No providers could be detected. Please check your Supabase configuration.
                </div>
              ) : (
                <div className="space-y-4">
                  {providers.map((provider, index) => (
                    <div 
                      key={index}
                      className={`p-4 rounded-lg ${provider.configured 
                        ? 'bg-green-500/10 border border-green-500/20 text-green-400' 
                        : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}
                    >
                      <div className="flex justify-between items-center mb-2">
                        <h3 className="font-semibold">{provider.name}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs ${provider.configured 
                          ? 'bg-green-500/20 text-green-400' 
                          : 'bg-red-500/20 text-red-400'}`}
                        >
                          {provider.configured ? 'Configured' : 'Not Configured'}
                        </span>
                      </div>
                      
                      {provider.configured ? (
                        <div className="text-sm opacity-80 break-all">
                          <p>Auth URL: {provider.url}</p>
                        </div>
                      ) : (
                        <div className="text-sm opacity-80">
                          <p>Error: {provider.error}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
        
        <div className="bg-[#121212]/60 backdrop-blur-xl rounded-2xl p-8 shadow-xl border border-white/5">
          <h2 className="text-xl font-semibold mb-4">Debug Log</h2>
          <div className="bg-black/50 p-4 rounded-lg font-mono text-sm overflow-auto max-h-80">
            {logMessages.map((message, index) => (
              <div key={index} className="mb-1">{message}</div>
            ))}
          </div>
        </div>
        
        <div className="mt-8 flex justify-center">
          <button 
            onClick={() => router.push('/auth/login')}
            className="px-6 py-3 bg-[#1DB954] rounded-full hover:bg-[#1DB954]/90 transition-colors"
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
} 