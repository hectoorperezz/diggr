import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

// Create a standard Supabase client for client-side usage
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    // Ensure cookies work in both development and production
    cookieOptions: {
      // Don't use secure cookies in development
      secure: process.env.NODE_ENV === "production",
      // Use path / to ensure cookies are accessible across the site
      path: "/",
    },
  },
})

// Helper function to create a server-side Supabase client
// This should ONLY be called from server components or server actions
export function createServerClient() {
  const cookieStore = cookies()

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      // Use cookies from the request
      cookieOptions: {
        secure: process.env.NODE_ENV === "production",
        path: "/",
      },
      // Get cookies from the cookie store
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          cookieStore.set(name, value, options)
        },
        remove(name: string, options: any) {
          cookieStore.set(name, "", { ...options, maxAge: 0 })
        },
      },
    },
  })
}

// Helper function to get the current session on the server
// This should ONLY be called from server components or server actions
export async function getSession() {
  const serverClient = createServerClient()
  const {
    data: { session },
  } = await serverClient.auth.getSession()
  return session
}

// Helper function to get the current user on the server
// This should ONLY be called from server components or server actions
export async function getUser() {
  const serverClient = createServerClient()
  const {
    data: { user },
  } = await serverClient.auth.getUser()
  return user
}

