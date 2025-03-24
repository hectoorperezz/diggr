import { NextResponse } from "next/server"
import Stripe from "stripe"
import { createClient } from "@supabase/supabase-js"
import { getUser } from "@/lib/supabase"

// Inicializar Stripe con la clave secreta
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2023-10-16",
})

// Crear un cliente de Supabase con la clave de servicio
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
  try {
    const user = await getUser()

    if (!user) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 })
    }

    const { sessionId } = await request.json()

    if (!sessionId) {
      return NextResponse.json({ error: "Session ID is required" }, { status: 400 })
    }

    // Obtener la sesión de checkout de Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 })
    }

    // Verificar que la sesión pertenece al usuario actual
    if (session.customer_email !== user.email) {
      return NextResponse.json({ error: "Session does not belong to current user" }, { status: 403 })
    }

    // Extraer metadata
    const userId = session.metadata?.userId
    const tier = session.metadata?.tier

    if (!userId || !tier) {
      return NextResponse.json({ error: "Missing metadata in session" }, { status: 400 })
    }

    // Calcular fechas de suscripción
    const now = new Date()
    const endDate = new Date()
    endDate.setMonth(endDate.getMonth() + 1) // Suscripción de 1 mes

    // Actualizar perfil del usuario usando SQL directo
    const { data, error } = await supabaseAdmin.rpc("update_subscription", {
      p_user_id: userId,
      p_tier: tier,
      p_start_date: now.toISOString(),
      p_end_date: endDate.toISOString(),
      p_customer_id: session.customer as string,
      p_subscription_id: session.subscription as string,
    })

    if (error) {
      return NextResponse.json({ error: "Failed to update subscription: " + error.message }, { status: 500 })
    }

    // Registrar la transacción
    const { error: transactionError } = await supabaseAdmin.rpc("insert_subscription_transaction", {
      p_user_id: userId,
      p_amount: tier === "premium" ? 9.99 : 0,
      p_status: "completed",
      p_payment_method: "stripe",
      p_tier: tier,
      p_session_id: session.id,
    })

    if (transactionError) {
      return NextResponse.json({ error: "Failed to record transaction: " + transactionError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Subscription updated successfully",
      tier: tier,
      userId: userId,
      sessionId: session.id,
    })
  } catch (error) {
    console.error("Error in debug subscription:", error)
    return NextResponse.json(
      { error: "Error processing request: " + (error instanceof Error ? error.message : String(error)) },
      { status: 500 },
    )
  }
}

