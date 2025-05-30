import { supabaseAdmin } from '@/lib/supabase/admin';
import { NextResponse } from 'next/server';

// API route to fix user created_at dates
export async function GET() {
  try {
    const supabase = supabaseAdmin;
    
    // Get all users from the database
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, created_at');
    
    if (usersError) {
      throw new Error(`Error fetching users: ${usersError.message}`);
    }
    
    console.log(`Found ${users?.length || 0} users to check`);
    
    const updates: {id: string; oldDate: string | null; newDate: string}[] = [];
    
    // For each user, check their auth.users created_at
    for (const user of users || []) {
      const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(user.id);
      
      if (authError) {
        console.error(`Error fetching auth user ${user.id}: ${authError.message}`);
        continue;
      }
      
      if (authUser?.user?.created_at) {
        const authCreatedAt = new Date(authUser.user.created_at).toISOString();
        
        // If auth created_at is different from users created_at, update it
        if (!user.created_at || new Date(user.created_at).toISOString() !== authCreatedAt) {
          const { error: updateError } = await supabase
            .from('users')
            .update({ created_at: authCreatedAt })
            .eq('id', user.id);
          
          if (updateError) {
            console.error(`Error updating user ${user.id}: ${updateError.message}`);
          } else {
            updates.push({
              id: user.id,
              oldDate: user.created_at,
              newDate: authCreatedAt
            });
          }
        }
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Updated ${updates.length} users with correct created_at dates`,
      updates
    });
  } catch (error) {
    console.error('Error fixing user dates:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 