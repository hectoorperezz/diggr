import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import { toast } from 'react-hot-toast';

interface CheckoutButtonProps {
  returnUrl?: string;
  buttonText?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  disabled?: boolean;
  className?: string;
}

export default function CheckoutButton({
  returnUrl,
  buttonText = 'Upgrade to Pro',
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  className = '',
}: CheckoutButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleCheckout = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/subscriptions/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          returnUrl: returnUrl || `${window.location.origin}/settings`,
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
      toast.error(error.message || 'Failed to start checkout process');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleCheckout}
      disabled={disabled || isLoading}
      variant={variant}
      size={size}
      fullWidth={fullWidth}
      className={className}
    >
      {isLoading ? 'Processing...' : buttonText}
    </Button>
  );
} 