'use client'

import { useConversation } from '@elevenlabs/react'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SaintPicker } from '@/components/saint-picker'
import { Badge } from '@/components/ui/badge'
import { Phone, PhoneOff, Home, Mic, MicOff } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { DEFAULT_PERSONA_KEY, getPersonaByKey } from '@/lib/personas'

export default function TalkPage() {
  const router = useRouter()
  const [personaKey, setPersonaKey] = useState(DEFAULT_PERSONA_KEY)
  const [isConnected, setIsConnected] = useState(false)
  const [isMuted, setIsMuted] = useState(false)

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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isConnected) {
        conversation.endSession()
      }
    }
  }, [isConnected])

  const selectedPersona = getPersonaByKey(personaKey)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
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
                <SaintPicker value={personaKey} onValueChange={setPersonaKey} label="" />
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
