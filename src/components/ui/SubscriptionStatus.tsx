import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSupabase } from '@/components/providers/SupabaseProvider';
import { motion } from 'framer-motion';
import { getUserQuota } from '@/lib/stripe/subscription';
import CheckoutButton from '@/components/stripe/CheckoutButton';

export default function SubscriptionStatus() {
  const { user } = useSupabase();
  const [quota, setQuota] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    async function fetchQuota() {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        console.log('Fetching subscription data for user:', user.id);
        
        // Try to get quota from API with cache-busting query parameter
        const timestamp = new Date().getTime();
        const response = await fetch(`/api/user/subscription?t=${timestamp}`, {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('Subscription data received:', data);
          setQuota(data);
          
          // Check if we have premium data
          if (data.isPremium) {
            console.log('User has premium subscription');
          } else {
            console.log('User does not have premium subscription');
            
            // If we've retried less than 3 times and got a free plan when expecting premium,
            // try again after a short delay
            if (retryCount < 3) {
              console.log(`Retry attempt ${retryCount + 1} for subscription data`);
              setTimeout(() => {
                setRetryCount(prev => prev + 1);
              }, 2000);
            }
          }
        } else {
          console.error('Error response from subscription API:', response.status);
          
          // Fallback to client-side function
          console.log('Falling back to client-side function');
          const quotaData = await getUserQuota(user.id);
          setQuota(quotaData);
        }
      } catch (error) {
        console.error('Error fetching subscription status:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchQuota();
  }, [user, retryCount]);

  if (isLoading || !user) {
    return (
      <motion.div
        className="px-3 py-1 rounded-full bg-black/20 text-xs text-[#A3A3A3] animate-pulse"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        Loading...
      </motion.div>
    );
  }

  if (!quota) {
    return (
      <CheckoutButton
        returnUrl={typeof window !== 'undefined' ? window.location.href : ''}
        buttonText="Free Plan"
        variant="outline"
        className="px-3 py-1 rounded-full bg-black/20 text-xs text-white hover:bg-black/30 transition-colors"
      />
    );
  }

  const isPremium = quota.isPremium;
  const playlistsCreated = quota.playlistsCreated || 0;
  const playlistLimit = quota.playlistLimit || 5;

  return (
    isPremium ? (
      <Link href="/pricing">
        <motion.div
          className="px-3 py-1 rounded-full bg-gradient-to-r from-[#1DB954]/80 to-purple-500/80 text-white hover:from-[#1DB954] hover:to-purple-500 flex items-center gap-2 cursor-pointer transition-colors"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <span className="text-xs font-medium">Pro Plan</span>
        </motion.div>
      </Link>
    ) : (
      <CheckoutButton
        returnUrl={typeof window !== 'undefined' ? window.location.href : ''}
        buttonText={`Free Plan ${playlistsCreated}/${playlistLimit}`}
        variant="outline"
        className="px-3 py-1 rounded-full bg-black/20 text-xs text-white hover:bg-black/30 transition-colors"
      />
    )
  );
} 