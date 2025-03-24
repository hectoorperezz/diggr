import { NextResponse } from "next/server"
import Stripe from "stripe"
import { createClient } from "@supabase/supabase-js"

// Inicializar Stripe con la clave secreta
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2023-10-16",
})

// Webhook secret para verificar la firma
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET as string

// Crear un cliente de Supabase con la clave de servicio para evitar problemas de RLS
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL as string,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
  {
    auth: {
      persistSession: false,
    },
  },
)

export async function POST(request: Request) {
  const payload = await request.text()
  const signature = request.headers.get("stripe-signature") as string

  console.log("Webhook received. Processing event...")

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret)
    console.log(`Webhook event type: ${event.type}`)
  } catch (err) {
    console.error(`Webhook signature verification failed: ${err}`)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  // Manejar diferentes tipos de eventos
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session
        console.log("Checkout session completed:", session.id)

        // Extraer metadata
        const userId = session.metadata?.userId
        const tier = session.metadata?.tier

        console.log("User ID from metadata:", userId)
        console.log("Tier from metadata:", tier)

        if (!userId || !tier) {
          console.error("Missing userId or tier in session metadata")
          return NextResponse.json({ error: "Missing metadata" }, { status: 400 })
        }

        // Calcular fechas de suscripción
        const now = new Date()
        const endDate = new Date()
        endDate.setMonth(endDate.getMonth() + 1) // Suscripción de 1 mes

        console.log("Updating profile in Supabase...")

        // Actualizar perfil del usuario - Usando SQL directo para evitar problemas de RLS
        const { data, error } = await supabaseAdmin.rpc("update_subscription", {
          p_user_id: userId,
          p_tier: tier,
          p_start_date: now.toISOString(),
          p_end_date: endDate.toISOString(),
          p_customer_id: session.customer as string,
          p_subscription_id: session.subscription as string,
        })

        if (error) {
          console.error("Error updating user profile:", error)
          return NextResponse.json({ error: "Database update failed: " + error.message }, { status: 500 })
        }

        console.log("Profile updated successfully:", data)

        // Registrar la transacción - También usando SQL directo
        const { error: transactionError } = await supabaseAdmin.rpc("insert_subscription_transaction", {
          p_user_id: userId,
          p_amount: tier === "premium" ? 9.99 : 0,
          p_status: "completed",
          p_payment_method: "stripe",
          p_tier: tier,
          p_session_id: session.id,
        })

        if (transactionError) {
          console.error("Error recording transaction:", transactionError)
        } else {
          console.log("Transaction recorded successfully")
        }

        break
      }

      case "customer.subscription.updated": {
        // Código similar usando RPC
        const subscription = event.data.object as Stripe.Subscription
        console.log("Subscription updated:", subscription.id)

        // Buscar usuario por customer_id usando SQL directo
        const { data: profiles, error: profileError } = await supabaseAdmin
          .from("profiles")
          .select("id")
          .eq("stripe_customer_id", subscription.customer as string)

        if (profileError) {
          console.error("Error finding user profile:", profileError)
          return NextResponse.json({ error: "Database query failed" }, { status: 500 })
        }

        if (!profiles || profiles.length === 0) {
          console.error("No user found with customer ID:", subscription.customer)
          return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        console.log("Found user:", profiles[0].id)
        const userId = profiles[0].id

        // Actualizar estado de suscripción
        const status = subscription.status
        const tier = status === "active" ? "premium" : "free"

        // Calcular fecha de fin
        const endDate = new Date(subscription.current_period_end * 1000)

        console.log("Updating subscription status to:", tier)
        console.log("Subscription end date:", endDate)

        // Actualizar usando RPC
        const { error: updateError } = await supabaseAdmin.rpc("update_subscription_status", {
          p_user_id: userId,
          p_tier: tier,
          p_end_date: endDate.toISOString(),
        })

        if (updateError) {
          console.error("Error updating subscription status:", updateError)
          return NextResponse.json({ error: "Database update failed" }, { status: 500 })
        }

        console.log("Subscription status updated successfully")
        break
      }

      case "customer.subscription.deleted": {
        // Código similar usando RPC
        const subscription = event.data.object as Stripe.Subscription
        console.log("Subscription deleted:", subscription.id)

        // Buscar usuario por customer_id
        const { data: profiles, error: profileError } = await supabaseAdmin
          .from("profiles")
          .select("id")
          .eq("stripe_customer_id", subscription.customer as string)

        if (profileError) {
          console.error("Error finding user profile:", profileError)
          return NextResponse.json({ error: "Database query failed" }, { status: 500 })
        }

        if (!profiles || profiles.length === 0) {
          console.error("No user found with customer ID:", subscription.customer)
          return NextResponse.json({ error: "User not found" }, { status: 404 })
        }

        const userId = profiles[0].id
        console.log("Found user:", userId)

        // Actualizar a plan gratuito usando RPC
        const { error: updateError } = await supabaseAdmin.rpc("cancel_subscription", {
          p_user_id: userId,
        })

        if (updateError) {
          console.error("Error canceling subscription:", updateError)
          return NextResponse.json({ error: "Database update failed" }, { status: 500 })
        }

        console.log("Subscription canceled successfully")
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error(`Error processing webhook: ${error}`)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}

