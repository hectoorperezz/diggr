# Variables de Entorno para Diggr

Este documento lista todas las variables de entorno necesarias para el correcto funcionamiento de la aplicación Diggr.

## Variables de Entorno Principales

### Auth y Database
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=
```

### Spotify API
```
NEXT_PUBLIC_SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=
NEXT_PUBLIC_SPOTIFY_REDIRECT_URI=
SPOTIFY_SCOPES=
```

### Stripe
```
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
```

## Nuevas Variables para AdSense

Para configurar correctamente los anuncios de AdSense, es necesario configurar las siguientes variables de entorno:

```
# Activar/desactivar anuncios a nivel global
NEXT_PUBLIC_ADS_ENABLED=true

# ID de cliente de AdSense (requerido)
NEXT_PUBLIC_ADSENSE_CLIENT_ID=ca-pub-XXXXXXXXXX

# ID de slot por defecto para anuncios
NEXT_PUBLIC_ADSENSE_SLOT_ID=XXXXXXXXXX

# IDs de slot específicos para cada tipo de anuncio (opcional)
NEXT_PUBLIC_ADSENSE_SIDEBAR_SLOT_ID=
NEXT_PUBLIC_ADSENSE_INLINE_SLOT_ID=
NEXT_PUBLIC_ADSENSE_CARD_SLOT_ID=
```

### Notas importantes:

1. Para activar los anuncios, asegúrate de que `NEXT_PUBLIC_ADS_ENABLED` esté establecido en `true`
2. El ID de cliente de AdSense (`NEXT_PUBLIC_ADSENSE_CLIENT_ID`) debe comenzar con `ca-pub-` seguido de tu ID único
3. Para producción, es necesario que los IDs sean válidos y tu cuenta de AdSense esté correctamente configurada

## Configuraciones adicionales

```
# Para evitar advertencias de buffer en Node 18+
NODE_OPTIONS=--no-warnings=ExperimentalWarning
```

## Cómo aplicar estas variables

### En desarrollo local
Copia estas variables a un archivo `.env.local` en la raíz del proyecto y completa los valores.

### En Vercel
En el panel de Vercel, ve a la sección "Settings" de tu proyecto, luego a "Environment Variables" y añade cada una de estas variables con sus valores correspondientes. 