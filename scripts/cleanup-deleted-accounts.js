/**
 * Script para eliminar definitivamente las cuentas que han superado el período de enfriamiento
 * 
 * Ejecutar con: node scripts/cleanup-deleted-accounts.js
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Crear cliente de Supabase con service_role
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function cleanupDeletedAccounts() {
  const now = new Date().toISOString();
  console.log(`[${now}] Iniciando limpieza de cuentas eliminadas...`);

  try {
    // 1. Obtener cuentas marcadas para eliminación cuyo período de enfriamiento ha expirado
    const { data: expiredAccounts, error: selectError } = await supabase
      .from('users')
      .select('id, email')
      .not('deleted_at', 'is', null)
      .lt('deleted_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

    if (selectError) {
      throw new Error(`Error al obtener cuentas expiradas: ${selectError.message}`);
    }

    console.log(`Encontradas ${expiredAccounts.length} cuentas para eliminar definitivamente`);

    // 2. Eliminar cada cuenta
    for (const account of expiredAccounts) {
      console.log(`Procesando cuenta: ${account.email} (${account.id})`);

      // 2.1 Eliminar el usuario de auth.users (usando admin API)
      const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(account.id);

      if (deleteAuthError) {
        console.error(`Error al eliminar usuario de auth: ${deleteAuthError.message}`);
        continue;
      }

      // 2.2 Eliminar registros relacionados del usuario
      const { error: deleteDataError } = await supabase
        .from('users')
        .delete()
        .eq('id', account.id);

      if (deleteDataError) {
        console.error(`Error al eliminar datos del usuario: ${deleteDataError.message}`);
        continue;
      }

      console.log(`Cuenta ${account.email} eliminada con éxito`);
    }

    console.log(`Limpieza completada: ${expiredAccounts.length} cuentas eliminadas`);
  } catch (error) {
    console.error('Error en la limpieza de cuentas:', error);
    process.exit(1);
  }
}

// Ejecutar la función de limpieza
cleanupDeletedAccounts()
  .then(() => {
    console.log('Proceso de limpieza finalizado correctamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error en el proceso de limpieza:', error);
    process.exit(1);
  }); 