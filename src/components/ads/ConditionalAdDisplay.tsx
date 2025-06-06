import React, { useEffect, useState, memo } from 'react';
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
  children?: React.ReactNode;
  onAdComplete?: () => void;
  onAdError?: (error: any) => void;
  fallback?: React.ReactNode;
  forceShow?: boolean; // Para pruebas
}

/**
 * Component that conditionally displays ads or fallback content based on user's subscription status
 * - If user is premium, displays the fallback content (if provided)
 * - If user is free or not logged in, displays the ad or children (if provided)
 * 
 * IMPORTANTE: Por defecto NO muestra anuncios hasta confirmar que es cuenta free
 */
const ConditionalAdDisplay: React.FC<ConditionalAdDisplayProps> = memo(({ 
  children,
  onAdComplete,
  onAdError,
  fallback = null,
  forceShow = false 
}) => {
  const { userProfile, session } = useSupabase();
  const [planInfo, setPlanInfo] = useState<{plan_type?: string, isLoaded: boolean, isFree?: boolean}>({
    isLoaded: false,
    isFree: false  // Por defecto asumimos que NO es cuenta free
  });
  
  // Type assertion for userProfile to include plan_type
  const userProfileWithPlan = userProfile as UserProfileWithPlan | null;
  
  // Cargar información del plan del usuario desde la API
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
            console.log('ConditionalAdDisplay - Plan Info from API:', {
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
      console.log('ConditionalAdDisplay - Plan Info:', { 
        planTypeFromState: planInfo.plan_type,
        planTypeFromProfile: userProfileWithPlan?.plan_type,
        isFree: planInfo.isFree,
        isAuthenticated: !!session?.user
      });
    }
  }, [planInfo, userProfileWithPlan?.plan_type, session?.user]);
  
  // Check if user should see ads (SOLO si se confirma que es free)
  const shouldShowAds = forceShow || (planInfo.isLoaded && planInfo.isFree === true);
  
  // Log de depuración
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`ConditionalAdDisplay - shouldShowAds:`, shouldShowAds,
        shouldShowAds ? 'MOSTRANDO ANUNCIOS (cuenta free confirmada)' : 'NO mostrando anuncios');
    }
  }, [shouldShowAds]);
  
  // Debug log para usuarios premium
  useEffect(() => {
    if (!shouldShowAds && process.env.NODE_ENV === 'development') {
      console.log('ConditionalAdDisplay - Usuario premium o sin verificar, no mostrando anuncios');
    }
  }, [shouldShowAds]);
  
  // Determinar qué contenido mostrar
  if (!shouldShowAds) {
    // Para usuarios premium o antes de verificar, mostrar contenido alternativo o nada
    return <>{fallback}</>;
  }
  
  // Para usuarios free confirmados:
  if (onAdComplete || onAdError) {
    // Si hay callbacks, usar el componente de video anuncio
    return (
      <VideoAdComponent
        onAdComplete={onAdComplete}
        onAdError={onAdError}
      />
    );
  }
  
  // De lo contrario, mostrar los children (probablemente otros banners de anuncios)
  return <>{children}</>;
});

ConditionalAdDisplay.displayName = 'ConditionalAdDisplay';

export default ConditionalAdDisplay; 