import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

// Crear cliente admin para operaciones con service_role
const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(request: NextRequest) {
  try {
    // Obtener la sesión del usuario autenticado
    const supabase = createRouteHandlerClient({ cookies });
    const { data: { session } } = await supabase.auth.getSession();

    // Si no hay sesión, no hay nada que verificar
    if (!session || !session.user) {
      return NextResponse.json({ status: 'no_session' });
    }

    const userId = session.user.id;
    const userEmail = session.user.email;

    // 1. Verificar si la cuenta está marcada como eliminada en la tabla users
    const { data: userData, error: userError } = await adminClient
      .from('users')
      .select('deleted_at')
      .eq('id', userId)
      .not('deleted_at', 'is', null)
      .maybeSingle();

    if (userError) {
      console.error('Error verificando estado eliminado en users:', userError);
      return NextResponse.json({ error: 'Error verificando estado de cuenta' }, { status: 500 });
    }

    // 2. Verificar si el email está en la tabla deleted_accounts
    const now = new Date().toISOString();
    const { data: deletedData, error: deletedError } = await adminClient
      .from('deleted_accounts')
      .select('cooling_period_end')
      .eq('email', userEmail)
      .gt('cooling_period_end', now)
      .maybeSingle();

    if (deletedError) {
      console.error('Error verificando deleted_accounts:', deletedError);
      return NextResponse.json({ error: 'Error verificando estado de cuenta' }, { status: 500 });
    }

    // Si la cuenta está marcada como eliminada
    if (userData || deletedData) {
      // Cerrar la sesión del usuario
      await supabase.auth.signOut();

      // Calcular días restantes si es relevante
      let daysRemaining = 30;
      let redirectUrl = '/account-deleted';
      
      if (deletedData?.cooling_period_end) {
        const coolingEndDate = new Date(deletedData.cooling_period_end);
        daysRemaining = Math.ceil((coolingEndDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
        
        // Crear URL con parámetros
        const url = new URL('/account-deleted', 'http://localhost');
        url.searchParams.set('until', encodeURIComponent(deletedData.cooling_period_end));
        url.searchParams.set('message', encodeURIComponent(
          `This account has been deleted. You won't be able to use this email for ${daysRemaining} days.`
        ));
        redirectUrl = url.pathname + url.search;
      }

      return NextResponse.json({ 
        status: 'account_deleted',
        message: `Esta cuenta ha sido eliminada. No podrás usar este email durante ${daysRemaining} días más.`,
        coolingPeriodEnd: deletedData?.cooling_period_end,
        signedOut: true,
        redirectUrl
      });
    }

    // Si la cuenta está activa, retornar OK
    return NextResponse.json({ status: 'active' });
  } catch (error: any) {
    console.error('Error en check-deleted:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 