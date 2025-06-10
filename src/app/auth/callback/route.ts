import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: Request) {
  // Obtener la URL actual para extraer los parámetros
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  
  // Si no hay código, algo salió mal
  if (!code) {
    return NextResponse.redirect(
      `${requestUrl.origin}/auth/login?error=${encodeURIComponent('No se recibió el código de autorización')}`
    );
  }
  
  try {
    // Crear un cliente Supabase con cookies del servidor
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Intercambia el código por una sesión, el SDK maneja esto automáticamente
    await supabase.auth.exchangeCodeForSession(code);
    
    // Redirigir al dashboard después del éxito
    return NextResponse.redirect(`${requestUrl.origin}/dashboard`);
  } catch (error: any) {
    console.error('Error en el callback de OAuth:', error);
    
    // Si hay un error, redirigir a la página de login con un mensaje
    return NextResponse.redirect(
      `${requestUrl.origin}/auth/login?error=${encodeURIComponent('Error durante la autenticación: ' + (error.message || 'Error desconocido'))}`
    );
  }
} 