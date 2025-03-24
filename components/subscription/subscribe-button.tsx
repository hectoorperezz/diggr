"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { supabase } from "@/lib/supabase"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { loadStripe } from "@stripe/stripe-js"

// Cargar Stripe con la clave pública
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string)

export function SubscribeButton({ tier, userId, currentTier }: { tier: string; userId: string; currentTier: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubscribe = async () => {
    setLoading(true)

    try {
      // Crear una sesión de checkout
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tier,
          returnUrl: window.location.origin + "/pricing",
        }),
      })

      const { url } = await response.json()

      // Redirigir al usuario a la página de checkout de Stripe
      if (url) {
        window.location.href = url
      } else {
        throw new Error("No checkout URL returned")
      }
    } catch (error) {
      console.error("Error al iniciar el proceso de suscripción:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleDowngrade = async () => {
    setLoading(true)

    try {
      // Obtener el ID de suscripción de Stripe
      const { data: profile } = await supabase
        .from("profiles")
        .select("stripe_subscription_id")
        .eq("id", userId)
        .single()

      if (!profile?.stripe_subscription_id) {
        throw new Error("No subscription found")
      }

      // Cancelar la suscripción a través de una API route
      const response = await fetch("/api/cancel-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subscriptionId: profile.stripe_subscription_id,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to cancel subscription")
      }

      // Actualizar el perfil del usuario
      await supabase
        .from("profiles")
        .update({
          subscription_tier: "free",
          subscription_end_date: new Date().toISOString(), // Termina inmediatamente
        })
        .eq("id", userId)

      setOpen(false)
      router.refresh()
    } catch (error) {
      console.error("Error al cambiar la suscripción:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className={
          tier === "premium" ? "w-full bg-green-600 hover:bg-green-700" : "w-full bg-gray-600 hover:bg-gray-700"
        }
      >
        {tier === "premium" ? "Upgrade to Premium" : "Downgrade to Free"}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-gray-800 text-white border-gray-700">
          <DialogHeader>
            <DialogTitle>{tier === "premium" ? "Upgrade to Premium" : "Downgrade to Free"}</DialogTitle>
            <DialogDescription className="text-gray-400">
              {tier === "premium"
                ? "Enjoy unlimited playlists and premium features for $9.99/month"
                : "You will be limited to 5 playlists per month on the free plan"}
            </DialogDescription>
          </DialogHeader>

          {tier === "premium" ? (
            <div className="py-4">
              <p className="text-gray-300 mb-4">You'll be redirected to Stripe to complete your payment securely.</p>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>• Unlimited playlists</li>
                <li>• Priority AI processing</li>
                <li>• Advanced customization options</li>
                <li>• Cancel anytime</li>
              </ul>
            </div>
          ) : (
            <div className="py-4">
              <p className="text-yellow-400">
                Warning: Downgrading will limit you to 5 playlists per month. Any playlists you've already created will
                remain accessible.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={tier === "premium" ? handleSubscribe : handleDowngrade}
              disabled={loading}
              className={tier === "premium" ? "bg-green-600 hover:bg-green-700" : "bg-gray-600 hover:bg-gray-700"}
            >
              {loading ? (
                <span className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    ></path>
                  </svg>
                  Processing...
                </span>
              ) : tier === "premium" ? (
                "Continue to Checkout"
              ) : (
                "Confirm Downgrade"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

