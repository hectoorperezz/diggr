"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Logo } from "@/components/logo"

export default function AiDebugPage() {
  const [prompt, setPrompt] =
    useState<string>(`Create a playlist of 5 Pop songs from the 2010s era with a Happy mood in English language.
Format your response as JSON with the following structure:
{
"description": "A brief description of the playlist",
"songs": [
  {"title": "Song Title", "artist": "Artist Name"},
  ...
]
}
Make sure all songs actually exist and match the criteria.`)
  const [response, setResponse] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const testAiResponse = async () => {
    setLoading(true)
    setError(null)
    setResponse(null)

    try {
      const res = await fetch("/api/debug-ai-response", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to get AI response")
      }

      setResponse(data)

      // Try to parse the cleaned response as JSON
      try {
        const parsedJson = JSON.parse(data.cleanedResponse)
        setResponse({
          ...data,
          parsedJson,
          canParse: true,
        })
      } catch (parseError) {
        setResponse({
          ...data,
          parseError: (parseError as Error).message,
          canParse: false,
        })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <header className="bg-opacity-0 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <Logo className="w-32" />
          <Button onClick={() => (window.location.href = "/")} variant="outline">
            Go to Home
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8 text-center">AI Response Debug Tool</h1>

        <Card className="bg-gray-800 border-gray-700 mb-6">
          <CardHeader>
            <CardTitle>Test AI Prompt</CardTitle>
            <CardDescription className="text-gray-400">
              Enter a prompt to test the AI response and JSON parsing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[200px] bg-gray-700 border-gray-600"
              placeholder="Enter your prompt here..."
            />
          </CardContent>
          <CardFooter>
            <Button
              onClick={testAiResponse}
              disabled={loading || !prompt}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {loading ? "Processing..." : "Test AI Response"}
            </Button>
          </CardFooter>
        </Card>

        {error && (
          <Card className="bg-red-900/30 border-red-600 mb-6">
            <CardHeader>
              <CardTitle className="text-red-400">Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-300">{error}</p>
            </CardContent>
          </Card>
        )}

        {response && (
          <>
            <Card className="bg-gray-800 border-gray-700 mb-6">
              <CardHeader>
                <CardTitle>Raw AI Response</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-gray-900 p-4 rounded-md overflow-auto max-h-60 text-sm whitespace-pre-wrap">
                  {response.rawResponse}
                </pre>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700 mb-6">
              <CardHeader>
                <CardTitle>Cleaned Response</CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="bg-gray-900 p-4 rounded-md overflow-auto max-h-60 text-sm whitespace-pre-wrap">
                  {response.cleanedResponse}
                </pre>
              </CardContent>
            </Card>

            <Card
              className={`${response.canParse ? "bg-green-900/30 border-green-600" : "bg-red-900/30 border-red-600"} mb-6`}
            >
              <CardHeader>
                <CardTitle className={response.canParse ? "text-green-400" : "text-red-400"}>
                  JSON Parsing {response.canParse ? "Successful" : "Failed"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {response.canParse ? (
                  <pre className="bg-gray-900 p-4 rounded-md overflow-auto max-h-60 text-sm">
                    {JSON.stringify(response.parsedJson, null, 2)}
                  </pre>
                ) : (
                  <p className="text-red-300">{response.parseError}</p>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </main>
    </div>
  )
}

