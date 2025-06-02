import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import { toast } from 'react-hot-toast';

interface PortalButtonProps {
  returnUrl?: string;
  buttonText?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  disabled?: boolean;
  className?: string;
}

export default function PortalButton({
  returnUrl,
  buttonText = 'Manage Subscription',
  variant = 'outline',
  size = 'md',
  fullWidth = false,
  disabled = false,
  className = '',
}: PortalButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handlePortal = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/api/subscriptions/portal', {
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
      toast.error(error.message || 'Failed to open subscription management');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handlePortal}
      disabled={disabled || isLoading}
      variant={variant}
      size={size}
      fullWidth={fullWidth}
      className={className}
    >
      {isLoading ? 'Loading...' : buttonText}
    </Button>
  );
} 