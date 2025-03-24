import { NextResponse } from "next/server"
import Stripe from "stripe"
import { getUser } from "@/lib/supabase"

// Inicializar Stripe con la clave secreta
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2023-10-16",
})

export async function POST(request: Request) {
  try {
    const user = await getUser()

    if (!user) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 })
    }

    const { subscriptionId } = await request.json()

    // Cancelar la suscripción en Stripe
    await stripe.subscriptions.cancel(subscriptionId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error canceling subscription:", error)
    return NextResponse.json({ error: "Error canceling subscription" }, { status: 500 })
  }
}

