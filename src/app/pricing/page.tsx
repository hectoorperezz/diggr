'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useSupabase } from '@/components/providers/SupabaseProvider';
import Button from '@/components/ui/Button';
import { getUserQuota } from '@/lib/stripe/subscription';

export default function PricingPage() {
  const router = useRouter();
  const { user, session } = useSupabase();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userQuota, setUserQuota] = useState<any>(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  useEffect(() => {
    async function loadUserQuota() {
      if (!user) return;
      
      try {
        const quota = await getUserQuota(user.id);
        setUserQuota(quota);
      } catch (error) {
        console.error('Error loading user quota:', error);
      }
    }
    
    loadUserQuota();
  }, [user]);

  const handleCheckout = async (planId: string) => {
    if (!user) {
      router.push('/auth/login?redirect=/pricing');
      return;
    }

    try {
      setIsCheckingOut(true);
      
      const response = await fetch('/api/subscriptions/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          returnUrl: `${window.location.origin}/settings?tab=subscription`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create checkout session');
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (error: any) {
      console.error('Error creating checkout session:', error);
      setError(error.message);
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleManageSubscription = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      
      const response = await fetch('/api/subscriptions/portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          returnUrl: `${window.location.origin}/settings?tab=subscription`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create portal session');
      }

      // Redirect to Stripe Customer Portal
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No portal URL returned');
      }
    } catch (error: any) {
      console.error('Error creating portal session:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-[#121212]"></div>
        <div className="absolute top-0 -left-40 w-96 h-96 bg-gradient-to-br from-purple-500/20 via-[#1DB954]/20 to-transparent rounded-full filter blur-3xl opacity-50 animate-blob"></div>
        <div className="absolute top-0 -right-40 w-96 h-96 bg-gradient-to-br from-[#1DB954]/20 via-purple-500/20 to-transparent rounded-full filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-gradient-to-br from-purple-500/20 via-[#1DB954]/20 to-transparent rounded-full filter blur-3xl opacity-50 animate-blob animation-delay-4000"></div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <motion.h1
            className="text-4xl md:text-5xl font-bold mb-6"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            Choose Your Plan
          </motion.h1>
          <motion.p
            className="text-xl text-[#A3A3A3] max-w-3xl mx-auto"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            Select the perfect plan that fits your music discovery needs
          </motion.p>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-8 text-center">
            <p className="text-red-200">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-4xl mx-auto">
          {/* Free Plan */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7 }}
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
              
              {userQuota?.isPremium ? (
                <Button
                  onClick={handleManageSubscription}
                  disabled={isLoading}
                  variant="outline"
                  fullWidth
                >
                  {isLoading ? 'Loading...' : 'Downgrade Plan'}
                </Button>
              ) : (
                <Button
                  onClick={() => {}}
                  disabled={true}
                  variant="outline"
                  fullWidth
                >
                  Current Plan
                </Button>
              )}
            </motion.div>
          </motion.div>
          
          {/* Pro Plan */}
          <motion.div
            className="relative"
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
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
              
              {userQuota?.isPremium ? (
                <Button
                  onClick={handleManageSubscription}
                  disabled={isLoading}
                  variant="outline"
                  fullWidth
                >
                  {isLoading ? 'Loading...' : 'Manage Subscription'}
                </Button>
              ) : (
                <Button
                  onClick={() => handleCheckout('pro')}
                  disabled={isCheckingOut || !user}
                  variant="primary"
                  fullWidth
                >
                  {isCheckingOut ? 'Redirecting...' : user ? 'Upgrade Now' : 'Sign In to Upgrade'}
                </Button>
              )}
            </motion.div>
          </motion.div>
        </div>
        
        {/* FAQ Section */}
        <div className="mt-24 max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold mb-8 text-center">Frequently Asked Questions</h2>
          
          <div className="space-y-6">
            {[
              {
                question: "What happens if I reach my playlist limit?",
                answer: "Free plan users can create up to 5 playlists per month. Once you reach this limit, you'll need to wait until the next month or upgrade to the Pro plan for unlimited playlists."
              },
              {
                question: "Can I cancel my subscription anytime?",
                answer: "Yes, you can cancel your Pro subscription at any time. You'll continue to have access to Pro features until the end of your current billing period."
              },
              {
                question: "How do I manage my subscription?",
                answer: "You can manage your subscription from your account settings. From there, you can upgrade, downgrade, or cancel your subscription."
              },
              {
                question: "Is my payment information secure?",
                answer: "Yes, all payments are processed securely through Stripe, a PCI-compliant payment processor. We never store your credit card information on our servers."
              }
            ].map((faq, index) => (
              <div 
                key={index}
                className="bg-[#181818]/80 backdrop-filter backdrop-blur-md border border-white/5 rounded-xl p-6"
              >
                <h3 className="text-xl font-semibold mb-3">{faq.question}</h3>
                <p className="text-[#A3A3A3]">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
} 