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

    // Verificar si el email está en período de enfriamiento
    const now = new Date().toISOString();
    const { data, error } = await adminClient
      .from('deleted_accounts')
      .select('cooling_period_end')
      .eq('email', email)
      .gt('cooling_period_end', now)
      .maybeSingle();

    if (error) {
      console.error('Error verificando deleted_accounts:', error);
      return NextResponse.json({ error: 'Error checking account status' }, { status: 500 });
    }

    // Si encontramos un registro, el email está en período de enfriamiento
    if (data) {
      const coolingEndDate = new Date(data.cooling_period_end);
      const daysRemaining = Math.ceil((coolingEndDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      
      return NextResponse.json({ 
        allowed: false,
        reason: 'cooling_period',
        message: `This email was recently associated with a deleted account and cannot be used for registration for ${daysRemaining} more days.`,
        coolingPeriodEnd: data.cooling_period_end
      });
    }

    // Si no hay restricciones, permitir el registro
    return NextResponse.json({ allowed: true });
  } catch (error: any) {
    console.error('Error en register/check:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 