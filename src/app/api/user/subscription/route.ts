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
    console.log('[DEBUG] Subscription API - Getting data for user:', userId);

    try {
      // First try direct database access with admin client
      console.log('[DEBUG] Subscription API - Querying subscription with admin client');
      const { data: subscription, error: subscriptionError } = await adminClient
        .from('subscriptions')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (subscription) {
        console.log('[DEBUG] Subscription API - Raw subscription data:', JSON.stringify(subscription));
      }

      const { data: usageData, error: usageError } = await adminClient
        .from('usage_stats')
        .select('playlists_created_count, reset_date')
        .eq('user_id', userId)
        .single();

      if (subscriptionError) {
        console.error('[DEBUG] Subscription API - Admin client error getting subscription:', subscriptionError);
        // Fall back to the getUserQuota function
        console.log('[DEBUG] Subscription API - Falling back to getUserQuota');
        const quota = await getUserQuota(userId);
        return NextResponse.json(quota);
      }

      // If we have direct database access results, construct the quota response
      const isPremium = subscription?.plan_type === 'premium' && subscription?.status === 'active';
      console.log('[DEBUG] Subscription API - Plan type:', subscription?.plan_type, 'Status:', subscription?.status, 'isPremium:', isPremium);
      
      // Check for canceled but still active subscriptions
      let effectivePremiumStatus = isPremium;
      let cancellationDate = null;
      
      if (subscription?.plan_type === 'premium' && !isPremium && subscription?.current_period_end) {
        const periodEndDate = new Date(subscription.current_period_end);
        const now = new Date();
        
        // If the subscription end date is in the future, user still has premium access
        if (periodEndDate > now) {
          console.log(`[DEBUG] Subscription API - Canceled subscription but still in paid period until ${periodEndDate.toISOString()}`);
          effectivePremiumStatus = true;
          cancellationDate = subscription.current_period_end;
        }
      }
      
      const response = {
        isPremium: effectivePremiumStatus,
        playlistsCreated: usageData?.playlists_created_count || 0,
        playlistLimit: effectivePremiumStatus ? Infinity : 5,
        resetDate: usageData?.reset_date,
        subscription: {
          plan: subscription?.plan_type || 'free',
          status: subscription?.status || 'inactive',
          currentPeriodEnd: subscription?.current_period_end,
          cancelAtPeriodEnd: subscription?.cancel_at_period_end || false,
          effectiveUntil: cancellationDate,
        },
      };
      
      console.log('[DEBUG] Subscription API - Response:', JSON.stringify(response));
      return NextResponse.json(response);
    } catch (directError) {
      console.error('[DEBUG] Subscription API - Error with direct database access:', directError);
      // Fall back to the getUserQuota function
      console.log('[DEBUG] Subscription API - Falling back to getUserQuota after error');
      const quota = await getUserQuota(userId);
      return NextResponse.json(quota);
    }
  } catch (error: any) {
    console.error('[DEBUG] Subscription API - Error getting subscription info:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 