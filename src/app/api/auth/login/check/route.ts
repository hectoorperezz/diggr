import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Crear cliente admin para operaciones con service_role
const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(request: NextRequest) {
  try {
    // Extraer el email del body de la petición
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    // 1. Verificar si el usuario existe y está marcado como eliminado
    const { data: userData, error: userError } = await adminClient
      .from('users')
      .select('deleted_at')
      .eq('email', email)
      .not('deleted_at', 'is', null)
      .maybeSingle();
    
    if (userError) {
      console.error('Error verificando users para login:', userError);
      return NextResponse.json({ error: 'Error checking user status' }, { status: 500 });
    }
    
    // 2. Verificar si el email está en período de enfriamiento
    const now = new Date().toISOString();
    const { data: coolingPeriodData, error: coolingPeriodError } = await adminClient
      .from('deleted_accounts')
      .select('cooling_period_end')
      .eq('email', email)
      .gt('cooling_period_end', now)
      .maybeSingle();

    if (coolingPeriodError) {
      console.error('Error verificando deleted_accounts:', coolingPeriodError);
      return NextResponse.json({ error: 'Error checking account status' }, { status: 500 });
    }

    // Si el usuario está marcado como eliminado o está en período de enfriamiento
    if (userData || coolingPeriodData) {
      const coolingEndDate = coolingPeriodData ? new Date(coolingPeriodData.cooling_period_end) : null;
      const daysRemaining = coolingEndDate ? 
        Math.ceil((coolingEndDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : 30;
      
      return NextResponse.json({ 
        allowed: false,
        reason: 'account_deleted',
        message: `This account has been deleted. You won't be able to use this email for ${daysRemaining} days.`,
        coolingPeriodEnd: coolingPeriodData?.cooling_period_end
      });
    }

    // Si no hay restricciones, permitir el inicio de sesión
    return NextResponse.json({ allowed: true });
  } catch (error: any) {
    console.error('Error en login/check:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 