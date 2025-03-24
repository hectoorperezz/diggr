"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { createPlaylist } from "@/lib/actions"
import { Logo } from "@/components/logo"
import { UserNav } from "@/components/user-nav"
import { supabase } from "@/lib/supabase"

export default function QuestionnairePage() {
  const [user, setUser] = useState<any>(null)
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Estado del formulario con la pregunta de idioma añadida
  const [formData, setFormData] = useState({
    genre: "",
    era: "",
    mood: "",
    songCount: 10,
    playlistName: "",
    language: "",
  })

  useEffect(() => {
    async function loadUser() {
      const { data } = await supabase.auth.getUser()
      if (!data.user) {
        router.push("/auth/signin")
        return
      }
      setUser(data.user)
      setIsLoading(false)
    }

    loadUser()
  }, [router])

  const questions = [
    {
      title: "What genre of music do you prefer?",
      options: ["Pop", "Rock", "Hip Hop", "Electronic", "Jazz", "Classical", "R&B", "Latin", "Country", "Alternative"],
      field: "genre",
    },
    {
      title: "Which era do you enjoy most?",
      options: ["2020s", "2010s", "2000s", "90s", "80s", "70s", "60s", "50s", "Classical"],
      field: "era",
    },
    {
      title: "What mood are you looking for?",
      options: ["Energetic", "Relaxed", "Happy", "Sad", "Romantic", "Focused", "Workout", "Party"],
      field: "mood",
    },
    {
      title: "Which language do you prefer for the songs?",
      options: ["English", "Spanish", "French", "German", "Italian", "Portuguese", "Korean", "Japanese", "Other"],
      field: "language",
    },
    {
      title: "How many songs would you like in your playlist?",
      field: "songCount",
      type: "slider",
    },
    {
      title: "Name your playlist",
      field: "playlistName",
      type: "input",
    },
  ]

  const currentQuestion = questions[currentStep]

  const handleNext = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1)
    } else {
      handleSubmit()
    }
  }

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1)
    }
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      await createPlaylist(formData)
      router.push("/results")
    } catch (error) {
      console.error("Error creating playlist:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (field: string, value: string | number) => {
    setFormData({
      ...formData,
      [field]: value,
    })
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
      <header className="bg-opacity-0 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <Logo className="w-32" />
          <UserNav user={{ email: user?.email || "" }} />
        </div>
      </header>

      <main className="flex min-h-[calc(100vh-70px)] flex-col items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">{currentQuestion.title}</CardTitle>
            <CardDescription>
              Step {currentStep + 1} of {questions.length}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {currentQuestion.type === "slider" ? (
              <div className="space-y-4">
                <Slider
                  defaultValue={[formData.songCount]}
                  min={5}
                  max={50}
                  step={1}
                  onValueChange={(value) => handleChange("songCount", value[0])}
                />
                <div className="text-center font-medium">{formData.songCount} songs</div>
              </div>
            ) : currentQuestion.type === "input" ? (
              <div className="space-y-4">
                <Input
                  placeholder="My Awesome Playlist"
                  value={formData.playlistName}
                  onChange={(e) => handleChange("playlistName", e.target.value)}
                />
              </div>
            ) : (
              <RadioGroup
                value={formData[currentQuestion.field as keyof typeof formData] as string}
                onValueChange={(value) => handleChange(currentQuestion.field, value)}
                className="space-y-2"
              >
                {currentQuestion.options?.map((option) => (
                  <div key={option} className="flex items-center space-x-2">
                    <RadioGroupItem value={option} id={option} />
                    <Label htmlFor={option}>{option}</Label>
                  </div>
                ))}
              </RadioGroup>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" onClick={handleBack} disabled={currentStep === 0 || loading}>
              Back
            </Button>
            <Button
              onClick={handleNext}
              disabled={!formData[currentQuestion.field as keyof typeof formData] || loading}
            >
              {loading ? (
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  ></path>
                </svg>
              ) : currentStep === questions.length - 1 ? (
                "Create Playlist"
              ) : (
                "Next"
              )}
            </Button>
          </CardFooter>
        </Card>
      </main>
    </div>
  )
}

