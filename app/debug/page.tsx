import { getSession, getUser } from "@/lib/supabase"
import { redirect } from "next/navigation"
import { Logo } from "@/components/logo"
import { UserNav } from "@/components/user-nav"
import { DebugSubscription } from "@/components/subscription/debug-subscription"

export default async function DebugPage() {
  const session = await getSession()
  const user = await getUser()

  if (!session || !user) {
    redirect("/auth/signin")
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <header className="bg-opacity-0 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <Logo className="w-32" />
          <UserNav user={{ email: user.email || "" }} />
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold mb-8 text-center">Subscription Debug</h1>
        <DebugSubscription />
      </main>
    </div>
  )
}

