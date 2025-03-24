import { NextResponse } from "next/server"
import { getUser, supabase } from "@/lib/supabase"

export async function GET() {
  try {
    const user = await getUser()

    if (!user) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 })
    }

    // Obtener el perfil del usuario con información de suscripción
    const { data, error } = await supabase
      .from("profiles")
      .select(
        "subscription_tier, subscription_start_date, subscription_end_date, stripe_customer_id, stripe_subscription_id",
      )
      .eq("id", user.id)
      .single()

    if (error) {
      console.error("Error fetching subscription status:", error)
      return NextResponse.json({ error: "Failed to fetch subscription status" }, { status: 500 })
    }

    // Obtener transacciones recientes
    const { data: transactions, error: transactionError } = await supabase
      .from("subscription_transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("transaction_date", { ascending: false })
      .limit(5)

    if (transactionError) {
      console.error("Error fetching transactions:", transactionError)
    }

    return NextResponse.json({
      subscription: data,
      transactions: transactions || [],
    })
  } catch (error) {
    console.error("Error in subscription status API:", error)
    return NextResponse.json({ error: "Error fetching subscription data" }, { status: 500 })
  }
}

