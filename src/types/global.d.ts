// Global type declarations

// Google Analytics
interface Window {
  dataLayer: any[];
  gtag: (command: string, action: string, params?: any) => void;
  adsbygoogle: any[];
}

// Extend UserProfile type to include plan_type
interface UserProfileWithPlan extends UserProfile {
  plan_type?: 'free' | 'premium';
} 