import React from 'react';
import { useSupabase } from '@/components/providers/SupabaseProvider';
import VideoAdComponent from './VideoAdComponent';

// For TypeScript
type UserProfileWithPlan = {
  id: string;
  email: string;
  spotify_connected: boolean;
  created_at: string;
  updated_at?: string;
  spotify_refresh_token?: string | null;
  plan_type?: 'free' | 'premium';
};

interface ConditionalAdDisplayProps {
  onAdComplete?: () => void;
  onAdError?: (error: any) => void;
  fallback?: React.ReactNode; // Component to show for premium users
}

const ConditionalAdDisplay: React.FC<ConditionalAdDisplayProps> = ({
  onAdComplete,
  onAdError,
  fallback
}) => {
  const { userProfile } = useSupabase();
  
  // Type assertion for userProfile to include plan_type
  const userProfileWithPlan = userProfile as UserProfileWithPlan | null;
  
  // Check if user should see ads (free tier or no subscription)
  const shouldShowAds = !userProfileWithPlan?.plan_type || userProfileWithPlan.plan_type === 'free';
  
  if (!shouldShowAds) {
    return <>{fallback}</>;
  }
  
  return (
    <VideoAdComponent
      onAdComplete={onAdComplete}
      onAdError={onAdError}
    />
  );
};

export default ConditionalAdDisplay; 