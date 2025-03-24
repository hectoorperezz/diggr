import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function CheckEmailPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-900 to-gray-800 p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Check your email</CardTitle>
          <CardDescription>We've sent you a confirmation link to complete your registration</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-500">
            Please check your email inbox and click on the confirmation link to activate your account. If you don't see
            the email, check your spam folder.
          </p>
          <div className="flex justify-center">
            <Link href="/auth/signin">
              <Button variant="outline">Back to Sign In</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

