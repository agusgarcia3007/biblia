'use client'

import { useConversation } from '@elevenlabs/react'
import { useState, useEffect, Suspense } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SaintPicker } from '@/components/saint-picker'
import { Badge } from '@/components/ui/badge'
import { Phone, PhoneOff, Home, Mic, MicOff, Loader2, Crown } from 'lucide-react'
import { useRouter, useSearchParams } from 'next/navigation'
import { DEFAULT_PERSONA_KEY, getPersonaByKey } from '@/lib/personas'
import { PremiumPaywall } from '@/components/premium-paywall'
import Confetti from 'react-confetti'
import { useWindowSize } from '@/hooks/use-window-size'

function TalkPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { width, height } = useWindowSize()
  const [personaKey, setPersonaKey] = useState(DEFAULT_PERSONA_KEY)
  const [isConnected, setIsConnected] = useState(false)
  const [isMuted, setIsMuted] = useState(false)
  const [showPaywall, setShowPaywall] = useState(false)
  const [isCheckingAccess, setIsCheckingAccess] = useState(true)
  const [hasPremiumAccess, setHasPremiumAccess] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)

  const conversation = useConversation({
    onConnect: () => {
      console.log('Connected to conversation')
      setIsConnected(true)
    },
    onDisconnect: () => {
      console.log('Disconnected from conversation')
      setIsConnected(false)
    },
    onMessage: (message) => {
      console.log('Message received:', message)
    },
    onError: (error) => {
      console.error('Conversation error:', error)
      alert('Error en la conversación: ' + error.message)
    },
  })

  const handleStartConversation = async () => {
    const persona = getPersonaByKey(personaKey)
    if (!persona) {
      alert('Por favor selecciona un santo')
      return
    }

    try {
      await conversation.startSession({
        agentId: persona.agentId,
      })
    } catch (error) {
      console.error('Error starting conversation:', error)
      alert('Error al iniciar la conversación')
    }
  }

  const handleEndConversation = async () => {
    try {
      await conversation.endSession()
    } catch (error) {
      console.error('Error ending conversation:', error)
    }
  }

  const handleToggleMute = () => {
    if (conversation.isSpeaking) {
      conversation.setVolume(isMuted ? 1 : 0)
      setIsMuted(!isMuted)
    }
  }

  // Check subscription status on mount
  useEffect(() => {
    async function checkSubscription() {
      try {
        const response = await fetch('/api/subscription/check')
        if (response.ok) {
          const data = await response.json()
          setHasPremiumAccess(data.hasAccess)

          // If payment was successful, show confetti
          const paymentSuccess = searchParams.get('payment') === 'success'
          if (paymentSuccess && data.hasAccess) {
            setShowConfetti(true)
            // Hide confetti after 5 seconds
            setTimeout(() => setShowConfetti(false), 5000)
            // Clean up URL
            router.replace('/talk')
          }

          // If no access, show paywall immediately
          if (!data.hasAccess) {
            setShowPaywall(true)
          }
        }
      } catch (error) {
        console.error('Error checking subscription:', error)
        setShowPaywall(true) // Show paywall on error to be safe
      } finally {
        setIsCheckingAccess(false)
      }
    }

    checkSubscription()
  }, [searchParams, router])

  // Handle successful subscription
  const handleSubscriptionSuccess = async () => {
    setShowPaywall(false)
    // Recheck subscription status
    try {
      const response = await fetch('/api/subscription/check')
      if (response.ok) {
        const data = await response.json()
        setHasPremiumAccess(data.hasAccess)
      }
    } catch (error) {
      console.error('Error rechecking subscription:', error)
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isConnected) {
        conversation.endSession()
      }
    }
  }, [isConnected])

  const selectedPersona = getPersonaByKey(personaKey)

  // Show loading state while checking access
  if (isCheckingAccess) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-background/95 backdrop-blur">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Phone className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold">Hablar con un Santo</h1>
            </div>
            <Button variant="ghost" onClick={() => router.push('/')}>
              <Home className="h-5 w-5" />
            </Button>
          </div>
        </header>
        <div className="container mx-auto px-4 py-8 max-w-2xl flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Verificando acceso...</p>
          </div>
        </div>
      </div>
    )
  }

  // Show premium gate if no access
  if (!hasPremiumAccess) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-background/95 backdrop-blur">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Phone className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold">Hablar con un Santo</h1>
            </div>
            <Button variant="ghost" onClick={() => router.push('/')}>
              <Home className="h-5 w-5" />
            </Button>
          </div>
        </header>
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <Card className="border-yellow-500/20 bg-gradient-to-br from-yellow-500/5 to-primary/5">
            <CardHeader className="text-center space-y-4">
              <div className="mx-auto p-4 bg-yellow-500/10 rounded-full w-fit">
                <Crown className="h-12 w-12 text-yellow-500" />
              </div>
              <CardTitle className="text-2xl">Función Premium</CardTitle>
              <CardDescription className="text-base">
                Hablar con los santos es una función exclusiva para suscriptores premium
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-background/50 rounded-lg p-6 space-y-4">
                <h3 className="font-semibold text-lg">Con la suscripción premium obtienes:</h3>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Conversaciones de voz en tiempo real con santos</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Mic className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                    <span>Orientación espiritual personalizada y directa</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Crown className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                    <span>Acceso ilimitado a todos los santos disponibles</span>
                  </li>
                </ul>
              </div>

              <div className="text-center space-y-4">
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-4xl font-bold">$4.99</span>
                  <span className="text-muted-foreground">/mes</span>
                </div>
                <Button
                  onClick={() => setShowPaywall(true)}
                  size="lg"
                  className="w-full"
                >
                  <Crown className="mr-2 h-5 w-5" />
                  Suscribirse Ahora
                </Button>
                <p className="text-xs text-muted-foreground">
                  Cancela en cualquier momento
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Premium Paywall Dialog */}
        <PremiumPaywall
          open={showPaywall}
          onOpenChange={setShowPaywall}
          onSuccess={handleSubscriptionSuccess}
        />
      </div>
    )
  }

  // Show full talk page for premium users
  return (
    <div className="min-h-screen bg-background">
      {/* Confetti for successful payment */}
      {showConfetti && (
        <Confetti
          width={width}
          height={height}
          recycle={false}
          numberOfPieces={500}
        />
      )}

      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Phone className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">Hablar con un Santo</h1>
            <Badge variant="default" className="ml-2">Premium</Badge>
          </div>
          <Button variant="ghost" onClick={() => router.push('/')}>
            <Home className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="space-y-6">
          {/* Welcome Card */}
          <Card>
            <CardHeader>
              <CardTitle>Conversación por voz</CardTitle>
              <CardDescription>
                Habla directamente con un santo y recibe orientación espiritual en tiempo real
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Persona Selector */}
          {!isConnected && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Selecciona un santo</CardTitle>
                <CardDescription>Elige con quién deseas conversar</CardDescription>
              </CardHeader>
              <CardContent>
                <SaintPicker
                  value={personaKey}
                  onValueChange={setPersonaKey}
                  label=""
                />
              </CardContent>
            </Card>
          )}

          {/* Conversation Status */}
          <Card className={isConnected ? 'border-primary bg-primary/5' : ''}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  {isConnected ? 'Conversación activa' : 'Listo para comenzar'}
                </CardTitle>
                {isConnected && <Badge variant="default">Conectado</Badge>}
              </div>
              {selectedPersona && (
                <CardDescription>{selectedPersona.display_name}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {!isConnected ? (
                  <div className="space-y-3 text-sm text-muted-foreground">
                    <p>Antes de comenzar:</p>
                    <ul className="space-y-2 ml-4">
                      <li>• Asegúrate de tener un micrófono conectado</li>
                      <li>• Busca un lugar tranquilo para conversar</li>
                      <li>• Permite el acceso al micrófono cuando se te solicite</li>
                      <li>• Habla con claridad y naturalidad</li>
                    </ul>
                  </div>
                ) : (
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2 text-primary">
                      <Mic className="h-5 w-5 animate-pulse" />
                      <span className="font-semibold">Puedes hablar ahora...</span>
                    </div>
                    <p className="text-muted-foreground">
                      El santo te escucha y responderá en tiempo real. Habla con tranquilidad y
                      espera su respuesta.
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col gap-3 pt-4">
                  {!isConnected ? (
                    <Button
                      onClick={handleStartConversation}
                      className="w-full"
                      size="lg"
                      disabled={!selectedPersona}
                    >
                      <Phone className="mr-2 h-5 w-5" />
                      Comenzar Conversación
                    </Button>
                  ) : (
                    <>
                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          onClick={handleToggleMute}
                          className="flex-1"
                          disabled={!conversation.isSpeaking}
                        >
                          {isMuted ? (
                            <>
                              <MicOff className="mr-2 h-4 w-4" />
                              Silenciado
                            </>
                          ) : (
                            <>
                              <Mic className="mr-2 h-4 w-4" />
                              Audio activo
                            </>
                          )}
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={handleEndConversation}
                          className="flex-1"
                        >
                          <PhoneOff className="mr-2 h-4 w-4" />
                          Terminar
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tips Card */}
          <Card className="border-muted">
            <CardHeader>
              <CardTitle className="text-base">Consejos para una mejor conversación</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-start gap-2">
                  <span className="font-semibold text-primary">1.</span>
                  <p>Haz preguntas específicas sobre tu vida espiritual o situación actual</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-semibold text-primary">2.</span>
                  <p>Escucha atentamente las respuestas antes de continuar</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-semibold text-primary">3.</span>
                  <p>No interrumpas mientras el santo está hablando</p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-semibold text-primary">4.</span>
                  <p>Mantén una actitud de apertura y reflexión</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function TalkPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background">
        <header className="border-b bg-background/95 backdrop-blur">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Phone className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold">Hablar con un Santo</h1>
            </div>
          </div>
        </header>
        <div className="container mx-auto px-4 py-8 max-w-2xl flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Cargando...</p>
          </div>
        </div>
      </div>
    }>
      <TalkPageContent />
    </Suspense>
  )
}
