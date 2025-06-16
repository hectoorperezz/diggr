'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Dashboard error caught by error.tsx:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="bg-[#181818]/80 backdrop-filter backdrop-blur-lg border border-white/5 rounded-3xl p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4 text-center">Something went wrong</h1>
        <p className="mb-6 text-[#A3A3A3] text-center">
          There was an error loading the dashboard. Please try refreshing the page.
        </p>
        <div className="flex justify-center">
          <button
            onClick={() => reset()}
            className="px-4 py-2 bg-[#1DB954] rounded-full text-white"
          >
            Try again
          </button>
        </div>
        {process.env.NODE_ENV === 'development' && (
          <pre className="mt-4 p-4 bg-[#121212] rounded-xl overflow-auto text-xs text-red-400">
            {error.message}
          </pre>
        )}
      </div>
    </div>
  );
} 