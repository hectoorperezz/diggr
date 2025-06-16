'use client';

import React from 'react';

export default function DashboardTestPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="bg-[#181818]/80 backdrop-filter backdrop-blur-lg border border-white/5 rounded-3xl p-8 max-w-md w-full">
        <h1 className="text-2xl font-bold mb-4 text-center">Dashboard Test Page</h1>
        <p className="mb-6 text-[#A3A3A3] text-center">
          This is a test page to verify routing is working correctly.
        </p>
      </div>
    </div>
  );
} 