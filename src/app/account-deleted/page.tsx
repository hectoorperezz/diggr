'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function AccountDeletedPage() {
  // Cooling period in days
  const DEFAULT_COOLING_PERIOD_DAYS = 30;
  const [daysRemaining, setDaysRemaining] = useState(DEFAULT_COOLING_PERIOD_DAYS);
  const [message, setMessage] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);
  
  const searchParams = useSearchParams();
  const supabase = createClientComponentClient();
  
  useEffect(() => {
    // Intentar obtener información adicional de la URL
    if (searchParams) {
      const coolingEndParam = searchParams.get('until');
      const messageParam = searchParams.get('message');
      
      if (messageParam) {
        setMessage(decodeURIComponent(messageParam));
      }
      
      if (coolingEndParam) {
        try {
          const coolingEndDate = new Date(decodeURIComponent(coolingEndParam));
          const now = new Date();
          const days = Math.ceil((coolingEndDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          
          if (!isNaN(days) && days > 0) {
            setDaysRemaining(days);
          }
        } catch (e) {
          console.error('Error parsing cooling period date:', e);
        }
      }
    }
    
    // Verificar sesión y asegurar que esté cerrada
    const checkAndSignOut = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        console.log("Aún hay sesión activa, cerrando sesión...");
        await supabase.auth.signOut();
      }
    };
    
    checkAndSignOut();
  }, [searchParams, supabase]);

  // Función para limpiar cookies manualmente
  const clearAuthCookies = () => {
    // Eliminar todas las cookies que puedan estar relacionadas con la autenticación
    const cookies = document.cookie.split(';');
    
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i];
      const eqPos = cookie.indexOf('=');
      const name = eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie.trim();
      
      // Eliminar cualquier cookie que pueda estar relacionada con supabase o autenticación
      if (name.includes('supabase') || name.includes('auth') || name.includes('sb-') || name.includes('_auth')) {
        document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
        console.log('Eliminando cookie:', name);
      }
    }
  };

  const handleNavigateHome = async () => {
    setIsSigningOut(true);
    try {
      // 1. Cerrar sesión con Supabase
      await supabase.auth.signOut();
      
      // 2. Limpiar cookies manualmente
      clearAuthCookies();
      
      // 3. Redirigir con el parámetro especial para bypasear el middleware
      setTimeout(() => {
        window.location.href = '/?escape_redirect=true';
      }, 500);
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      // Aún así intentar redirigir con el parámetro especial
      window.location.href = '/?escape_redirect=true';
    }
  };

  return (
    <div className="min-h-screen bg-black overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[#121212]"></div>
        <div className="absolute top-0 -left-40 w-96 h-96 bg-gradient-to-br from-red-500/20 via-purple-500/10 to-transparent rounded-full filter blur-3xl opacity-50 animate-blob"></div>
        <div className="absolute bottom-0 -right-40 w-96 h-96 bg-gradient-to-br from-purple-500/10 via-red-500/20 to-transparent rounded-full filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
      </div>
      
      {/* Header with logo */}
      <motion.header 
        className="w-full sticky top-0 z-50 bg-black/50 backdrop-blur-xl border-b border-white/10 shadow-lg"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="flex items-center">
              <Image 
                src="/images/diggr.png" 
                alt="Diggr" 
                width={120}
                height={48}
                priority
                className="h-12 w-auto"
              />
            </div>
          </motion.div>
        </div>
      </motion.header>
      
      <div className="max-w-2xl mx-auto px-4 py-12">
        <motion.div 
          className="relative"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-red-500/30 via-purple-500/20 to-red-500/30 opacity-70 blur-lg"></div>
          <motion.div 
            className="relative bg-[#181818]/80 backdrop-filter backdrop-blur-md border border-white/5 p-8 rounded-2xl"
            whileHover={{ y: -5, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)" }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            <div className="text-center">
              <div className="mb-6">
                <div className="w-20 h-20 bg-black/40 rounded-full flex items-center justify-center mx-auto">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-red-500">
                    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M15 9L9 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M9 9L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
              
              <h1 className="text-2xl font-bold mb-2 text-white">Account Deleted</h1>
              
              {message ? (
                <p className="text-[#A3A3A3] mb-6">{message}</p>
              ) : (
                <p className="text-[#A3A3A3] mb-6">
                  Your account has been marked for deletion and will be permanently removed after {daysRemaining} days.
                </p>
              )}
              
              <div className="bg-black/40 backdrop-blur-md p-4 rounded-xl mb-6 text-left border border-white/5">
                <h2 className="text-lg font-medium mb-2 text-white">Important Information</h2>
                <ul className="list-disc list-inside space-y-2 text-[#A3A3A3]">
                  <li>You've been signed out of your account</li>
                  <li>You won't be able to register again with the same email for {daysRemaining} days</li>
                  <li>You won't be able to connect the same Spotify account for {daysRemaining} days</li>
                  <li>Your playlists will remain in your Spotify account</li>
                </ul>
              </div>
              
              <button 
                onClick={handleNavigateHome}
                disabled={isSigningOut}
                className={`inline-block ${isSigningOut ? 'bg-gray-500' : 'bg-[#1DB954] hover:opacity-90'} text-white font-medium py-3 px-6 rounded-xl transition-colors active:scale-95 relative`}
              >
                {isSigningOut ? (
                  <>
                    <span className="opacity-0">Return to Homepage</span>
                    <span className="absolute inset-0 flex items-center justify-center">
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    </span>
                  </>
                ) : (
                  'Return to Homepage'
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
} 