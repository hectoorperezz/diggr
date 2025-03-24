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

    console.log("Creating checkout session for user:", user.id)
    const { tier, returnUrl } = await request.json()
    console.log("Tier:", tier, "Return URL:", returnUrl)

    // Definir los precios según el plan
    const priceId = tier === "premium" ? process.env.STRIPE_PREMIUM_PRICE_ID : null

    if (!priceId) {
      return NextResponse.json({ error: "Invalid subscription tier" }, { status: 400 })
    }

    console.log("Using price ID:", priceId)

    // Preparar los metadatos
    const metadata = {
      userId: user.id,
      tier: tier,
      userEmail: user.email || "unknown",
    }

    console.log("Session metadata:", metadata)

    // Crear una sesión de checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${returnUrl}?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${returnUrl}?canceled=true`,
      metadata: metadata,
      customer_email: user.email,
    })

    console.log("Checkout session created:", session.id)
    console.log("Session metadata confirmed:", session.metadata)

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
      metadata: session.metadata, // Devolver los metadatos para verificación
    })
  } catch (error) {
    console.error("Error creating checkout session:", error)
    return NextResponse.json({ error: "Error creating checkout session" }, { status: 500 })
  }
}

