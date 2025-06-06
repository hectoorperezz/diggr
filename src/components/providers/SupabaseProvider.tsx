'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User, createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';

interface UserProfile {
  id: string;
  email: string;
  spotify_connected: boolean;
  created_at: string;
  updated_at?: string;
  spotify_refresh_token?: string | null;
  plan_type?: 'free' | 'premium';
}

type SupabaseContextType = {
  user: User | null;
  userProfile: UserProfile | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
};

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined);

// Create a global flag to prevent multiple initializations
let authInitializedGlobal = false;

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [authError, setAuthError] = useState<Error | null>(null);
  
  // Create supabase client
  const supabase = createClient();

  // Fetch user profile data with enhanced debugging
  const fetchUserProfile = async (userId: string) => {
    try {
      console.log('Fetching user profile for ID:', userId);
      
      // First, get the auth user data to have the correct timestamps
      const { data: authUserData, error: authError } = await supabase.auth.getUser(userId);
      
      if (authError) {
        console.error('Error fetching auth user data:', authError);
        return null;
      }
      
      const authUser = authUserData?.user;
      
      if (!authUser) {
        console.error('No auth user data found');
        return null;
      }
      
      console.log('Auth user details:', {
        id: authUser.id,
        email: authUser.email,
        created_at: authUser.created_at
      });
      
      const created_at = authUser.created_at ? new Date(authUser.created_at).toISOString() : new Date().toISOString();
      console.log('Auth user created_at timestamp:', created_at, 'from raw value:', authUser.created_at);
      
      // Try direct admin client approach first (more reliable)
      let adminSupabase;
      try {
        adminSupabase = createSupabaseClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL || '',
          process.env.SUPABASE_SERVICE_ROLE_KEY || ''
        );
      } catch (error) {
        console.error('Error creating admin client:', error);
        adminSupabase = null;
      }

      // Only use admin client if service key is available
      const clientToUse = adminSupabase || supabase;
      const usingAdmin = clientToUse !== supabase;
      console.log(`Using ${usingAdmin ? 'ADMIN' : 'regular'} client to fetch user profile`);
      
      // Query database for user profile
      const { data, error } = await clientToUse
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Error fetching user profile:', error);
        
        // Check if the error is because the user record doesn't exist
        if (error.code === 'PGRST116') {
          console.log('User record not found in database, creating one...');
          
          try {
            // Try to create a user record with proper timestamp - always attempt with admin first for reliability
            const insertClient = process.env.SUPABASE_SERVICE_ROLE_KEY ? adminSupabase : supabase;
            
            const { data: userData, error: insertError } = await insertClient
              .from('users')
              .insert({
                id: userId,
                email: authUser.email || 'unknown@example.com',
                spotify_connected: false,
                created_at: created_at, // Set the created_at date from auth user
                updated_at: new Date().toISOString()
              })
              .select()
              .single();
            
            if (insertError) {
              console.error('Failed to create user record:', insertError);
              
              // As a fallback, try to call our API endpoint to fix the created_at date
              try {
                console.log('Attempting to fix created_at via API as fallback...');
                const response = await fetch('/api/user/fix-created-at', {
                  method: 'GET',
                  headers: { 'Cache-Control': 'no-cache' }
                });
                
                if (response.ok) {
                  const result = await response.json();
                  console.log('Fix created_at API response:', result);
                  
                  // If the API fixed it, try fetching the profile again
                  if (result.success) {
                    console.log('API fixed the date, fetching profile again...');
                    const { data: refreshedData, error: refreshError } = await clientToUse
                      .from('users')
                      .select('*')
                      .eq('id', userId)
                      .single();
                      
                    if (!refreshError && refreshedData) {
                      console.log('Successfully fetched profile after fixing date:', refreshedData);
                      
                      // Ensure we return a properly structured user profile
                      return {
                        id: refreshedData.id,
                        email: refreshedData.email,
                        spotify_connected: !!refreshedData.spotify_connected,
                        created_at: refreshedData.created_at || created_at,
                        updated_at: refreshedData.updated_at,
                        spotify_refresh_token: refreshedData.spotify_refresh_token,
                        plan_type: refreshedData.plan_type || 'free'
                      } as UserProfile;
                    }
                  }
                } else {
                  console.error('Failed to fix created_at via API:', await response.text());
                }
              } catch (apiError) {
                console.error('Error calling fix-created-at API:', apiError);
              }
              
              return null;
            }
            
            console.log('Successfully created user profile:', userData);
            // Ensure we return a properly structured user profile
            const profile = {
              id: userData.id,
              email: userData.email,
              spotify_connected: !!userData.spotify_connected,
              created_at: userData.created_at || created_at,
              updated_at: userData.updated_at,
              spotify_refresh_token: userData.spotify_refresh_token,
              plan_type: userData.plan_type || 'free'
            } as UserProfile;
            
            console.log('Returning new user profile with created_at:', profile.created_at);
            return profile;
          } catch (insertError) {
            console.error('Exception when creating user record:', insertError);
            return null;
          }
        }
        
        return null;
      }
      
      console.log('Found existing user profile with created_at:', data.created_at);
      
      // If profile exists but created_at is null, try to fix it
      if (!data.created_at) {
        console.warn('User profile exists but has no created_at date, attempting to fix...');
        
        try {
          // Update with auth user created_at
          const { data: updatedData, error: updateError } = await clientToUse
            .from('users')
            .update({ 
              created_at: created_at,
              updated_at: new Date().toISOString()
            })
            .eq('id', userId)
            .select()
            .single();
            
          if (!updateError && updatedData) {
            console.log('Fixed missing created_at in existing profile:', updatedData.created_at);
            data.created_at = updatedData.created_at;
          } else {
            console.error('Failed to fix missing created_at:', updateError);
            // Still use auth date as fallback
            data.created_at = created_at;
          }
        } catch (updateError) {
          console.error('Error updating missing created_at:', updateError);
          // Use auth date as fallback
          data.created_at = created_at;
        }
      }
      
      // Ensure we return a properly structured user profile with all required fields
      const profile = {
        id: data.id,
        email: data.email,
        spotify_connected: !!data.spotify_connected, // Ensure this is a boolean
        created_at: data.created_at || created_at, // Use auth user created_at as fallback
        updated_at: data.updated_at,
        spotify_refresh_token: data.spotify_refresh_token,
        plan_type: data.plan_type || 'free' // Use 'free' as fallback
      } as UserProfile;
      
      console.log('Final user profile being returned:', {
        id: profile.id,
        email: profile.email,
        created_at: profile.created_at,
        spotify_connected: profile.spotify_connected,
        plan_type: profile.plan_type
      });
      
      return profile;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  };

  const refreshSession = async () => {
    try {
      console.log('Refreshing session...');
      const { data } = await supabase.auth.getSession();
      
      if (data.session) {
        console.log('Session refreshed, user:', data.session.user.email);
      } else {
        console.log('No session found during refresh');
      }
      
      setSession(data.session);
      setUser(data.session?.user || null);
      
      if (data.session?.user) {
        const profile = await fetchUserProfile(data.session.user.id);
        setUserProfile(profile);
      }
    } catch (error) {
      console.error('Error refreshing session:', error);
      setAuthError(error instanceof Error ? error : new Error('Unknown error refreshing session'));
    } finally {
      // Make sure loading is always false after refresh
      setIsLoading(false);
    }
  };

  // Force the loading state to resolve after a timeout
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (isLoading) {
        console.log('Forcing loading state to resolve after timeout');
        setIsLoading(false);
      }
    }, 8000); // Increased from 3s to 8s timeout
    
    return () => clearTimeout(timeoutId);
  }, [isLoading]);

  useEffect(() => {
    // Prevent multiple initializations - both with local and global flags
    if (authInitialized || authInitializedGlobal) {
      console.log('Auth already initialized, skipping...');
      return;
    }
    
    // Set global flag
    authInitializedGlobal = true;
    
    // Get initial session with retry mechanism
    const initializeAuth = async () => {
      setIsLoading(true);
      
      try {
        console.log('Initializing auth...');
        
        // First attempt
        let data;
        let tryCount = 0;
        const maxTries = 3;
        let lastError;
        
        while (tryCount < maxTries) {
          try {
            tryCount++;
            console.log(`Auth initialization attempt ${tryCount}/${maxTries}`);
            const result = await supabase.auth.getSession();
            data = result.data;
            
            // If we get here, the request succeeded
            break;
          } catch (err) {
            lastError = err;
            console.error(`Auth init attempt ${tryCount} failed:`, err);
            
            // Only wait and retry if we haven't hit the max attempts
            if (tryCount < maxTries) {
              // Exponential backoff: 500ms, 1000ms, 2000ms
              const backoffTime = Math.min(500 * Math.pow(2, tryCount - 1), 3000);
              console.log(`Retrying in ${backoffTime}ms...`);
              await new Promise(resolve => setTimeout(resolve, backoffTime));
            }
          }
        }
        
        // If all attempts failed, throw the last error
        if (!data && lastError) {
          throw lastError;
        }
        
        console.log('Initial session check:', { 
          hasSession: !!data?.session,
          user: data?.session?.user?.email || 'none'
        });
        
        setSession(data?.session || null);
        setUser(data?.session?.user || null);
        
        if (data?.session?.user) {
          try {
            // Use a timeout to fetch profile to avoid race conditions
            setTimeout(async () => {
              try {
                const profile = await fetchUserProfile(data.session.user.id);
                setUserProfile(profile);
              } catch (profileErr) {
                console.error('Error in delayed profile fetch:', profileErr);
              }
            }, 500);
          } catch (err) {
            console.error('Error setting up profile fetch:', err);
            // Continue even if profile fetch setup fails
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        setAuthError(error instanceof Error ? error : new Error('Unknown error initializing auth'));
      } finally {
        // Always set loading to false and mark as initialized, even if there was an error
        setIsLoading(false);
        setAuthInitialized(true);
        console.log('Auth initialization complete');
      }
    };
    
    initializeAuth();

    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        console.log('Auth state change event:', event, 'Session:', !!currentSession);
        
        // Skip if we're just refreshing a session with the same ID
        // This prevents unnecessary re-renders
        if (event === 'TOKEN_REFRESHED' && 
            session?.user?.id === currentSession?.user?.id) {
          console.log('Token refreshed for same user, skipping state update');
          return;
        }
        
        // Don't trigger updates for INITIAL_SESSION events if we've already initialized
        if (event === 'INITIAL_SESSION' && authInitialized) {
          console.log('Ignoring INITIAL_SESSION event after initialization');
          return;
        }
        
        setSession(currentSession);
        setUser(currentSession?.user || null);
        
        // Delay profile fetching to prevent race conditions
        if (currentSession?.user) {
          // Use a short delay to allow auth state to settle
          setTimeout(async () => {
            try {
              const profile = await fetchUserProfile(currentSession.user.id);
              setUserProfile(profile);
            } catch (err) {
              console.error('Error in delayed profile fetch during auth change:', err);
            }
          }, 500);
        } else {
          setUserProfile(null);
        }
        
        // Always set isLoading to false
        setIsLoading(false);
        
        // Force refresh server props only for specific events
        if (event === 'SIGNED_IN') {
          console.log('User signed in, refreshing router');
          router.refresh();
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [router, authInitialized]);

  const signIn = async (email: string, password: string) => {
    try {
      console.log('Signing in...');
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error('Sign in error:', error);
        toast.error(error.message);
        return { error };
      }
      
      console.log('Sign in successful, session data:', data.session);
      
      // Wait for session to be set
      setSession(data.session);
      setUser(data.user);
      
      if (data.user) {
        try {
          const profile = await fetchUserProfile(data.user.id);
          setUserProfile(profile);
        } catch (err) {
          console.error('Error fetching profile after sign in:', err);
          // Continue even if profile fetch fails
        }
      }
      
      toast.success('Signed in successfully!');
      
      // Use window.location for a full page reload instead of router.push
      window.location.href = '/dashboard';
      
      return { error: null };
    } catch (error: any) {
      console.error('Unexpected sign in error:', error);
      toast.error('An unexpected error occurred');
      return { error };
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // For development only - disable email confirmation
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            email: email
          }
        }
      });
      
      if (error) {
        toast.error(error.message);
        return { error };
      }
      
      console.log('Sign up response:', data);
      
      toast.success('Signed up successfully! Please check your email for a confirmation link.');
      return { error: null };
    } catch (error: any) {
      toast.error('An unexpected error occurred');
      console.error('Sign up error:', error);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      // Limpiar estado local primero
      setSession(null);
      setUser(null);
      setUserProfile(null);
      
      console.log('Iniciando cierre de sesión...');
      
      // Esperar a que supabase termine el signout
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }
      
      console.log('Sesión cerrada correctamente en el servidor');
      toast.success('Signed out successfully!');
      
      // Pequeña pausa para asegurar que todo se limpie correctamente
      setTimeout(() => {
        // Forzar limpieza completa con reload en lugar de navegación simple
        window.location.href = '/';
      }, 100);
    } catch (error) {
      console.error('Sign out error:', error);
      toast.error('Error signing out');
      
      // Aún así intentar redirigir al usuario a la página de inicio
      setTimeout(() => {
        window.location.href = '/auth/login';
      }, 1000);
    }
  };

  const value = {
    user,
    userProfile,
    session,
    isLoading,
    signIn,
    signUp,
    signOut,
    refreshSession,
  };

  return (
    <SupabaseContext.Provider value={value}>
      {children}
    </SupabaseContext.Provider>
  );
}

export function useSupabase() {
  const context = useContext(SupabaseContext);
  if (context === undefined) {
    throw new Error('useSupabase must be used within a SupabaseProvider');
  }
  return context;
} 