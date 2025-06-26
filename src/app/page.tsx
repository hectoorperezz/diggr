'use client';

import React, { useEffect, useState, useRef, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useScroll, useTransform, useInView, AnimatePresence } from 'framer-motion';
import { useSupabase } from '@/components/providers/SupabaseProvider';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import ClientSearchParams from './ClientSearchParams';

export default function Home() {
  const [scrolled, setScrolled] = useState(false);
  const heroRef = useRef(null);
  const isHeroInView = useInView(heroRef, { once: false });
  const { session, isLoading } = useSupabase();
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();
  
  // Set isClient to true when component mounts on client
  useEffect(() => {
    setIsClient(true);
  }, []);
  
  // Detect scroll for navbar effect
  useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY;
      if (offset > 50) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-black overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[#121212]"></div>
        <div className="absolute top-0 -left-40 w-96 h-96 bg-gradient-to-br from-purple-500/20 via-[#1DB954]/20 to-transparent rounded-full filter blur-3xl opacity-50 animate-blob"></div>
        <div className="absolute top-0 -right-40 w-96 h-96 bg-gradient-to-br from-[#1DB954]/20 via-purple-500/20 to-transparent rounded-full filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-gradient-to-br from-purple-500/20 via-[#1DB954]/20 to-transparent rounded-full filter blur-3xl opacity-50 animate-blob animation-delay-4000"></div>
        </div>
      
      {/* Header */}
      <motion.header 
        className={`w-full sticky top-2 z-50 transition-all duration-300 ${
          scrolled 
            ? 'py-3 bg-black/80 backdrop-blur-xl border-b border-white/10 shadow-lg' 
            : 'py-5 bg-transparent'
        }`}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-7xl mx-auto flex justify-between items-center px-4 sm:px-6 lg:px-8">
          <motion.div 
            className="text-2xl font-bold flex items-center"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <img src="/images/diggr.png" alt="Diggr" className="h-14 mr-2" />
          </motion.div>
          <motion.nav 
            className="space-x-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >

            
            {/* Show either Login/Sign Up buttons or Access button based on authentication state */}
            {isClient && !isLoading && session ? (
              <Link href="/dashboard" className="group relative overflow-hidden rounded-full inline-block">
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-[#1DB954] to-[#1DB954]/80 group-hover:scale-105 transition-transform duration-300"></div>
                <div className="absolute inset-[2px] rounded-full bg-black/50 backdrop-blur-xl z-10"></div>
                <span className="relative z-20 px-6 py-2.5 inline-block font-medium text-white text-sm md:text-base">Access</span>
              </Link>
            ) : (
              <>
                <Link href="/auth/login" className="group relative overflow-hidden rounded-full inline-block">
                  <div className="absolute inset-0 w-full h-full bg-white/10 group-hover:bg-white/15 group-hover:scale-105 transition-all duration-300"></div>
                  <div className="absolute inset-[2px] rounded-full bg-black/80 group-hover:bg-black/75 backdrop-blur-xl z-10 transition-all duration-300"></div>
                  <span className="relative z-20 px-6 py-2.5 inline-block font-medium text-white text-sm md:text-base">Login</span>
                </Link>
                <Link href="/auth/register" className="group relative overflow-hidden rounded-full inline-block">
                  <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-[#1DB954] to-[#1DB954]/80 group-hover:scale-105 transition-transform duration-300"></div>
                  <div className="absolute inset-[2px] rounded-full bg-black/50 backdrop-blur-xl z-10"></div>
                  <span className="relative z-20 px-6 py-2.5 inline-block font-medium text-white text-sm md:text-base">Sign Up</span>
                </Link>
              </>
            )}
          </motion.nav>
        </div>
      </motion.header>

      {/* Hero Section */}
      <section ref={heroRef} className="relative min-h-[80vh] flex flex-col justify-center px-4 sm:px-8 w-full mt-4 md:mt-[-20px]">
        <div className="absolute inset-0 -z-10 flex items-center justify-center overflow-hidden">
          <div className="absolute w-[200%] h-[200%] bg-[url('/images/aboutlanding.png')] bg-center bg-no-repeat bg-contain opacity-20 blur-sm animate-slow-spin"></div>
        </div>
        
        <div className="max-w-7xl mx-auto w-full pt-20 md:pt-10 pb-32">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Left side - Text content */}
            <motion.div 
              className="text-left lg:pr-8"
              initial={{ opacity: 0, y: 50 }}
              animate={isHeroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <motion.div 
                className="inline-block mb-6 bg-gradient-to-r from-[#1DB954]/20 to-purple-500/20 px-4 py-1 rounded-full text-sm font-medium text-[#1DB954]"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={isHeroInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                AI-Powered Music Discovery
              </motion.div>
              <motion.h1 
                className="text-4xl md:text-6xl font-bold mb-6 tracking-tight leading-tight"
                initial={{ opacity: 0, y: 20 }}
                animate={isHeroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.7, delay: 0.3 }}
              >
                Redefine the way you <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1DB954] to-purple-400">discover music</span>
              </motion.h1>
              <motion.p 
                className="text-lg md:text-xl text-[#A3A3A3] mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={isHeroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.7, delay: 0.4 }}
              >
                Create personalized Spotify playlists powered by AI that understands your unique music taste. Diggr brings back the thrill of discovering music that surprises and delights you.
              </motion.p>
              
              <motion.div 
                className="flex items-center space-x-2 mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={isHeroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.7, delay: 0.5 }}
              >
                <div className="flex -space-x-2">
                  {[
                    "https://randomuser.me/api/portraits/women/32.jpg",
                    "https://randomuser.me/api/portraits/men/44.jpg",
                    "https://randomuser.me/api/portraits/women/68.jpg"
                  ].map((src, i) => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-black overflow-hidden">
                      <img src={src} alt={`User ${i+1}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
                <span className="text-sm text-[#A3A3A3]">Join <span className="text-white font-medium">10,000+</span> music lovers who've discovered new tracks</span>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={isHeroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.7, delay: 0.6 }}
                className="flex flex-col sm:flex-row gap-4"
              >
                {isClient && !isLoading && session ? (
                  <Link href="/dashboard" className="group relative overflow-hidden rounded-full inline-block">
                    <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-[#1DB954] to-[#1DB954]/80 group-hover:scale-105 transition-transform duration-300"></div>
                    <div className="absolute inset-[2px] rounded-full bg-black/50 backdrop-blur-xl z-10"></div>
                    <span className="relative z-20 px-6 py-2.5 inline-block font-medium text-white text-sm md:text-base">Access</span>
                  </Link>
                ) : (
                  <Link href="/auth/register" className="group relative overflow-hidden rounded-full inline-block max-w-xs mx-auto md:mx-0">
                    <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-[#1DB954] to-[#1DB954]/80 group-hover:scale-105 transition-transform duration-300"></div>
                    <div className="absolute inset-[2px] rounded-full bg-black/50 backdrop-blur-xl z-10"></div>
                    <span className="relative z-20 px-8 py-3 inline-block font-medium text-white">Create Free Account</span>
                  </Link>
                )}
              </motion.div>
              
              {/* Mobile carousel layout is now in the main mobile section below */}
            </motion.div>
            
            {/* Right side - App mockup */}
            <motion.div
              className="relative hidden lg:block"
              initial={{ opacity: 0, x: 50 }}
              animate={isHeroInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 50 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              {/* Grid Layout - Cards with subtle cool hover effect */}
              <div className="grid grid-cols-3 gap-6 p-4">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                  className="overflow-hidden rounded-lg shadow-xl relative group cursor-pointer"
                >
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-y-0 translate-y-2">
                    <span className="text-white font-medium text-lg">Mamboo</span>
                  </div>
                  <img src="/images/card_1.jpg" alt="Mamboo" className="w-full h-auto transition-transform duration-700 group-hover:scale-105" />
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                  className="overflow-hidden rounded-lg shadow-xl relative group cursor-pointer"
                >
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-y-0 translate-y-2">
                    <span className="text-white font-medium text-lg">Rap</span>
                  </div>
                  <img src="/images/card_3.jpg" alt="Rap" className="w-full h-auto transition-transform duration-700 group-hover:scale-105" />
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                  className="overflow-hidden rounded-lg shadow-xl relative group cursor-pointer"
                >
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-y-0 translate-y-2">
                    <span className="text-white font-medium text-lg">Sambadobrasil</span>
                  </div>
                  <img src="/images/card_2.jpg" alt="Sambadobrasil" className="w-full h-auto transition-transform duration-700 group-hover:scale-105" />
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.5 }}
                  whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                  className="overflow-hidden rounded-lg shadow-xl relative group cursor-pointer"
                >
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-y-0 translate-y-2">
                    <span className="text-white font-medium text-lg">Rock 90s</span>
                  </div>
                  <img src="/images/card_4.jpg" alt="Rock 90s" className="w-full h-auto transition-transform duration-700 group-hover:scale-105" />
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.6 }}
                  whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                  className="overflow-hidden rounded-lg shadow-xl relative group cursor-pointer"
                >
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-y-0 translate-y-2">
                    <span className="text-white font-medium text-lg">IDM</span>
                  </div>
                  <img src="/images/card_5.jpg" alt="IDM" className="w-full h-auto transition-transform duration-700 group-hover:scale-105" />
                </motion.div>
                
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.7 }}
                  whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                  className="overflow-hidden rounded-lg shadow-xl relative group cursor-pointer"
                >
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-y-0 translate-y-2">
                    <span className="text-white font-medium text-lg">Indie 2000s</span>
                  </div>
                  <img src="/images/card_6.jpg" alt="Indie 2000s" className="w-full h-auto transition-transform duration-700 group-hover:scale-105" />
                </motion.div>
              </div>
            </motion.div>
            
            {/* Mobile playlist carousel layout */}
            <motion.div 
              className="mt-4 lg:hidden relative w-full max-w-sm mx-auto"
              initial={{ opacity: 0, y: 20 }}
              animate={isHeroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.7, delay: 0.5 }}
            >
              <div className="relative h-[420px] px-4 flex items-center justify-center">
                {/* Left card (slightly behind) */}
                <motion.div
                  initial={{ opacity: 0, x: -40 }}
                  animate={{ opacity: 0.9, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                  className="absolute left-4 z-10 w-[30%] overflow-hidden rounded-lg shadow-xl relative group cursor-pointer transform -rotate-6 scale-90 origin-bottom-right"
                >
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-y-0 translate-y-2">
                    <span className="text-white font-medium text-sm">Rock 90s</span>
                  </div>
                  <img src="/images/card_4.jpg" alt="Rock 90s" className="w-full h-auto transition-transform duration-700 group-hover:scale-105" />
                </motion.div>
                
                {/* Center card (featured) */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                  className="z-20 w-[55%] overflow-hidden rounded-lg shadow-xl relative group cursor-pointer"
                >
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute bottom-4 left-4 right-4 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-y-0 translate-y-2">
                    <span className="text-white font-medium text-lg">Indie 2000s</span>
                  </div>
                  <img src="/images/card_3.jpg" alt="Indie 2000s" className="w-full h-auto transition-transform duration-700 group-hover:scale-105" />
                </motion.div>
                
                {/* Right card (slightly behind) */}
                <motion.div
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 0.9, x: 0 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                  whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
                  className="absolute right-4 z-10 w-[30%] overflow-hidden rounded-lg shadow-xl relative group cursor-pointer transform rotate-6 scale-90 origin-bottom-left"
                >
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-y-0 translate-y-2">
                    <span className="text-white font-medium text-sm">Mamboo</span>
                  </div>
                  <img src="/images/card_1.jpg" alt="Mamboo" className="w-full h-auto transition-transform duration-700 group-hover:scale-105" />
                </motion.div>
                

              </div>
            </motion.div>
          </div>

        </div>
      </section>

      {/* Move useSearchParams logic to a client component wrapped in Suspense */}
      <Suspense fallback={null}>
        <ClientSearchParams />
      </Suspense>



      {/* How It Works */}
      <section id="how-it-works" className="py-0 mt-[-120px] px-4 sm:px-8 w-full">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true, margin: "-100px" }}
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-4">How It Works</h2>
            <div className="h-1 w-20 bg-gradient-to-r from-[#1DB954] to-purple-500 mx-auto rounded-full"></div>
          </motion.div>
          
          <div className="relative">
            {/* Connecting line with animated pulse */}
            <motion.div 
              className="absolute left-1/2 top-8 bottom-8 w-1 hidden md:block overflow-hidden"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true, margin: "-100px" }}
            >
              <div className="h-full w-full bg-gradient-to-b from-[#1DB954] to-purple-500 opacity-30"></div>
              <motion.div 
                className="absolute top-0 h-24 w-full bg-white/50 blur-md"
                initial={{ y: "-100%" }}
                animate={{ y: "400%" }}
                transition={{ 
                  duration: 3, 
                  repeat: Infinity, 
                  ease: "linear",
                  repeatType: "loop"
                }}
              />
            </motion.div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 relative">
              {[
                {
                  title: "Choose Your Preferences",
                  description: "Select your favorite genres, time period, mood, and the number of songs you want in your playlist.",
                  icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-[#1DB954]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  ),
                  image: "/images/card_1.jpg",
                  features: ["Genres", "Era", "Mood", "Length"]
                },
                {
                  title: "AI Creates Your Playlist",
                  description: "Our AI analyzes your preferences and generates a perfect playlist of songs that match your taste.",
                  icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-[#1DB954]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  ),
                  image: "/images/card_3.jpg",
                  features: ["AI Matching", "Deep Cuts", "Hidden Gems", "Perfect Flow"]
                },
                {
                  title: "Save to Spotify",
                  description: "Connect your Spotify account and save the generated playlist directly to your library.",
                  icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-[#1DB954]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                  ),
                  image: "/images/card_5.jpg",
                  features: ["One-Click Save", "Share with Friends", "Listen Anywhere", "Regular Updates"]
                }
              ].map((step, index) => (
                <motion.div 
                  key={index}
                  className="relative"
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: index * 0.2 }}
                  viewport={{ once: true, margin: "-100px" }}
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                >
                  <div className="bg-[#111111] backdrop-filter backdrop-blur-lg bg-opacity-80 rounded-3xl border border-white/5 p-8 h-full relative overflow-hidden group">
                    {/* Animated gradient background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[#1DB954]/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-all duration-700 ease-in-out"></div>
                    
                    {/* Numbered circle with animated pulse */}
                    <div className="absolute top-8 right-8 flex items-center justify-center">
                      <div className="relative flex items-center justify-center w-12 h-12">
                        <motion.div 
                          className="absolute inset-0 bg-gradient-to-r from-[#1DB954]/30 to-purple-500/30 rounded-full"
                          animate={{ 
                            scale: [1, 1.2, 1],
                            opacity: [0.5, 0.8, 0.5]
                          }}
                          transition={{ 
                            duration: 2, 
                            repeat: Infinity,
                            repeatType: "loop"
                          }}
                        />
                        <div className="absolute inset-[3px] bg-[#111111] rounded-full"></div>
                        <span className="relative z-10 text-2xl font-bold text-[#1DB954]">{index + 1}</span>
                      </div>
                    </div>
                    
                    <div className="mb-6">
                      {step.icon}
                    </div>
                    <h3 className="text-xl font-bold mb-4 relative z-10">{step.title}</h3>
                    <p className="text-[#A3A3A3] relative z-10 mb-6">{step.description}</p>
                    
                    {/* Feature tags */}
                    <div className="flex flex-wrap gap-2 mb-6">
                      {step.features.map((feature, i) => (
                        <motion.span 
                          key={i}
                          className="bg-black/30 backdrop-blur-sm px-2 py-1 rounded-full text-xs text-white/80"
                          initial={{ opacity: 0, scale: 0.8 }}
                          whileInView={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.5 + (i * 0.1) }}
                          viewport={{ once: true }}
                        >
                          {feature}
                        </motion.span>
                      ))}
                    </div>
                    

                    
                    {/* Decorative elements */}
                    <div className="absolute -bottom-16 -right-16 w-32 h-32 bg-gradient-to-br from-[#1DB954]/10 to-transparent rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Digital Crate Digging Experience */}
      <section className="py-24 px-4 sm:px-8 w-full overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true, margin: "-100px" }}
            >
              <motion.h2 
                className="text-3xl md:text-4xl font-bold mb-4"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
              >
                The Digital Crate Digging Experience
              </motion.h2>
              
              <motion.h3 
                className="text-xl text-transparent bg-clip-text bg-gradient-to-r from-[#1DB954] to-purple-400 mb-6 font-medium"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                viewport={{ once: true }}
              >
                From Dusty Crates to Digital Discovery
              </motion.h3>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                viewport={{ once: true }}
              >
                <p className="text-[#A3A3A3] mb-8">
                  Diggr brings the soul of vinyl crate digging into the digital age. Just as record store enthusiasts would spend hours hunting through dusty crates for that perfect hidden gem, Diggr helps you unearth musical treasures tailored to your unique taste.
                </p>
                <p className="text-[#A3A3A3] mb-10">
                  We've captured the essence of that magical moment when you discover an artist or track that speaks directly to you—that electric feeling of connection that only music can provide.
                </p>
              </motion.div>
              
              <div className="space-y-6">
                {[
                  {
                    title: "Deep Cuts & Hidden Gems",
                    description: "Discover tracks beyond the algorithm—those B-sides and deep cuts that would make any crate digger proud."
                  },
                  {
                    title: "Curatorial Excellence",
                    description: "Our AI has studied the art of curation from legendary DJs and record collectors worldwide."
                  },
                  {
                    title: "The Thrill of Discovery",
                    description: "Experience that same rush of finding something special that crate diggers have cherished for decades."
                  }
                ].map((feature, index) => (
                  <motion.div 
                    key={index}
                    className="flex items-start"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                    viewport={{ once: true }}
                  >
                    <div className="relative flex-shrink-0 mr-4">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#1DB954]/20 to-purple-500/20 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#1DB954]" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">{feature.title}</h4>
                      <p className="text-[#A3A3A3] text-sm">{feature.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
            
            <motion.div
              className="relative"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true, margin: "-100px" }}
            >
              {/* Colored glow effects */}
              <div className="absolute -inset-10 bg-gradient-to-br from-[#1DB954]/30 via-purple-500/20 to-blue-500/30 rounded-full opacity-30 blur-3xl"></div>
              
              <div className="relative">
                {/* Vinyl record effect */}
                <motion.div 
                  className="absolute inset-0 rounded-3xl overflow-hidden"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                >
                  <div className="w-full h-full bg-[radial-gradient(circle_at_center,rgba(0,0,0,0)_40%,rgba(29,185,84,0.2)_70%,rgba(0,0,0,0)_75%)]"></div>
                </motion.div>
                
                {/* Main image container */}
                <div className="relative rounded-3xl overflow-hidden backdrop-blur border border-white/10 shadow-2xl shadow-black/50">
                  <div className="absolute inset-0 bg-black/20 backdrop-blur-sm z-10"></div>
                  
                  <img 
                    src="/images/aboutlanding.png" 
                    alt="Digital Crate Digging" 
                    className="w-full h-auto object-cover aspect-square"
                  />
                  
                  {/* Vinyl arm overlay */}
                  <motion.div 
                    className="absolute top-0 right-0 w-[30%] h-[30%] origin-top-right z-20"
                    initial={{ rotate: -20 }}
                    animate={{ rotate: 0 }}
                    transition={{ duration: 2, delay: 1, type: "spring", stiffness: 50 }}
                  >
                    <div className="w-full h-full bg-gradient-to-b from-black/50 to-transparent"></div>
                  </motion.div>
                  
                  {/* Content overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 to-transparent z-20">
                    <h4 className="text-2xl font-bold text-white mb-2">Digital Crate Digging</h4>
                    <p className="text-sm text-[#A3A3A3]">The modern way to discover music treasures</p>
                  </div>
                </div>
                
                {/* Floating musical notes */}
                {[...Array(5)].map((_, i) => (
                  <motion.div
                    key={i}
                    className="absolute text-[#1DB954]/70"
                    initial={{ 
                      top: `${20 + Math.random() * 60}%`, 
                      left: `${20 + Math.random() * 60}%`,
                      opacity: 0,
                      scale: 0.5,
                    }}
                    animate={{ 
                      y: [0, -100 - Math.random() * 100],
                      opacity: [0, 0.7, 0],
                      scale: [0.5, 1.2, 0.8]
                    }}
                    transition={{ 
                      duration: 4 + Math.random() * 4,
                      repeat: Infinity,
                      delay: i * 2
                    }}
                  >
                    {i % 2 === 0 ? (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 17H5v-2h4v2zm0-4H5v-2h4v2zm0-4H5V7h4v2zm10 8h-4v-2h4v2zm0-4h-4v-2h4v2zm0-4h-4V7h4v2z" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                      </svg>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 px-4 sm:px-8 w-full overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true, margin: "-100px" }}
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Designed For</h2>
            <div className="h-1 w-20 bg-gradient-to-r from-[#1DB954] to-purple-500 mx-auto rounded-full"></div>
          </motion.div>
          
          {/* User Types Grid */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true, margin: "-100px" }}
          >
            {[
              {
                title: "DJs",
                description: "Discover rare tracks and perfect transitions that will set your mixes apart.",
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-[#1DB954]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                )
              },
              {
                title: "Producers",
                description: "Find inspiration and reference tracks that spark your creativity in the studio.",
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-[#1DB954]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                  </svg>
                )
              },
              {
                title: "Enthusiasts",
                description: "Expand your musical horizons with personalized recommendations that match your taste.",
                icon: (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-[#1DB954]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                )
              }
            ].map((userType, index) => (
              <motion.div
                key={index}
                className="relative"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                viewport={{ once: true }}
                whileHover={{ 
                  y: -10, 
                  scale: 1.03,
                  transition: { 
                    type: "spring", 
                    stiffness: 400, 
                    damping: 10 
                  } 
                }}
              >
                <div className="group bg-[#111111] rounded-2xl border border-white/10 p-8 h-full relative overflow-hidden">
                  {/* Green-purple reflection */}
                  <div className="absolute -inset-1 bg-gradient-to-br from-[#1DB954]/20 via-transparent to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700 blur-xl"></div>
                  
                  <div className="relative z-10">
                    <div className="mb-6 transform group-hover:scale-110 transition-transform duration-300">
                      {userType.icon}
                    </div>
                    
                    <h3 className="text-2xl font-bold mb-3">{userType.title}</h3>
                    <p className="text-[#A3A3A3]">{userType.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 px-4 sm:px-8 w-full overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            viewport={{ once: true, margin: "-100px" }}
          >
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Choose Your Plan</h2>
            <p className="text-[#A3A3A3] max-w-2xl mx-auto">
              Select the perfect plan that fits your music discovery needs
            </p>
            <div className="h-1 w-20 bg-gradient-to-r from-[#1DB954] to-purple-500 mx-auto mt-6 rounded-full"></div>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-4xl mx-auto">
            {/* Free Plan */}
            <motion.div
              className="relative"
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.7 }}
              viewport={{ once: true, margin: "-100px" }}
            >
              <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-white/20 to-purple-500/20 opacity-50 blur-lg"></div>
              <motion.div 
                className="relative bg-[#111111] rounded-3xl border border-white/5 p-8 h-full"
                whileHover={{ y: -5, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)" }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <div className="bg-white/5 rounded-full px-4 py-1 inline-block mb-6">
                  <span className="text-sm font-medium">Free Plan</span>
                </div>
                
                <h3 className="text-3xl font-bold mb-2">$0</h3>
                <p className="text-[#A3A3A3] mb-8">Forever free</p>
                
                <div className="h-px w-full bg-white/5 my-6"></div>
                
                <ul className="space-y-4 mb-8">
                  {[
                    "5 playlists per month",
                    "Basic AI recommendations",
                    "Spotify integration",
                    "Includes ads",
                    "Community support"
                  ].map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <div className="text-[#1DB954] mr-3 mt-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link href="/auth/register" className="w-full relative group overflow-hidden inline-block rounded-full text-center">
                    <div className="absolute inset-0 bg-white/10 group-hover:scale-105 transition-transform duration-300"></div>
                    <div className="absolute inset-[2px] rounded-full bg-black/50 backdrop-blur-xl z-10"></div>
                    <span className="relative z-20 py-3 inline-block w-full font-medium text-white">Get Started</span>
                  </Link>
                </motion.div>
              </motion.div>
            </motion.div>
            
            {/* Pro Plan */}
            <motion.div
              className="relative"
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              viewport={{ once: true, margin: "-100px" }}
            >
              <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-[#1DB954]/40 to-purple-500/40 opacity-70 blur-lg"></div>
              <motion.div 
                className="relative bg-[#111111] rounded-3xl border border-[#1DB954]/20 p-8 h-full"
                whileHover={{ y: -5, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)" }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                {/* Popular Tag */}
                <div className="absolute -top-4 -right-4">
                  <div className="bg-gradient-to-r from-[#1DB954] to-purple-500 text-white text-xs font-bold px-4 py-1 rounded-full shadow-lg">
                    POPULAR
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-[#1DB954]/20 to-purple-500/20 rounded-full px-4 py-1 inline-block mb-6">
                  <span className="text-sm font-medium text-[#1DB954]">Pro Plan</span>
                </div>
                
                <h3 className="text-3xl font-bold mb-2">$9.99</h3>
                <p className="text-[#A3A3A3] mb-8">per month</p>
                
                <div className="h-px w-full bg-white/5 my-6"></div>
                
                <ul className="space-y-4 mb-8">
                  {[
                    "Unlimited playlists",
                    "Advanced AI recommendations",
                    "Spotify integration",
                    "No ads",
                    "Priority support",
                    "Advanced customization options",
                    "Early access to new features"
                  ].map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <div className="text-[#1DB954] mr-3 mt-1">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link href="/auth/register" className="w-full relative group overflow-hidden inline-block rounded-full text-center">
                    <div className="absolute inset-0 bg-gradient-to-r from-[#1DB954] to-purple-500 group-hover:scale-105 transition-transform duration-300"></div>
                    <div className="absolute inset-[2px] rounded-full bg-black/50 backdrop-blur-xl z-10"></div>
                    <span className="relative z-20 py-3 inline-block w-full font-medium text-white">Upgrade Now</span>
                  </Link>
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section id="contact" className="py-20 px-4 sm:px-8 w-full">
        <motion.div 
          className="max-w-7xl mx-auto"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true, margin: "-100px" }}
        >
          <div className="relative overflow-hidden rounded-3xl">
            {/* Background image with overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/70 to-black/80 z-10"></div>
            <div className="absolute inset-0">
              <img 
                src="/images/aboutlanding.png" 
                alt="Background" 
                className="w-full h-full object-cover opacity-20 filter blur-sm"
              />
            </div>
            
            {/* Content */}
            <div className="relative z-20 p-12 md:p-16 text-center">
              <motion.h2 
                className="text-3xl md:text-5xl font-bold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-white via-[#1DB954] to-white"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.2 }}
                viewport={{ once: true }}
              >
                Ready to Create Your Perfect Playlist?
              </motion.h2>
              
              <motion.p 
                className="text-lg max-w-2xl mx-auto mb-10 text-[#A3A3A3]"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.3 }}
                viewport={{ once: true }}
              >
                Join thousands of music lovers who are discovering new music with our AI playlist generator.
              </motion.p>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: 0.4 }}
                viewport={{ once: true }}
                className="relative z-10"
              >
                <Link href="/auth/register" className="group relative inline-flex items-center justify-center p-0.5 overflow-hidden text-sm font-medium rounded-full">
                  <span className="absolute inset-0 w-full h-full bg-gradient-to-br from-[#1DB954] via-green-400 to-purple-500 group-hover:from-purple-500 group-hover:via-green-400 group-hover:to-[#1DB954] animate-gradient-x"></span>
                  <span className="relative px-8 py-3.5 transition-all ease-out bg-black rounded-full group-hover:bg-opacity-0 duration-400 text-white">
                    Create Your Account
                  </span>
                </Link>
              </motion.div>
              
              {/* Floating music notes decoration */}
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute text-white/10"
                  style={{
                    top: `${Math.random() * 100}%`,
                    left: `${Math.random() * 100}%`,
                    fontSize: `${12 + Math.random() * 20}px`
                  }}
                  animate={{
                    y: [0, -100],
                    opacity: [0, 0.5, 0],
                    rotate: [0, 180]
                  }}
                  transition={{
                    duration: 5 + Math.random() * 10,
                    repeat: Infinity,
                    delay: i * 0.6
                  }}
                >
                  ♪
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="w-full border-t border-white/5 mt-auto py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            <div className="col-span-1 md:col-span-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
                className="mb-6"
              >
                <img src="/images/diggr.png" alt="Diggr" className="h-10" />
              </motion.div>
              <motion.p 
                className="text-[#A3A3A3] mb-6 max-w-md"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                viewport={{ once: true }}
              >
                Diggr brings the soul of vinyl crate digging into the digital age, helping you discover music that feels personal and curated.
              </motion.p>
              <motion.div
                className="flex"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                viewport={{ once: true }}
              >
                <a 
                  href="https://x.com" 
                  className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#1DB954]/20 transition-colors duration-300"
                  aria-label="X (formerly Twitter)"
                >
                  <span className="text-[#A3A3A3] hover:text-[#1DB954]">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                  </span>
                </a>
              </motion.div>
            </div>
            
            <motion.div
              className="col-span-1"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              viewport={{ once: true }}
            >
              <h3 className="text-lg font-medium mb-4">Navigation</h3>
              <ul className="space-y-3">
                <li>
                  <Link href="/" className="text-[#A3A3A3] hover:text-[#1DB954] transition-colors">
                    Home
                  </Link>
                </li>
                <li>
                  <a href="#how-it-works" className="text-[#A3A3A3] hover:text-[#1DB954] transition-colors">
                    How It Works
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="text-[#A3A3A3] hover:text-[#1DB954] transition-colors">
                    Pricing
                  </a>
                </li>
                <li>
                  <Link href="/contact" className="text-[#A3A3A3] hover:text-[#1DB954] transition-colors">
                    Contact
                  </Link>
                </li>
              </ul>
            </motion.div>
            
            <motion.div
              className="col-span-1"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              viewport={{ once: true }}
            >
              <h3 className="text-lg font-medium mb-4">Legal</h3>
                            <ul className="space-y-3">
                {['Terms of Service', 'Privacy Policy', 'Cookie Policy'].map(link => (
                  <li key={link}>
                    <Link href={`/${link.toLowerCase().replace(/ /g, '-')}`} className="text-[#A3A3A3] hover:text-[#1DB954] transition-colors">
                      {link}
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          </div>
          
          <motion.div 
            className="border-t border-white/5 mt-12 pt-6 flex flex-col md:flex-row justify-between items-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            viewport={{ once: true }}
          >
            <div className="text-[#A3A3A3] text-sm mb-4 md:mb-0">
              © {new Date().getFullYear()} Diggr. All rights reserved.
            </div>
            <div className="flex items-center">
              <span className="text-[#A3A3A3] text-sm mr-2">Made with</span>
              <span className="text-[#1DB954]">♥</span>
              <span className="text-[#A3A3A3] text-sm ml-2">for music lovers</span>
            </div>
          </motion.div>
        </div>
      </footer>
    </div>
  );
}

const PlaylistCard = ({ image, title, tracks, genre, className }) => {
  // Extract the card number from the image path
  const cardNumber = image.match(/card_(\d+)/)?.[1] || "1";
  
  return (
    <motion.div
      className={`${className} bg-[#121212] rounded-xl overflow-hidden shadow-lg`}
      whileHover={{ 
        y: -5, 
        transition: { duration: 0.2 } 
      }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Use the full image as provided in the design */}
      <img src={image} alt={title} className="w-full aspect-square object-cover" />
      
      <div className="p-4 bg-[#121212]">
        <h3 className="font-medium text-white text-lg">{title}</h3>
        <p className="text-sm text-[#A3A3A3]">Created with Diggr · AI-powered music discovery</p>
        <div className="flex items-center mt-2 text-xs text-[#A3A3A3]">
          <span>{tracks} tracks</span>
          <span className="mx-2">•</span>
          <span>{genre}</span>
        </div>
        <div className="mt-3 flex justify-between items-center">
          <button className="bg-[#1DB954] hover:bg-[#1DB954]/90 text-white py-1 px-4 rounded-full text-sm font-medium">
            View Details
          </button>
          <button className="bg-black/30 hover:bg-black/20 rounded-full p-1.5">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#1DB954">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/>
            </svg>
          </button>
        </div>
      </div>
    </motion.div>
  );
}; 