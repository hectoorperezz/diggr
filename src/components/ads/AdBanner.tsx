import React, { useEffect, useRef, useState, memo } from 'react';
import { useSupabase } from '@/components/providers/SupabaseProvider';

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

// Props for different ad sizes and styles
interface AdBannerProps {
  variant?: 'sidebar' | 'inline' | 'card';
  className?: string;
  forceShow?: boolean; // Prop para forzar la visualización en desarrollo
}

const AdBanner: React.FC<AdBannerProps> = memo(({ 
  variant = 'inline',
  className = '',
  forceShow = false
}) => {
  const { userProfile, session } = useSupabase();
  const adContainerRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [adError, setAdError] = useState<string | null>(null);
  const [planInfo, setPlanInfo] = useState<{plan_type?: string, isLoaded: boolean, isFree?: boolean}>({
    isLoaded: false,
    isFree: false // Por defecto asumimos que no es cuenta gratuita
  });
  
  // Type assertion for userProfile to include plan_type
  const userProfileWithPlan = userProfile as UserProfileWithPlan | null;
  
  // Cargar información del plan del usuario
  useEffect(() => {
    // Evitar refetch innecesario si ya tenemos los datos
    if (planInfo.isLoaded && planInfo.plan_type) return;
    
    const getPlanInfo = async () => {
      // Solo en el cliente
      if (typeof window === 'undefined') return;
      
      try {
        // Si no hay sesión, asumimos que es un visitante sin loguear
        if (!session?.user.id) {
          setPlanInfo({
            plan_type: 'free',
            isLoaded: true,
            isFree: true
          });
          return;
        }
        
        // Obtener la información del plan desde la API
        const response = await fetch('/api/user/subscription', {
          headers: { 'Cache-Control': 'no-cache' }
        });
        
        if (response.ok) {
          const data = await response.json();
          const isPlanFree = !data.isPremium;
          
          if (process.env.NODE_ENV === 'development') {
            console.log('AdBanner - Plan Info from API:', {
              ...data,
              isFree: isPlanFree
            });
          }
          
          setPlanInfo({
            plan_type: data.isPremium ? 'premium' : 'free',
            isLoaded: true,
            isFree: isPlanFree
          });
        } else {
          if (process.env.NODE_ENV === 'development') {
            console.error('Error fetching plan info:', await response.text());
          }
          
          // Usar el valor del perfil como respaldo
          const isProfileFree = !userProfileWithPlan?.plan_type || userProfileWithPlan.plan_type === 'free';
          setPlanInfo({
            plan_type: userProfileWithPlan?.plan_type || 'free',
            isLoaded: true,
            isFree: isProfileFree
          });
        }
      } catch (error) {
        console.error('Error loading plan info:', error);
        
        // Usar el valor del perfil como respaldo
        const isProfileFree = !userProfileWithPlan?.plan_type || userProfileWithPlan.plan_type === 'free';
        setPlanInfo({
          plan_type: userProfileWithPlan?.plan_type || 'free',
          isLoaded: true,
          isFree: isProfileFree
        });
      }
    };
    
    getPlanInfo();
  }, [session?.user?.id, userProfileWithPlan?.plan_type, planInfo.isLoaded, planInfo.plan_type]);
  
  // En desarrollo, mostrar log de la información de plan
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('AdBanner - Plan Info State:', { 
        planTypeFromState: planInfo.plan_type,
        planTypeFromProfile: userProfileWithPlan?.plan_type,
        isAuthenticated: !!session?.user,
        isFree: planInfo.isFree,
        variant
      });
    }
  }, [planInfo, userProfileWithPlan?.plan_type, session?.user, variant]);
  
  // Check if user should see ads (SOLO si se ha confirmado que es free)
  const shouldShowAds = forceShow || (planInfo.isLoaded && planInfo.isFree === true);
  
  // Log de depuración
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`AdBanner (${variant}) - shouldShowAds:`, shouldShowAds, 
        shouldShowAds ? 'MOSTRANDO ANUNCIOS (cuenta free confirmada)' : 'NO mostrando anuncios');
    }
  }, [shouldShowAds, variant]);

  // Debug log para usuarios premium
  useEffect(() => {
    if (!shouldShowAds && process.env.NODE_ENV === 'development') {
      console.log(`AdBanner (${variant}) - Usuario premium o sin verificar, no mostrando anuncios`);
    }
  }, [shouldShowAds, variant]);
  
  // Initialize AdSense ads when component mounts (solo en producción)
  useEffect(() => {
    // Skip if not client-side, premium user, or development environment
    if (typeof window === 'undefined' || !shouldShowAds || process.env.NODE_ENV === 'development') return;
    
    // Skip if already initialized
    if (isLoaded) return;
    
    try {
      // Inicializar anuncios cuando el componente se monta
      if (adContainerRef.current && window.adsbygoogle) {
        // Push the ad to AdSense
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        setIsLoaded(true);
        
        // Track ad impression in Google Analytics (si está disponible)
        if (window.gtag) {
          window.gtag('event', 'ad_impression', {
            'event_category': 'ads',
            'event_label': variant
          });
        }
      }
    } catch (e) {
      console.error("AdSense error:", e);
      setAdError("Failed to load advertisement");
    }
  }, [variant, shouldShowAds, isLoaded]);
  
  // No ads for premium users or when not yet verified - return early after all hooks
  if (!shouldShowAds) {
    return null;
  }
  
  // Set up appropriate styling based on variant
  const containerStyles = {
    'sidebar': 'w-full bg-black/5 backdrop-blur-sm rounded-xl overflow-hidden mb-4',
    'inline': 'w-full my-4 rounded-xl overflow-hidden',
    'card': 'w-full bg-[#181818]/80 backdrop-filter backdrop-blur-lg border border-white/5 rounded-xl overflow-hidden my-4'
  }[variant];
  
  // Get ad slot based on variant - Actualizados con el ID real proporcionado
  const getAdSlot = () => {
    switch (variant) {
      // ID real de AdSense
      case 'sidebar': return '2960918211'; // ID real de "Diggr"
      case 'inline': return '2960918211';  // Usando el mismo ID para inline
      case 'card': return '2960918211';    // Usando el mismo ID para card
      default: return '2960918211';        // ID por defecto
    }
  };
  
  // Handle different sizes based on variant
  const adSize = {
    'sidebar': { width: '300px', height: '250px' },
    'inline': { width: '100%', height: 'auto', minHeight: '90px' },
    'card': { width: '100%', height: 'auto', minHeight: '250px' }
  }[variant];
  
  // For development - show placeholder instead of real ads
  if (process.env.NODE_ENV === 'development') {
    return (
      <div className={`${containerStyles} ${className}`}>
        <div 
          className="flex flex-col items-center justify-center bg-gradient-to-r from-purple-500/10 to-[#1DB954]/10 text-white/70 text-xs text-center p-4"
          style={adSize}
        >
          <div className="text-center max-w-md">
            <div className="text-[#1DB954] text-sm font-medium mb-2">ANUNCIO DE ADSENSE</div>
            <div className="px-2 py-1 bg-black/40 rounded text-white mb-2 text-xs">
              {variant === 'sidebar' ? '300×250 o 300×600' : 
               variant === 'inline' ? '728×90 o responsive' : 
               'Responsive grande'}
            </div>
            <p className="text-xs text-white/70 mb-2">
              Un anuncio real aparecería aquí en producción
            </p>
            <div className="mt-1 p-1 bg-black/20 rounded text-[10px] font-mono text-white/60">
              Slot ID: {getAdSlot()}
            </div>
            <div className="mt-2 text-[10px] text-white/40">
              Status: Usuario {planInfo.plan_type || 'desconocido'} ({planInfo.isFree ? 'gratuito' : 'premium'})
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Production - show real ads
  return (
    <div className={`${containerStyles} ${className}`}>
      {adError ? (
        // Show placeholder if ad fails to load
        <div className="w-full bg-black/5 flex items-center justify-center p-2 text-xs text-white/30">
          Ad content
        </div>
      ) : (
        <ins
          className="adsbygoogle"
          style={{ display: 'block', ...adSize }}
          data-ad-client="ca-pub-3838039470797804" // Tu ID de publisher de AdSense
          data-ad-slot={getAdSlot()}
          data-ad-format="auto"
          data-full-width-responsive="true"
          ref={adContainerRef as any}
        />
      )}
    </div>
  );
});

AdBanner.displayName = 'AdBanner';

export default AdBanner; 