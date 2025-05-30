'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
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

  // Fetch user profile data
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
      
      const created_at = authUser.created_at ? new Date(authUser.created_at).toISOString() : new Date().toISOString();
      console.log('Auth user created_at timestamp:', created_at, 'from raw value:', authUser.created_at);
      
      // Query database for user profile
      const { data, error } = await supabase
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
            // Try to create a user record with proper timestamp
            const { data: userData, error: insertError } = await supabase
              .from('users')
              .insert({
                id: userId,
                email: authUser.email || 'unknown@example.com',
                spotify_connected: false,
                created_at: created_at,
                updated_at: new Date().toISOString()
              })
              .select()
              .single();
            
            if (insertError) {
              console.error('Failed to create user record:', insertError);
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
              spotify_refresh_token: userData.spotify_refresh_token
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
      
      console.log('Found existing user profile:', data);
      
      // Ensure we return a properly structured user profile with all required fields
      const profile = {
        id: data.id,
        email: data.email,
        spotify_connected: !!data.spotify_connected, // Ensure this is a boolean
        created_at: data.created_at || created_at, // Use auth user created_at as fallback
        updated_at: data.updated_at,
        spotify_refresh_token: data.spotify_refresh_token
      } as UserProfile;
      
      console.log('Returning existing user profile with created_at:', profile.created_at);
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
    }, 3000); // 3 second timeout
    
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
    
    // Get initial session
    const initializeAuth = async () => {
      setIsLoading(true);
      
      try {
        console.log('Initializing auth...');
        const { data } = await supabase.auth.getSession();
        
        console.log('Initial session check:', { 
          hasSession: !!data.session,
          user: data.session?.user?.email || 'none'
        });
        
        setSession(data.session);
        setUser(data.session?.user || null);
        
        if (data.session?.user) {
          try {
            const profile = await fetchUserProfile(data.session.user.id);
            setUserProfile(profile);
          } catch (err) {
            console.error('Error fetching user profile during init:', err);
            // Continue even if profile fetch fails
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
        
        if (currentSession?.user) {
          try {
            const profile = await fetchUserProfile(currentSession.user.id);
            setUserProfile(profile);
          } catch (err) {
            console.error('Error fetching profile in auth change:', err);
            // Continue even if profile fetch fails
          }
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
      await supabase.auth.signOut();
      toast.success('Signed out successfully!');
      
      // Use window.location for a full page reload
      window.location.href = '/';
    } catch (error) {
      toast.error('Error signing out');
      console.error('Sign out error:', error);
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