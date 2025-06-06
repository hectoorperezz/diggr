import React from 'react';
import './globals.css';
import { Inter } from 'next/font/google';
import { SupabaseProvider } from '@/components/providers/SupabaseProvider';
import { Toaster } from 'react-hot-toast';
import Script from 'next/script';

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
      { url: '/favicons/favicon.ico', sizes: 'any' },
      { url: '/favicons/favicon-32x32.ico', sizes: '32x32' },
      { url: '/favicons/favicon-16x16.ico', sizes: '16x16' }
    ],
    shortcut: '/favicons/favicon.ico',
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
        <link rel="icon" href="/favicons/favicon.ico" />
        <link rel="icon" href="/favicons/favicon-16x16.ico" sizes="16x16" />
        <link rel="icon" href="/favicons/favicon-32x32.ico" sizes="32x32" />
        <link rel="icon" type="image/png" href="/favicons/favicon.png" />
        <link rel="shortcut icon" href="/favicons/favicon.ico" />
        <link rel="apple-touch-icon" href="/images/diggr.png" />
        <meta name="msapplication-TileImage" content="/favicons/favicon.ico" />
        
        {/* Google Analytics */}
        <Script
          strategy="afterInteractive"
          src="https://www.googletagmanager.com/gtag/js?id=G-YZEWKBJVE6"
        />
        <Script
          id="google-analytics"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              
              gtag('config', 'G-YZEWKBJVE6');
            `,
          }}
        />
        
        {/* Force refresh script for subscription status */}
        <Script id="force-refresh-script">
          {`
          document.addEventListener('DOMContentLoaded', function() {
            const button = document.createElement('button');
            button.innerText = 'Force Refresh Subscription';
            button.style.position = 'fixed';
            button.style.bottom = '20px';
            button.style.right = '20px';
            button.style.zIndex = '9999';
            button.style.padding = '10px 15px';
            button.style.backgroundColor = '#1DB954';
            button.style.color = 'white';
            button.style.border = 'none';
            button.style.borderRadius = '5px';
            button.style.cursor = 'pointer';
            
            button.addEventListener('click', async function() {
              // Clear localStorage and sessionStorage
              localStorage.clear();
              sessionStorage.clear();
              
              // Force a subscription refresh
              try {
                const response = await fetch('/api/user/subscription', {
                  method: 'GET',
                  headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                  }
                });
                
                if (response.ok) {
                  // After getting a fresh response, reload the page
                  window.location.reload(true);
                } else {
                  alert('Error refreshing subscription. Please try again.');
                }
              } catch (error) {
                console.error('Error:', error);
                alert('Error refreshing subscription. Please try again.');
              }
            });
            
            document.body.appendChild(button);
          });
          `}
        </Script>
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