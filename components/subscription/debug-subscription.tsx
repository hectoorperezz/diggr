"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type SubscriptionData = {
  subscription: {
    subscription_tier: string
    subscription_start_date: string | null
    subscription_end_date: string | null
    stripe_customer_id: string | null
    stripe_subscription_id: string | null
  }
  transactions: Array<{
    id: number
    user_id: string
    amount: number
    status: string
    payment_method: string
    transaction_date: string
    subscription_tier: string
    stripe_session_id: string | null
  }>
}

export function DebugSubscription() {
  const [data, setData] = useState<SubscriptionData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sessionId, setSessionId] = useState("")
  const [updateResult, setUpdateResult] = useState<any>(null)
  const [updateLoading, setUpdateLoading] = useState(false)
  const [updateError, setUpdateError] = useState<string | null>(null)

  const fetchSubscriptionStatus = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/subscription-status")

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`)
      }

      const data = await response.json()
      setData(data)

      // Si hay transacciones, pre-llenar el ID de sesión con la más reciente
      if (data.transactions && data.transactions.length > 0) {
        setSessionId(data.transactions[0].stripe_session_id || "")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  const forceUpdateSubscription = async () => {
    if (!sessionId) {
      setUpdateError("Session ID is required")
      return
    }

    setUpdateLoading(true)
    setUpdateError(null)
    setUpdateResult(null)

    try {
      const response = await fetch("/api/debug-subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ sessionId }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || `Error: ${response.status}`)
      }

      setUpdateResult(result)

      // Refrescar los datos de suscripción
      fetchSubscriptionStatus()
    } catch (err) {
      setUpdateError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setUpdateLoading(false)
    }
  }

  useEffect(() => {
    fetchSubscriptionStatus()
  }, [])

  return (
    <Card className="w-full max-w-2xl mx-auto bg-gray-800 border-gray-700 text-white">
      <CardHeader>
        <CardTitle>Subscription Debug Info</CardTitle>
        <CardDescription className="text-gray-400">This information is for debugging purposes only</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
          </div>
        ) : error ? (
          <div className="text-red-500">Error: {error}</div>
        ) : data ? (
          <>
            <div className="bg-gray-700 p-4 rounded-lg">
              <h3 className="text-lg font-medium mb-2">Subscription Details</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-gray-400">Tier:</div>
                <div className={data.subscription.subscription_tier === "premium" ? "text-green-500" : "text-gray-300"}>
                  {data.subscription.subscription_tier}
                </div>

                <div className="text-gray-400">Start Date:</div>
                <div>
                  {data.subscription.subscription_start_date
                    ? new Date(data.subscription.subscription_start_date).toLocaleString()
                    : "N/A"}
                </div>

                <div className="text-gray-400">End Date:</div>
                <div>
                  {data.subscription.subscription_end_date
                    ? new Date(data.subscription.subscription_end_date).toLocaleString()
                    : "N/A"}
                </div>

                <div className="text-gray-400">Stripe Customer ID:</div>
                <div className="truncate">{data.subscription.stripe_customer_id || "N/A"}</div>

                <div className="text-gray-400">Stripe Subscription ID:</div>
                <div className="truncate">{data.subscription.stripe_subscription_id || "N/A"}</div>
              </div>
            </div>

            {data.transactions.length > 0 && (
              <div className="bg-gray-700 p-4 rounded-lg">
                <h3 className="text-lg font-medium mb-2">Recent Transactions</h3>
                <div className="space-y-2">
                  {data.transactions.map((transaction) => (
                    <div key={transaction.id} className="border-b border-gray-600 pb-2">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Date:</span>
                        <span>{new Date(transaction.transaction_date).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Amount:</span>
                        <span>${transaction.amount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Status:</span>
                        <span className={transaction.status === "completed" ? "text-green-500" : "text-yellow-500"}>
                          {transaction.status}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Tier:</span>
                        <span>{transaction.subscription_tier}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Session ID:</span>
                        <span className="truncate max-w-[200px]">{transaction.stripe_session_id || "N/A"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sección para forzar actualización */}
            <div className="bg-gray-700 p-4 rounded-lg">
              <h3 className="text-lg font-medium mb-4">Force Update Subscription</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="sessionId">Stripe Session ID</Label>
                  <Input
                    id="sessionId"
                    value={sessionId}
                    onChange={(e) => setSessionId(e.target.value)}
                    placeholder="cs_test_..."
                    className="bg-gray-600 border-gray-500"
                  />
                  <p className="text-xs text-gray-400">
                    Enter the Stripe Checkout Session ID to force update the subscription
                  </p>
                </div>

                <Button
                  onClick={forceUpdateSubscription}
                  disabled={updateLoading || !sessionId}
                  className="w-full bg-yellow-600 hover:bg-yellow-700"
                >
                  {updateLoading ? "Processing..." : "Force Update Subscription"}
                </Button>

                {updateError && <div className="text-red-500 text-sm">{updateError}</div>}

                {updateResult && (
                  <div className="bg-green-900/30 border border-green-600 p-3 rounded-md">
                    <h4 className="text-green-400 font-medium mb-2">Update Successful</h4>
                    <pre className="text-xs text-gray-300 overflow-auto max-h-32">
                      {JSON.stringify(updateResult, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="text-gray-400">No subscription data available</div>
        )}
      </CardContent>
      <CardFooter>
        <Button onClick={fetchSubscriptionStatus} disabled={loading} className="w-full bg-green-600 hover:bg-green-700">
          {loading ? "Loading..." : "Refresh Data"}
        </Button>
      </CardFooter>
    </Card>
  )
}

