import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    // Create Supabase client
    const supabase = createRouteHandlerClient({ cookies });
    
    // Check if the users table exists and its structure
    const { data: usersTable, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    // Check if the playlists table exists and its structure
    const { data: playlistsTable, error: playlistsError } = await supabase
      .from('playlists')
      .select('*')
      .limit(1);
    
    // Execute a raw query to get information about the database schema
    const { data: schemaInfo, error: schemaError } = await supabase
      .rpc('exec_sql', {
        sql_query: `
          SELECT table_name, column_name, data_type 
          FROM information_schema.columns 
          WHERE table_schema = 'public'
          ORDER BY table_name, ordinal_position;
        `
      });
    
    // Return debug information
    return NextResponse.json({
      time: new Date().toISOString(),
      tables: {
        users: {
          exists: !usersError,
          error: usersError ? { message: usersError.message, code: usersError.code } : null,
          sample: usersTable ? usersTable.map(u => ({ id: u.id, email: u.email })) : null
        },
        playlists: {
          exists: !playlistsError,
          error: playlistsError ? { message: playlistsError.message, code: playlistsError.code } : null,
          sample: playlistsTable ? playlistsTable.map(p => ({ id: p.id, name: p.name })) : null
        }
      },
      schema: {
        success: !schemaError,
        error: schemaError ? { message: schemaError.message, code: schemaError.code } : null,
        data: schemaInfo
      }
    });
  } catch (error: any) {
    console.error('Database debug API error:', error);
    return NextResponse.json({
      error: error.message || 'An unexpected error occurred',
      stack: error.stack
    }, { status: 500 });
  }
} 