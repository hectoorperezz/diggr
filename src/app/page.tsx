'use client';

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, useScroll, useTransform, useInView, AnimatePresence } from 'framer-motion';
import { useSupabase } from '@/components/providers/SupabaseProvider';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'react-hot-toast';

export default function Home() {
  const [scrolled, setScrolled] = useState(false);
  const heroRef = useRef(null);
  const isHeroInView = useInView(heroRef, { once: false });
  const { session, isLoading } = useSupabase();
  const [isClient, setIsClient] = useState(false);
  const searchParams = useSearchParams();
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
              <Link href="/dashboard" className="btn-primary text-sm md:text-base">
                Access
              </Link>
            ) : (
              <>
                <Link href="/auth/login" className="btn-outline text-sm md:text-base">
                  Login
                </Link>
                <Link href="/auth/register" className="btn-primary text-sm md:text-base">
                  Sign Up
                </Link>
              </>
            )}
          </motion.nav>
        </div>
      </motion.header>

      {/* Hero Section */}
      <section ref={heroRef} className="relative min-h-[80vh] flex flex-col justify-center px-4 sm:px-8 w-full mt-[-20px]">
        <div className="absolute inset-0 -z-10 flex items-center justify-center overflow-hidden">
          <div className="absolute w-[200%] h-[200%] bg-[url('/images/aboutlanding.png')] bg-center bg-no-repeat bg-contain opacity-20 blur-sm animate-slow-spin"></div>
        </div>
        
        <div className="max-w-7xl mx-auto w-full pt-10 pb-32">
          <motion.div 
            className="text-center"
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
              The Future of Music Discovery
            </motion.div>
            <motion.h1 
              className="text-5xl md:text-7xl font-bold mb-6 tracking-tight leading-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={isHeroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.7, delay: 0.3 }}
            >
              Redefine the way you <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1DB954] to-purple-400">discover music</span>
            </motion.h1>
            <motion.p 
              className="text-lg md:text-xl text-[#A3A3A3] max-w-3xl mx-auto mb-12"
              initial={{ opacity: 0, y: 20 }}
              animate={isHeroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.7, delay: 0.4 }}
            >
              Tired of the same old recommendations? Diggr brings back the thrill of discovering music that actually surprises you—using AI to build playlists that feel personal, curated, and full of soul.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={isHeroInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.7, delay: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              {isClient && !isLoading && session ? (
                <Link href="/dashboard" className="group relative overflow-hidden rounded-full inline-block">
                  <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-[#1DB954] to-[#1DB954]/80 group-hover:scale-105 transition-transform duration-300"></div>
                  <div className="absolute inset-[2px] rounded-full bg-black/50 backdrop-blur-xl z-10"></div>
                  <span className="relative z-20 px-8 py-3 inline-block font-medium text-white">Go to Dashboard</span>
                </Link>
              ) : (
                <Link href="/auth/register" className="group relative overflow-hidden rounded-full inline-block">
                  <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-[#1DB954] to-[#1DB954]/80 group-hover:scale-105 transition-transform duration-300"></div>
                  <div className="absolute inset-[2px] rounded-full bg-black/50 backdrop-blur-xl z-10"></div>
                  <span className="relative z-20 px-8 py-3 inline-block font-medium text-white">Get Started</span>
                </Link>
              )}
              <Link href="/create-playlist" className="group relative overflow-hidden rounded-full inline-block">
                <div className="absolute inset-0 w-full h-full bg-white/10 group-hover:scale-105 transition-transform duration-300"></div>
                <div className="absolute inset-[2px] rounded-full bg-black/50 backdrop-blur-xl z-10"></div>
                <span className="relative z-20 px-8 py-3 inline-block font-medium text-white">Try Demo</span>
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Demo Generator Card */}
      <section className="py-16 px-4 sm:px-8 w-full max-w-7xl mx-auto">
        <motion.div 
          className="relative"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true, margin: "-100px" }}
        >
          <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-[#1DB954] via-purple-500 to-[#1DB954] opacity-30 blur-xl"></div>
          <div className="card bg-[#111111]/90 backdrop-blur-md border border-white/5 p-8 rounded-3xl relative overflow-hidden">
            <div className="absolute right-0 top-0 -mr-40 -mt-40 w-80 h-80 bg-[#1DB954]/10 rounded-full blur-3xl"></div>
            <div className="absolute left-0 bottom-0 -ml-40 -mb-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"></div>
            
            <motion.h2 
              className="text-2xl md:text-3xl font-bold mb-8 text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
            >
              AI Playlist Generator
            </motion.h2>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
              {[
                { label: "Genre", value: "Rock, Indie, Alternative" },
                { label: "Era", value: "2000s" },
                { label: "Mood", value: "Energetic" },
                { label: "Songs", value: "15" }
              ].map((item, index) => (
                <motion.div 
                  key={item.label}
                  className="flex flex-col"
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 + index * 0.1 }}
                  viewport={{ once: true }}
                >
                  <label className="text-sm text-[#A3A3A3] mb-2">{item.label}</label>
                  <motion.div 
                    className="relative bg-[#181818] rounded-xl p-3 border border-white/5 overflow-hidden"
                    whileHover={{ scale: 1.03 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-[#1DB954]/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                    <span className="text-[#1DB954] relative z-10">{item.value}</span>
                  </motion.div>
                </motion.div>
              ))}
            </div>
            
            <div className="relative h-6 w-full bg-[#181818] rounded-full mb-8 overflow-hidden">
              <motion.div 
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-[#1DB954] to-purple-500 rounded-full"
                initial={{ width: "0%" }}
                whileInView={{ width: "85%" }}
                transition={{ duration: 1.5, delay: 0.5, ease: "easeOut" }}
                viewport={{ once: true }}
              />
              <div className="absolute inset-0 flex items-center justify-end px-4">
                <span className="text-xs text-white/70">Matching your taste...</span>
              </div>
        </div>

            <div className="flex justify-center">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <Link href="/create-playlist" className="relative group overflow-hidden inline-block rounded-full">
                  <div className="absolute inset-0 bg-gradient-to-r from-[#1DB954] to-purple-500 group-hover:scale-105 transition-transform duration-300"></div>
                  <span className="relative bg-black/30 backdrop-blur-sm m-[2px] px-8 py-3 rounded-full inline-block font-medium text-white group-hover:bg-black/10 transition-colors duration-300">Create a Playlist</span>
                </Link>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-4 sm:px-8 w-full">
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
            {/* Connecting line */}
            <motion.div 
              className="absolute left-1/2 top-8 bottom-8 w-1 bg-gradient-to-b from-[#1DB954] to-purple-500 hidden md:block"
              initial={{ scaleY: 0, opacity: 0 }}
              whileInView={{ scaleY: 1, opacity: 0.3 }}
              transition={{ duration: 1.5 }}
              viewport={{ once: true, margin: "-100px" }}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 relative">
              {[
                {
                  title: "Choose Your Preferences",
                  description: "Select your favorite genres, time period, mood, and the number of songs you want in your playlist.",
                  icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-[#1DB954]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  )
                },
                {
                  title: "AI Creates Your Playlist",
                  description: "Our AI analyzes your preferences and generates a perfect playlist of songs that match your taste.",
                  icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-[#1DB954]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  )
                },
                {
                  title: "Save to Spotify",
                  description: "Connect your Spotify account and save the generated playlist directly to your library.",
                  icon: (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-[#1DB954]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                  )
                }
              ].map((step, index) => (
                <motion.div 
                  key={index}
                  className="relative"
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.7, delay: index * 0.2 }}
                  viewport={{ once: true, margin: "-100px" }}
                >
                  <div className="bg-[#111111] backdrop-filter backdrop-blur-lg bg-opacity-80 rounded-3xl border border-white/5 p-8 h-full relative overflow-hidden group">
                    {/* Animated gradient background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-[#1DB954]/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 ease-in-out"></div>
                    
                    {/* Numbered circle */}
                    <div className="absolute top-8 right-8 flex items-center justify-center">
                      <div className="relative flex items-center justify-center w-12 h-12">
                        <div className="absolute inset-0 bg-gradient-to-r from-[#1DB954]/20 to-purple-500/20 rounded-full animate-pulse"></div>
                        <div className="absolute inset-[3px] bg-[#111111] rounded-full"></div>
                        <span className="relative z-10 text-2xl font-bold text-[#1DB954]">{index + 1}</span>
                      </div>
                    </div>
                    
                    <div className="mb-6">
                      {step.icon}
                    </div>
                    <h3 className="text-xl font-bold mb-4 relative z-10">{step.title}</h3>
                    <p className="text-[#A3A3A3] relative z-10">{step.description}</p>
                    
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
            <h2 className="text-3xl md:text-5xl font-bold mb-4">Why Users Love Diggr</h2>
            <div className="h-1 w-20 bg-gradient-to-r from-[#1DB954] to-purple-500 mx-auto rounded-full"></div>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {[
              {
                text: "This app is amazing! It created a playlist that perfectly matched my music taste. The connection with Spotify is seamless, and I love how I can customize everything.",
                author: "Alex M.",
                image: "https://randomuser.me/api/portraits/men/32.jpg",
                delay: 0
              },
              {
                text: "I've discovered so many new artists thanks to this tool. It's like having a personal DJ that knows exactly what I'll enjoy. The user interface is beautiful and easy to use.",
                author: "Sarah K.",
                image: "https://randomuser.me/api/portraits/women/44.jpg",
                delay: 0.2
              }
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                className="relative"
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, delay: testimonial.delay }}
                viewport={{ once: true, margin: "-100px" }}
              >
                <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-[#1DB954]/30 to-purple-500/30 opacity-60 blur-lg"></div>
                <motion.div 
                  className="relative bg-[#111111] rounded-3xl border border-white/5 p-8 h-full"
                  whileHover={{ y: -5, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)" }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  {/* Quote icon */}
                  <div className="absolute -top-6 -left-2 text-[#1DB954]/10">
                    <svg width="80" height="80" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                      <path d="M10 11H6.5C5.66 11 5 10.34 5 9.5V9C5 7.34 6.34 6 8 6H8.5C8.78 6 9 5.78 9 5.5V4.5C9 4.22 8.78 4 8.5 4H8C5.24 4 3 6.24 3 9V15C3 16.66 4.34 18 6 18H10C11.66 18 13 16.66 13 15V14C13 12.34 11.66 11 10 11ZM21 11H17.5C16.66 11 16 10.34 16 9.5V9C16 7.34 17.34 6 19 6H19.5C19.78 6 20 5.78 20 5.5V4.5C20 4.22 19.78 4 19.5 4H19C16.24 4 14 6.24 14 9V15C14 16.66 15.34 18 17 18H21C22.66 18 24 16.66 24 15V14C24 12.34 22.66 11 21 11Z" />
                    </svg>
                  </div>
                  
                  <div className="flex mb-4">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-[#1DB954]" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  
                  <p className="text-[#F5F5F7] mb-8 italic relative z-10">{testimonial.text}</p>
                  
                  <div className="flex items-center">
                    <div className="w-12 h-12 rounded-full overflow-hidden mr-4 border-2 border-[#1DB954]">
                      <img src={testimonial.image} alt={testimonial.author} className="w-full h-full object-cover" />
                    </div>
                    <div className="font-semibold">{testimonial.author}</div>
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 px-4 sm:px-8 w-full overflow-hidden">
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
      <section className="py-20 px-4 sm:px-8 w-full">
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
                className="flex space-x-4"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                viewport={{ once: true }}
              >
                {['twitter', 'facebook', 'instagram'].map(social => (
                  <a 
                    key={social} 
                    href={`https://${social}.com`} 
                    className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#1DB954]/20 transition-colors duration-300"
                    aria-label={social}
                  >
                    <span className="text-[#A3A3A3] hover:text-[#1DB954]">
                      {social === 'twitter' && (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                        </svg>
                      )}
                      {social === 'facebook' && (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                        </svg>
                      )}
                      {social === 'instagram' && (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                        </svg>
                      )}
                    </span>
                  </a>
                ))}
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
                {['Home', 'About', 'How It Works', 'Pricing', 'Contact'].map(link => (
                  <li key={link}>
                    <Link href={`/${link.toLowerCase().replace(' ', '-')}`} className="text-[#A3A3A3] hover:text-[#1DB954] transition-colors">
                      {link}
            </Link>
                  </li>
                ))}
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
                {['Terms of Service', 'Privacy Policy', 'Cookie Policy', 'GDPR'].map(link => (
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