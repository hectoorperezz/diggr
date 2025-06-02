import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { getUserQuota } from '@/lib/stripe/subscription';
import { createClient } from '@supabase/supabase-js';

// Create an admin client for direct database access
const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function GET(request: NextRequest) {
  try {
    // Get the current user's session
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the user's subscription quota information
    const userId = session.user.id;

    try {
      // First try direct database access with admin client
      const { data: subscription, error: subscriptionError } = await adminClient
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .single();

      const { data: usageData, error: usageError } = await adminClient
        .from('usage_stats')
        .select('playlists_created_count, reset_date')
        .eq('user_id', userId)
        .single();

      if (subscriptionError) {
        console.error('Admin client error getting subscription:', subscriptionError);
        // Fall back to the getUserQuota function
        const quota = await getUserQuota(userId);
        return NextResponse.json(quota);
      }

      // If we have direct database access results, construct the quota response
      const isPremium = subscription?.plan_type === 'premium' && subscription?.status === 'active';
      
      return NextResponse.json({
        isPremium,
        playlistsCreated: usageData?.playlists_created_count || 0,
        playlistLimit: isPremium ? Infinity : 5,
        resetDate: usageData?.reset_date,
        subscription: {
          plan: subscription?.plan_type || 'free',
          status: subscription?.status || 'inactive',
          currentPeriodEnd: subscription?.current_period_end,
        },
      });
    } catch (directError) {
      console.error('Error with direct database access:', directError);
      // Fall back to the getUserQuota function
      const quota = await getUserQuota(userId);
      return NextResponse.json(quota);
    }
  } catch (error: any) {
    console.error('Error getting subscription info:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 