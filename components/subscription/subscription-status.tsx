"use client"

import { useEffect, useState } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, XCircle } from "lucide-react"

export function SubscriptionStatus() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  useEffect(() => {
    const success = searchParams.get("success")
    const canceled = searchParams.get("canceled")

    if (success === "true") {
      setMessage({
        type: "success",
        text: "Your subscription has been successfully processed! You now have access to premium features.",
      })

      // Limpiar la URL después de mostrar el mensaje
      setTimeout(() => {
        router.replace("/pricing", { scroll: false })
      }, 5000)
    } else if (canceled === "true") {
      setMessage({
        type: "error",
        text: "Your subscription process was canceled. You can try again whenever you're ready.",
      })

      // Limpiar la URL después de mostrar el mensaje
      setTimeout(() => {
        router.replace("/pricing", { scroll: false })
      }, 5000)
    }
  }, [searchParams, router])

  if (!message) return null

  return (
    <Alert
      className={`mb-8 ${
        message.type === "success" ? "bg-green-900/50 border-green-600" : "bg-red-900/50 border-red-600"
      }`}
    >
      {message.type === "success" ? (
        <CheckCircle className="h-4 w-4 text-green-500" />
      ) : (
        <XCircle className="h-4 w-4 text-red-500" />
      )}
      <AlertTitle className={message.type === "success" ? "text-green-500" : "text-red-500"}>
        {message.type === "success" ? "Subscription Successful" : "Subscription Canceled"}
      </AlertTitle>
      <AlertDescription className={message.type === "success" ? "text-green-300" : "text-red-300"}>
        {message.text}
      </AlertDescription>
    </Alert>
  )
}

