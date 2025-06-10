import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

// Duración del período de enfriamiento en días
const COOLING_PERIOD_DAYS = 30;

// Crear cliente admin para operaciones con service_role
const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(request: NextRequest) {
  try {
    // Obtener la sesión del usuario
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const userEmail = session.user.email;

    console.log(`Procesando solicitud de eliminación de cuenta para el usuario: ${userId}`);

    // 1. Obtener el ID de Spotify del usuario si está conectado
    const { data: userData, error: userError } = await adminClient
      .from('users')
      .select('spotify_connected, spotify_refresh_token')
      .eq('id', userId)
      .single();

    if (userError) {
      console.error('Error obteniendo datos del usuario:', userError);
      return NextResponse.json({ error: 'Error retrieving user data' }, { status: 500 });
    }

    // 2. Calcular fecha de fin del período de enfriamiento
    const now = new Date();
    const coolingPeriodEnd = new Date();
    coolingPeriodEnd.setDate(now.getDate() + COOLING_PERIOD_DAYS);

    // 3. Registrar en la tabla deleted_accounts
    const { error: insertError } = await adminClient
      .from('deleted_accounts')
      .insert({
        email: userEmail,
        spotify_user_id: null,
        deleted_at: now.toISOString(),
        cooling_period_end: coolingPeriodEnd.toISOString()
      });

    if (insertError) {
      console.error('Error insertando en deleted_accounts:', insertError);
      return NextResponse.json({ error: 'Error registering account deletion' }, { status: 500 });
    }

    // 4. Actualizar el campo deleted_at en la tabla users
    const { error: updateError } = await adminClient
      .from('users')
      .update({ deleted_at: now.toISOString() })
      .eq('id', userId);

    if (updateError) {
      console.error('Error actualizando campo deleted_at:', updateError);
      return NextResponse.json({ error: 'Error updating user record' }, { status: 500 });
    }

    // 5. Cerrar sesión del usuario
    await supabase.auth.signOut();

    return NextResponse.json({ 
      success: true, 
      message: 'Account marked for deletion successfully',
      coolingPeriodEnd: coolingPeriodEnd.toISOString() 
    });
  } catch (error: any) {
    console.error('Error en delete-account:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 