'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

export default function SpotifyConfigPage() {
  const [origin, setOrigin] = useState('');
  const [copied, setCopied] = useState(false);
  const [redirectUri, setRedirectUri] = useState('');

  useEffect(() => {
    // Set the origin and redirect URI when the component mounts
    setOrigin(window.location.origin);
    setRedirectUri(process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI || `${window.location.origin}/api/auth/callback/spotify`);
  }, []);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(redirectUri);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#121212] text-white">
      {/* Header with logo */}
      <header className="bg-[#181818] border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/" className="flex items-center">
            <img src="/images/diggr.png" alt="Diggr" className="h-12" />
          </Link>
          <div className="flex items-center space-x-4">
            <Link href="/settings" className="text-[#A3A3A3] hover:text-white">
              Back to Settings
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Spotify Configuration</h1>

        <div className="bg-[#181818] rounded-2xl shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Redirect URI Configuration</h2>
          
          <p className="mb-4">
            To fix the <span className="text-red-500 font-mono">INVALID_CLIENT: Invalid redirect URI</span> error, 
            you need to register the following redirect URI in your Spotify Developer Dashboard:
          </p>

          <div className="bg-black/50 p-4 rounded-md mb-4">
            <code className="text-[#1DB954] break-all">{redirectUri}</code>
          </div>

          <button
            onClick={copyToClipboard}
            className="px-4 py-2 bg-[#1DB954] text-white rounded-md hover:bg-[#1ED760] transition-colors"
          >
            {copied ? 'Copied!' : 'Copy to Clipboard'}
          </button>
        </div>

        <div className="bg-[#181818] rounded-2xl shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Setup Instructions</h2>
          
          <ol className="list-decimal list-inside space-y-3">
            <li>Go to the <a href="https://developer.spotify.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-[#1DB954] underline">Spotify Developer Dashboard</a></li>
            <li>Select your application</li>
            <li>Click on "Edit Settings"</li>
            <li>Under "Redirect URIs", add the URI shown above</li>
            <li>Click "Save" at the bottom of the settings panel</li>
            <li>Return to the <a href="/settings" className="text-[#1DB954] underline">Settings page</a> and try connecting again</li>
          </ol>
        </div>
      </div>
    </div>
  );
} 