// Global type declarations

// Google Analytics
interface Window {
  dataLayer: any[];
  gtag?: (
    command: 'event',
    action: string,
    params: {
      event_category: string;
      event_label: string;
      [key: string]: any;
    }
  ) => void;
  adsbygoogle?: any[];
}

// Extend UserProfile type to include plan_type
interface UserProfileWithPlan extends UserProfile {
  plan_type?: 'free' | 'premium';
}

// Add AdSense script type
interface HTMLScriptElement {
  dataset: {
    adClient?: string;
    adChannel?: string;
    [key: string]: string | undefined;
  };
} 