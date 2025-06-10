'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import { toast } from 'react-hot-toast';
import { useSupabase } from '@/components/providers/SupabaseProvider';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function DeleteAccountPage() {
  const router = useRouter();
  const { user } = useSupabase();
  const [confirmation, setConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Cooling period in days
  const COOLING_PERIOD_DAYS = 30;
  
  const handleDeleteAccount = async () => {
    if (confirmation !== 'DELETE MY ACCOUNT') {
      toast.error('Please type the confirmation text exactly as shown');
      return;
    }
    
    setIsDeleting(true);
    
    try {
      const response = await fetch('/api/user/delete-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to delete account');
      }
      
      toast.success('Your account has been marked for deletion');
      
      // Redirigir a una página de confirmación
      setTimeout(() => {
        router.push('/account-deleted');
      }, 2000);
    } catch (error: any) {
      console.error('Error deleting account:', error);
      toast.error(error.message || 'Failed to delete account');
      setIsDeleting(false);
    }
  };
  
  // Si no hay usuario autenticado, redirigir a login
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="mb-4">You need to be logged in to delete your account</p>
          <Button href="/auth/login" variant="primary">Go to Login</Button>
        </div>
      </div>
    );
  }
  
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
            <Link href="/" className="flex items-center">
              <img src="/images/diggr.png" alt="Diggr" className="h-12" />
            </Link>
          </motion.div>
          <motion.div 
            className="flex items-center space-x-4"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Button 
              href="/settings" 
              variant="outline"
              size="md"
              icon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              }
            >
              Back to Settings
            </Button>
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
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-white">Delete Your Account</h1>
              <p className="mt-2 text-[#A3A3A3]">This action cannot be undone</p>
            </div>
            
            <div className="space-y-6">
              <div className="bg-black/40 backdrop-blur-md border border-white/5 rounded-xl p-4">
                <h2 className="text-lg font-medium mb-2 text-red-400">Warning</h2>
                <ul className="list-disc list-inside space-y-2 text-[#A3A3A3]">
                  <li>All your data will be permanently deleted after {COOLING_PERIOD_DAYS} days</li>
                  <li>You won't be able to register again with the same email for {COOLING_PERIOD_DAYS} days</li>
                  <li>You won't be able to connect the same Spotify account for {COOLING_PERIOD_DAYS} days</li>
                  <li>All your playlists generated with Diggr will remain in your Spotify account</li>
                </ul>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  To confirm, type "DELETE MY ACCOUNT" in the field below
                </label>
                <input
                  type="text"
                  value={confirmation}
                  onChange={(e) => setConfirmation(e.target.value)}
                  className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 w-full 
                  text-white focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent
                  transition-all duration-200"
                  placeholder="DELETE MY ACCOUNT"
                />
              </div>
              
              <div className="flex items-center justify-between pt-4">
                <Button
                  href="/settings"
                  variant="outline"
                  size="lg"
                >
                  Cancel
                </Button>
                
                <Button
                  onClick={handleDeleteAccount}
                  disabled={isDeleting || confirmation !== 'DELETE MY ACCOUNT'}
                  variant="danger"
                  size="lg"
                >
                  {isDeleting ? 'Deleting...' : 'Delete Account Permanently'}
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
} 