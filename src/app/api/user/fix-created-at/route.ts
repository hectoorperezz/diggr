import { createServerClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';

// Initialize admin client for more reliable updates
const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// API route to fix the current user's created_at date
export async function GET() {
  console.log('[API] Fix-created-at endpoint called');
  
  try {
    // Get the current authenticated user
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session || !session.user) {
      console.log('[API] Fix-created-at: Not authenticated');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    const userId = session.user.id;
    const userEmail = session.user.email;
    
    console.log(`[API] Fix-created-at: Fixing date for user ${userEmail} (${userId})`);
    
    // First, get the complete auth user data using admin client instead of JWT
    try {
      // Get user directly from auth.users table using admin client
      const { data: authUser, error: adminAuthError } = await adminClient.auth.admin.getUserById(userId);
      
      if (adminAuthError) {
        console.error('[API] Fix-created-at: Error getting auth user with admin client', adminAuthError);
        return NextResponse.json({ error: `Admin error: ${adminAuthError.message}` }, { status: 500 });
      }

      if (!authUser || !authUser.user) {
        console.error('[API] Fix-created-at: No auth user found with admin client', userId);
        return NextResponse.json({ error: 'User not found' }, { status: 404 });
      }
      
      // Get authUser created_at as our source of truth
      const authCreatedAt = authUser.user.created_at;
      
      if (!authCreatedAt) {
        console.error('[API] Fix-created-at: No auth created_at date available for user', userId);
        
        // Fallback to user's last_sign_in_at if available
        const fallbackDate = authUser.user.last_sign_in_at || new Date().toISOString();
        console.log('[API] Fix-created-at: Using fallback date:', fallbackDate);
        
        // Continue with the fallback date
        const formattedDate = new Date(fallbackDate).toISOString();
        
        return await updateOrCreateUser(userId, userEmail, formattedDate);
      }
      
      // Format the date as ISO string
      const formattedDate = new Date(authCreatedAt).toISOString();
      console.log(`[API] Fix-created-at: Using auth created_at date: ${authCreatedAt} (formatted: ${formattedDate})`);
      
      return await updateOrCreateUser(userId, userEmail, formattedDate);
      
    } catch (authError) {
      console.error('[API] Fix-created-at: Exception getting auth user', authError);
      
      // Use a fallback approach - get the session user's metadata as fallback
      console.log('[API] Fix-created-at: Using fallback from session data');
      
      // Try to use the user's session created_at or another date field as fallback
      const fallbackDate = session.user.created_at || new Date().toISOString();
      const formattedDate = new Date(fallbackDate).toISOString();
      
      return await updateOrCreateUser(userId, userEmail, formattedDate);
    }
  } catch (error) {
    console.error('[API] Fix-created-at: Error fixing user date:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

// Helper function to update or create user with the given date
async function updateOrCreateUser(userId, userEmail, formattedDate) {
  try {
    // Check if user record exists first - using admin client for more reliable access
    const { data: existingUser, error: fetchError } = await adminClient
      .from('users')
      .select('id, created_at')
      .eq('id', userId)
      .single();
      
    if (fetchError) {
      console.log(`[API] Fix-created-at: User record not found, creating one for ${userId}`);
      
      // Create user record if it doesn't exist
      const { data: newUser, error: createError } = await adminClient
        .from('users')
        .insert([
          { 
            id: userId,
            email: userEmail,
            created_at: formattedDate,
            updated_at: new Date().toISOString(),
            spotify_connected: false 
          }
        ])
        .select()
        .single();
      
      if (createError) {
        console.error('[API] Fix-created-at: Error creating user record:', createError);
        return NextResponse.json({ 
          error: `Error creating user: ${createError.message}`,
          details: createError 
        }, { status: 500 });
      }
      
      console.log(`[API] Fix-created-at: Created new user record with created_at: ${newUser.created_at}`);
      
      return NextResponse.json({
        success: true,
        message: 'Created user with correct created_at date',
        user: {
          id: userId,
          email: userEmail
        },
        oldDate: null,
        newDate: newUser.created_at,
        action: 'created',
        formatted: new Date(newUser.created_at).toLocaleDateString('en-US', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        })
      });
    }
    
    console.log(`[API] Fix-created-at: User record found, current created_at: ${existingUser.created_at}`);
    const oldDate = existingUser.created_at;
    
    // Update the user's record using admin client for more reliability
    const { data: updatedUser, error: updateError } = await adminClient
      .from('users')
      .update({ 
        created_at: formattedDate,
        updated_at: new Date().toISOString() 
      })
      .eq('id', userId)
      .select()
      .single();
    
    if (updateError) {
      console.error('[API] Fix-created-at: Error updating user:', updateError);
      return NextResponse.json({ 
        error: `Error updating user: ${updateError.message}`,
        details: updateError
      }, { status: 500 });
    }
    
    console.log(`[API] Fix-created-at: Successfully updated created_at from ${oldDate} to ${updatedUser.created_at}`);
    
    return NextResponse.json({
      success: true,
      message: 'Updated user created_at date',
      user: {
        id: userId,
        email: userEmail
      },
      oldDate: oldDate,
      newDate: updatedUser.created_at,
      action: 'updated',
      formatted: new Date(updatedUser.created_at).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })
    });
  } catch (error) {
    console.error('[API] Fix-created-at: Error in updateOrCreateUser:', error);
    return NextResponse.json({ 
      error: 'Error processing user data', 
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
} 