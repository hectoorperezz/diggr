import express, { type Request, type Response, type RequestHandler } from 'express';
import http from 'http';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Initialize Stripe
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
}
const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2023-10-16', // Use a fixed API version
});

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Supabase URL or Service Role Key is not set in environment variables');
}
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  }
});

// Stripe Price IDs - configure via environment variables
const STRIPE_PRO_PRICE_ID = process.env.STRIPE_PRO_PRICE_ID;
console.log('STRIPE_PRO_PRICE_ID configurado:', STRIPE_PRO_PRICE_ID);

// Helper: determine plan_type from Stripe price id
function mapPriceIdToPlan(priceId: string | undefined): 'free' | 'premium' {
  if (!priceId) return 'free';
  if (priceId === STRIPE_PRO_PRICE_ID) return 'premium';
  return 'free';
}

export async function registerRoutes(app: express.Application): Promise<http.Server> {
  // --- Stripe webhook handler defined as RequestHandler to satisfy TS typings ---
  const stripeWebhookHandler = async (req: Request, res: Response): Promise<void> => {
    console.log('=== 🔔 WEBHOOK RECIBIDO ===');
    
    const sig = req.headers['stripe-signature'] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('⚠️ STRIPE_WEBHOOK_SECRET no está configurado.');
      res.status(500).send('Webhook secret not configured.');
      return;
    }

    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(req.body as Buffer, sig, webhookSecret);
      console.log(`✅ Evento Stripe validado: ${event.type}, ID: ${event.id}`);
    } catch (err: any) {
      console.error(`❌ Error de verificación de firma: ${err.message}`);
      res.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const subscriptionId = subscription.id;
        const status = subscription.status;
        const currentPeriodStart = new Date(subscription.current_period_start * 1000).toISOString();
        const currentPeriodEnd = new Date(subscription.current_period_end * 1000).toISOString();
        const priceId = subscription.items.data[0]?.price?.id;
        const planType = mapPriceIdToPlan(priceId);

        console.log(`📋 DATOS EXTRAÍDOS:
          - Evento: ${event.type}
          - Customer ID: ${customerId}
          - Subscription ID: ${subscriptionId}
          - Status: ${status}
          - Price ID: ${priceId}
          - Plan Type Mapeado: ${planType}
          - Período: ${currentPeriodStart} a ${currentPeriodEnd}`);

        const payload = {
          plan_type: planType,
          status,
          current_period_start: currentPeriodStart,
          current_period_end: currentPeriodEnd,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId, // Asegura que el ID de suscripción esté guardado
        };

        console.log(`📤 PAYLOAD A ENVIAR A SUPABASE:`, JSON.stringify(payload));

        // Try update by subscription ID first
        console.log(`🔄 Intentando actualizar por subscription_id = ${subscriptionId}...`);
        let { data, error } = await supabase
          .from('subscriptions')
          .update(payload)
          .eq('stripe_subscription_id', subscriptionId)
          .select();

        console.log(`Resultado por subscription_id:`, { data, error });

        // Si no hay error pero no actualizó nada (data vacío o data.length === 0)
        if (!error && (!data || data.length === 0)) {
          console.log(`⚠️ No se encontró registro con stripe_subscription_id = ${subscriptionId}`);
          console.log(`🔄 Intentando actualizar por customer_id = ${customerId}...`);
          
          // Fallback update by customer id if sub id not found
          ({ data, error } = await supabase
            .from('subscriptions')
            .update(payload)
            .eq('stripe_customer_id', customerId)
            .select());
            
          console.log(`Resultado por customer_id:`, { data, error });
        }

        if (error) {
          console.error('❌ ERROR EN SUPABASE:', error);
          
          // Verificar si existe el registro
          console.log('🔍 Verificando si existe la suscripción en la base de datos...');
          const { data: checkData } = await supabase
            .from('subscriptions')
            .select('id, user_id, stripe_customer_id, stripe_subscription_id, plan_type')
            .or(`stripe_customer_id.eq.${customerId},stripe_subscription_id.eq.${subscriptionId}`);
            
          console.log('Registros encontrados:', checkData);
        } else if (!data || data.length === 0) {
          console.log('⚠️ La actualización no afectó a ningún registro.');
          
          // Verificar si existe el registro
          console.log('🔍 Verificando si existe la suscripción en la base de datos...');
          const { data: checkData } = await supabase
            .from('subscriptions')
            .select('id, user_id, stripe_customer_id, stripe_subscription_id, plan_type')
            .or(`stripe_customer_id.eq.${customerId},stripe_subscription_id.eq.${subscriptionId}`);
            
          console.log('Registros encontrados:', checkData);
        } else {
          console.log('✅ ACTUALIZACIÓN EXITOSA:', JSON.stringify(data));
        }
        break;
      }
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = invoice.subscription as string;
        const customerId = invoice.customer as string;
        const priceId = invoice.lines.data[0]?.price?.id;
        const planType = mapPriceIdToPlan(priceId);
        
        console.log(`📋 INVOICE PAYMENT SUCCEEDED:
          - Customer ID: ${customerId}
          - Subscription ID: ${subscriptionId}
          - Price ID: ${priceId}
          - Plan Type Mapeado: ${planType}`);
          
        const payload = {
          plan_type: planType,
          status: 'active',
          current_period_start: new Date(invoice.period_start * 1000).toISOString(),
          current_period_end: new Date(invoice.period_end * 1000).toISOString(),
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId, // Asegura que el ID de suscripción esté guardado
        };
        
        console.log(`📤 PAYLOAD INVOICE:`, JSON.stringify(payload));
        
        console.log(`🔄 Intentando actualizar por subscription_id = ${subscriptionId}...`);
        const { data, error } = await supabase
          .from('subscriptions')
          .update(payload)
          .eq('stripe_subscription_id', subscriptionId)
          .select();
          
        console.log(`Resultado actualización invoice:`, { data, error });
        
        if (error) {
          console.error('❌ ERROR EN SUPABASE (INVOICE):', error);
          
          // Intentar actualización por customer_id como fallback
          console.log(`🔄 Intentando actualizar por customer_id = ${customerId} (fallback)...`);
          const { data: fallbackData, error: fallbackError } = await supabase
            .from('subscriptions')
            .update(payload)
            .eq('stripe_customer_id', customerId)
            .select();
            
          console.log(`Resultado actualización invoice por customer_id:`, { data: fallbackData, error: fallbackError });
          
          if (!fallbackError && fallbackData && fallbackData.length > 0) {
            console.log('✅ ACTUALIZACIÓN POR CUSTOMER_ID EXITOSA:', JSON.stringify(fallbackData));
          }
        } else if (data && data.length > 0) {
          console.log('✅ ACTUALIZACIÓN INVOICE EXITOSA:', JSON.stringify(data));
        }
        break;
      }
      default:
        console.log(`⚠️ Tipo de evento no manejado: ${event.type}`);
    }

    res.json({ received: true });
  };

  // Register route with raw body parsing middleware
  app.post('/api/stripe/webhook', stripeWebhookHandler);

  const server = http.createServer(app);
  return server;
} 