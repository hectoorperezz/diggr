import { NextResponse } from "next/server"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"
import { getUser } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    const user = await getUser()

    if (!user) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 })
    }

    const { prompt } = await request.json()

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 })
    }

    // Verify OpenAI API key
    const openaiApiKey = process.env.OPENAI_API_KEY
    if (!openaiApiKey) {
      return NextResponse.json({ error: "Missing OpenAI API key" }, { status: 500 })
    }

    // Initialize the model
    const model = openai("gpt-4o", { apiKey: openaiApiKey })

    // Generate the response
    const { text: aiResponse } = await generateText({
      model,
      prompt,
    })

    // Return the raw response for debugging
    return NextResponse.json({
      success: true,
      rawResponse: aiResponse,
      cleanedResponse: cleanResponse(aiResponse),
    })
  } catch (error) {
    console.error("Error in debug AI response:", error)
    return NextResponse.json(
      { error: "Error processing request: " + (error instanceof Error ? error.message : String(error)) },
      { status: 500 },
    )
  }
}

// Helper function to clean AI response
function cleanResponse(response: string): string {
  let cleanedResponse = response.trim()

  // Handle code blocks with language specifiers
  if (cleanedResponse.startsWith("```")) {
    // Extract content between code block markers
    const match = cleanedResponse.match(/```(?:json)?([\s\S]*?)```/)
    if (match && match[1]) {
      cleanedResponse = match[1].trim()
    } else {
      // If no match found, just remove the first and last line if they contain ```
      cleanedResponse = cleanedResponse
        .split("\n")
        .filter((line, index, arr) => {
          if (index === 0 && line.includes("```")) return false
          if (index === arr.length - 1 && line.includes("```")) return false
          return true
        })
        .join("\n")
        .trim()
    }
  }

  return cleanedResponse
}

