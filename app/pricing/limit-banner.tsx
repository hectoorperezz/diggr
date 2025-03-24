"use client"

import { useSearchParams } from "next/navigation"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import { useEffect, useState } from "react"

export function LimitBanner() {
  const searchParams = useSearchParams()
  const limitReached = searchParams.get("limit") === "reached"
  const [visible, setVisible] = useState(limitReached)

  useEffect(() => {
    if (limitReached) {
      setVisible(true)
    }
  }, [limitReached])

  if (!visible) return null

  return (
    <Alert className="bg-yellow-900 border-yellow-600 mb-8">
      <AlertTriangle className="h-4 w-4 text-yellow-500" />
      <AlertTitle className="text-yellow-500">Límite de plan gratuito alcanzado</AlertTitle>
      <AlertDescription className="text-yellow-300">
        Has alcanzado el límite de 5 playlists este mes. Actualiza a Premium para crear playlists ilimitadas.
      </AlertDescription>
    </Alert>
  )
}

