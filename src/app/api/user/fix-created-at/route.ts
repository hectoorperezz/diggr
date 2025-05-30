import { createServerClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// API route to fix the current user's created_at date
export async function GET() {
  try {
    const supabase = await createServerClient();
    
    // Get current user
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    const userId = session.user.id;
    const authCreatedAt = session.user.created_at;
    
    if (!authCreatedAt) {
      return NextResponse.json({ error: 'No auth created_at date available' }, { status: 400 });
    }
    
    // Format the date as ISO string
    const formattedDate = new Date(authCreatedAt).toISOString();
    
    // Update the user's record
    const { error } = await supabase
      .from('users')
      .update({ created_at: formattedDate })
      .eq('id', userId);
    
    if (error) {
      throw new Error(`Error updating user: ${error.message}`);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Updated user created_at date',
      user: userId,
      oldDate: null, // We don't know the old date without an extra query
      newDate: formattedDate
    });
  } catch (error) {
    console.error('Error fixing user date:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
} 