import React from 'react';
import './globals.css';
import { Inter } from 'next/font/google';
import { SupabaseProvider } from '@/components/providers/SupabaseProvider';
import { Toaster } from 'react-hot-toast';

// Initialize font
const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata = {
  title: 'Diggr - AI-Powered Music Discovery',
  description: 'Discover music tailored to your taste with AI-powered playlist generation.',
  keywords: 'music discovery, playlist, spotify, ai, curation',
  authors: [{ name: 'Diggr Team' }],
  creator: 'Diggr',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon.ico', sizes: '32x32' }
    ],
    shortcut: '/favicon.ico',
    apple: '/images/diggr.png',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://diggr.app',
    siteName: 'Diggr',
    title: 'Diggr - AI-Powered Music Discovery',
    description: 'Discover music tailored to your taste with AI-powered playlist generation.',
    images: [
      {
        url: '/images/diggr.png',
        width: 1200,
        height: 630,
        alt: 'Diggr - AI-Powered Music Discovery',
      },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="icon" href="/favicon-16x16.ico" sizes="16x16" />
        <link rel="icon" href="/favicon-32x32.ico" sizes="32x32" />
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/images/diggr.png" />
        <meta name="msapplication-TileImage" content="/favicon.ico" />
      </head>
      <body className="min-h-screen bg-black text-[#F5F5F7] antialiased overflow-x-hidden">
        <SupabaseProvider>
          <main className="flex min-h-screen flex-col relative">
            {children}
          </main>
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 3000,
              style: {
                background: 'rgba(24, 24, 24, 0.8)',
                color: '#F5F5F7',
                borderRadius: '16px',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.05)',
                padding: '16px',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
              },
              success: {
                iconTheme: {
                  primary: '#1DB954',
                  secondary: '#F5F5F7',
                },
                style: {
                  background: 'rgba(24, 24, 24, 0.8)',
                  borderLeft: '4px solid #1DB954',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ff4b4b',
                  secondary: '#F5F5F7',
                },
                style: {
                  background: 'rgba(24, 24, 24, 0.8)',
                  borderLeft: '4px solid #ff4b4b',
                },
              },
            }}
          />
        </SupabaseProvider>
      </body>
    </html>
  );
} 