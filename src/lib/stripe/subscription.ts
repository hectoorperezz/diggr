import { createClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase';

// Initialize Supabase client
const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

// Initialize admin client when we have the service role key (server-side only)
const supabaseAdmin = process.env.SUPABASE_SERVICE_ROLE_KEY ? 
  createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY
  ) : null;

// Check if a user has a premium subscription
export async function hasActiveSubscription(userId: string): Promise<boolean> {
  try {
    // Use admin client if available (server-side), otherwise use regular client
    const client = supabaseAdmin || supabase;
    
    const { data, error } = await client
      .from('subscriptions')
      .select('plan_type, status')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error checking subscription status:', error);
      return false;
    }

    return data?.plan_type === 'premium' && data?.status === 'active';
  } catch (error) {
    console.error('Error checking subscription:', error);
    return false;
  }
}

// Get user subscription details
export async function getUserSubscription(userId: string) {
  try {
    // Use admin client if available (server-side), otherwise use regular client
    const client = supabaseAdmin || supabase;
    
    const { data, error } = await client
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error getting subscription:', error);
      
      // If we got a permission error and we're not using admin client,
      // log more details to help with debugging
      if (error.code === 'PGRST116' && !supabaseAdmin) {
        console.error('No subscription found for user:', userId);
      } else if (error.code === 'PGRST301' && !supabaseAdmin) {
        console.error('Permission denied - RLS may be blocking access');
      }
      
      // Default to free tier when errors occur
      return {
        user_id: userId,
        plan_type: 'free',
        status: 'inactive'
      };
    }

    return data;
  } catch (error) {
    console.error('Error getting subscription:', error);
    // Default to free tier when errors occur
    return {
      user_id: userId,
      plan_type: 'free',
      status: 'inactive'
    };
  }
}

// Check how many playlists a user has created this month
export async function getPlaylistsCreatedThisMonth(userId: string): Promise<number> {
  try {
    // Use admin client if available (server-side), otherwise use regular client
    const client = supabaseAdmin || supabase;
    
    const { data, error } = await client
      .from('usage_stats')
      .select('playlists_created_count')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error getting playlist count:', error);
      return 0;
    }

    return data?.playlists_created_count || 0;
  } catch (error) {
    console.error('Error getting playlist count:', error);
    return 0;
  }
}

// Check if a user can create more playlists
export async function canCreateMorePlaylists(userId: string): Promise<boolean> {
  try {
    // First check if user has a premium subscription
    const hasSubscription = await hasActiveSubscription(userId);
    
    // Premium users can create unlimited playlists
    if (hasSubscription) {
      return true;
    }
    
    // For free users, check how many playlists they've created this month
    const playlistCount = await getPlaylistsCreatedThisMonth(userId);
    
    // Free users are limited to 5 playlists per month
    return playlistCount < 5;
  } catch (error) {
    console.error('Error checking if user can create more playlists:', error);
    return false;
  }
}

// Get user quota information
export async function getUserQuota(userId: string) {
  try {
    // Use admin client if available (server-side), otherwise use regular client
    const client = supabaseAdmin || supabase;
    
    // Get subscription status
    const subscription = await getUserSubscription(userId);
    
    // Get current playlist count
    const { data: usageData, error: usageError } = await client
      .from('usage_stats')
      .select('playlists_created_count, reset_date')
      .eq('user_id', userId)
      .single();

    if (usageError) {
      console.error('Error getting usage stats:', usageError);
      // Don't throw, use defaults
      return {
        isPremium: subscription?.plan_type === 'premium' && subscription?.status === 'active',
        playlistsCreated: 0,
        playlistLimit: subscription?.plan_type === 'premium' ? Infinity : 5,
        resetDate: null,
        subscription: {
          plan: subscription?.plan_type || 'free',
          status: subscription?.status || 'inactive',
          currentPeriodEnd: subscription?.current_period_end,
        },
      };
    }

    const isPremium = subscription?.plan_type === 'premium' && subscription?.status === 'active';
    
    return {
      isPremium,
      playlistsCreated: usageData?.playlists_created_count || 0,
      playlistLimit: isPremium ? Infinity : 5,
      resetDate: usageData?.reset_date,
      subscription: {
        plan: subscription?.plan_type || 'free',
        status: subscription?.status || 'inactive',
        currentPeriodEnd: subscription?.current_period_end,
      },
    };
  } catch (error) {
    console.error('Error getting user quota:', error);
    // Don't throw, return a default response
    return {
      isPremium: false,
      playlistsCreated: 0,
      playlistLimit: 5,
      resetDate: null,
      subscription: {
        plan: 'free',
        status: 'inactive',
        currentPeriodEnd: null,
      },
    };
  }
} 