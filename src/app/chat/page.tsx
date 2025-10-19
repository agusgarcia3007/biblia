'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SaintPicker } from '@/components/saint-picker'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Send, BookMarked, Loader2, Home, Copy, Bookmark, ChevronDown, Share2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { DEFAULT_PERSONA_KEY } from '@/lib/personas'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { ShareImage } from '@/components/share-image'
import { toPng } from 'html-to-image'
import { PremiumPaywall } from '@/components/premium-paywall'
import { track } from '@vercel/analytics'

export default function ChatPage() {
  const router = useRouter()
  const [personaKey, setPersonaKey] = useState(DEFAULT_PERSONA_KEY)
  const [input, setInput] = useState('')
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false)
  const [showPaywall, setShowPaywall] = useState(false)
  const [hasCheckedSubscription, setHasCheckedSubscription] = useState(false)
  const [hasPremiumAccess, setHasPremiumAccess] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: '/api/chat',
      body: {
        personaKey,
      },
    }),
  })

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Check subscription status on mount
  useEffect(() => {
    track('Chat Page View')

    async function checkSubscription() {
      try {
        const response = await fetch('/api/subscription/check')
        if (response.ok) {
          const data = await response.json()
          setHasPremiumAccess(data.hasAccess)
        }
      } catch (error) {
        console.error('Error checking subscription:', error)
      } finally {
        setHasCheckedSubscription(true)
      }
    }

    checkSubscription()
  }, [])

  // Handle premium requirement
  const handlePremiumRequired = () => {
    setShowPaywall(true)
  }

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

  // Wrapper for setPersonaKey that checks premium access
  const handlePersonaChange = (newPersonaKey: string) => {
    // Default persona is free, all others require premium
    if (newPersonaKey !== DEFAULT_PERSONA_KEY && !hasPremiumAccess) {
      handlePremiumRequired()
      return
    }
    setPersonaKey(newPersonaKey)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim() && status === 'ready') {
      track('Chat Message Sent', { personaKey })
      sendMessage({ text: input })
      setInput('')
    }
  }

  const handleSaveMessage = async (content: string) => {
    try {
      await fetch('/api/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'chat',
          payload: {
            content,
            personaKey,
            timestamp: new Date().toISOString(),
          },
        }),
      })
      alert('Mensaje guardado en tu diario')
    } catch (err) {
      console.error('Error saving message:', err)
      alert('Error al guardar mensaje')
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    alert('Copiado al portapapeles')
  }

  const handleShareMessage = async (content: string) => {
    try {
      // Create a temporary container for the ShareImage component
      const container = document.createElement('div')
      container.style.position = 'absolute'
      container.style.left = '-9999px'
      container.style.top = '0'
      document.body.appendChild(container)

      // Get saint name
      const saintName =
        personaKey === 'augustin' ? 'San Agustín' :
        personaKey === 'teresa_avila' ? 'Santa Teresa' :
        'San Francisco'

      // Render the ShareImage component
      const root = await import('react-dom/client').then((m) =>
        m.createRoot(container)
      )
      await new Promise<void>((resolve) => {
        root.render(
          <ShareImage
            type="prayer"
            content={{
              title: `Respuesta de ${saintName}`,
              text: content.length > 300 ? content.substring(0, 297) + '...' : content,
            }}
          />
        )
        // Wait for render
        setTimeout(resolve, 500)
      })

      // Generate image
      const element = container.querySelector('#share-image') as HTMLElement
      if (!element) throw new Error('Element not found')

      const dataUrl = await toPng(element, {
        width: 1080,
        height: 1920,
        pixelRatio: 2,
        cacheBust: true,
      })

      // Cleanup immediately after generating
      root.unmount()
      document.body.removeChild(container)

      // Convert to blob
      const response = await fetch(dataUrl)
      const blob = await response.blob()

      // Try to share
      if (navigator.share) {
        try {
          // Create File object with timestamp to ensure uniqueness
          const timestamp = Date.now()
          const file = new File([blob], `respuesta-${timestamp}.png`, {
            type: 'image/png',
            lastModified: timestamp,
          })

          // Check if we can share files
          const canShareFiles =
            navigator.canShare && navigator.canShare({ files: [file] })

          if (canShareFiles) {
            await navigator.share({
              files: [file],
              title: 'Respuesta de la Biblia',
              text: `Respuesta de ${saintName}`,
            })
          } else {
            // Mobile fallback: download the image automatically
            const link = document.createElement('a')
            link.download = `respuesta-${timestamp}.png`
            link.href = dataUrl
            link.click()

            // Then share text to allow user to attach the downloaded image
            setTimeout(() => {
              navigator
                .share({
                  title: 'Respuesta de la Biblia',
                  text: `Respuesta de ${saintName}\n\nHe descargado la imagen, adjúntala desde tu galería.`,
                })
                .catch(() => {})
            }, 500)
          }
        } catch (shareError) {
          if ((shareError as Error).name !== 'AbortError') {
            // Fallback: download
            const link = document.createElement('a')
            link.download = 'respuesta.png'
            link.href = dataUrl
            link.click()
          }
        }
      } else {
        // Desktop fallback: download the image
        const link = document.createElement('a')
        link.download = 'respuesta.png'
        link.href = dataUrl
        link.click()
      }
    } catch (error) {
      console.error('Error sharing message:', error)
      // Fallback to text sharing
      if (navigator.share) {
        navigator.share({
          title: 'Respuesta de la Biblia',
          text: content,
        })
      } else {
        navigator.clipboard.writeText(content)
        alert('Respuesta copiada al portapapeles')
      }
    }
  }

  const getMessageContent = (message: typeof messages[0]): string => {
    return message.parts
      .filter((part) => part.type === 'text')
      .map((part) => ('text' in part ? part.text : ''))
      .join('')
  }

  const isLoading = status === 'streaming' || status === 'submitted'

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookMarked className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">Chat con la Biblia</h1>
          </div>
          <Button variant="ghost" onClick={() => router.push('/')}>
            <Home className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 max-w-4xl h-[calc(100vh-80px)] flex flex-col">
        {/* Messages Area */}
        <Card className="flex-1 flex flex-col overflow-hidden mb-4">
          <ScrollArea className="flex-1 overflow-hidden">
            <div className="p-4">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-center">
                <div className="space-y-4 max-w-md">
                  <div className="text-4xl">📖</div>
                  <h2 className="text-2xl font-semibold">Pregunta sobre la Biblia</h2>
                  <p className="text-muted-foreground">
                    Haz cualquier pregunta sobre las Escrituras y recibirás respuestas
                    fundamentadas en la Biblia Católica con citas específicas.
                  </p>
                  <div className="text-sm text-muted-foreground space-y-2">
                    <p className="font-semibold">Ejemplos:</p>
                    <ul className="space-y-1">
                      <li>• &quot;¿Qué dice la Biblia sobre el perdón?&quot;</li>
                      <li>• &quot;Estoy preocupado por el futuro&quot;</li>
                      <li>• &quot;¿Cómo puedo fortalecer mi fe?&quot;</li>
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => {
                  const content = getMessageContent(message)
                  return (
                    <div
                      key={message.id}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-4 ${
                          message.role === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        {message.role === 'assistant' && (
                          <Badge variant="secondary" className="mb-2">
                            {personaKey === 'augustin'
                              ? 'San Agustín'
                              : personaKey === 'teresa_avila'
                                ? 'Santa Teresa'
                                : 'San Francisco'}
                          </Badge>
                        )}
                        <div className="prose prose-sm dark:prose-invert max-w-none">
                          {content}
                        </div>
                        {message.role === 'assistant' && (
                          <div className="flex gap-2 mt-3 pt-3 border-t border-border/40">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(content)}
                            >
                              <Copy className="h-3 w-3 mr-1" />
                              Copiar
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleShareMessage(content)}
                            >
                              <Share2 className="h-3 w-3 mr-1" />
                              Compartir
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSaveMessage(content)}
                            >
                              <Bookmark className="h-3 w-3 mr-1" />
                              Guardar
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-muted rounded-lg p-4">
                      <Loader2 className="h-5 w-5 animate-spin" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            )}
            </div>
          </ScrollArea>

          {/* Input Area */}
          <div className="border-t p-4">
            {error && (
              <div className="mb-3 p-3 text-sm text-destructive bg-destructive/10 rounded-md">
                Error: {error.message}
              </div>
            )}
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Escribe tu pregunta sobre la Biblia..."
                className="min-h-[60px] resize-none"
                disabled={status !== 'ready'}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>)
                  }
                }}
              />
              <Button type="submit" disabled={status !== 'ready' || !input.trim()} size="icon">
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>
            <p className="text-xs text-muted-foreground mt-2">
              Presiona Enter para enviar, Shift+Enter para nueva línea
            </p>
          </div>
        </Card>

        {/* Advanced Options */}
        <Collapsible
          open={isAdvancedOpen}
          onOpenChange={setIsAdvancedOpen}
        >
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-accent/50 transition-colors pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base">Opciones avanzadas</CardTitle>
                    <CardDescription className="text-sm">
                      Personaliza el estilo de respuesta
                    </CardDescription>
                  </div>
                  <ChevronDown
                    className={`h-5 w-5 transition-transform ${
                      isAdvancedOpen ? 'transform rotate-180' : ''
                    }`}
                  />
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent>
                <SaintPicker
                  value={personaKey}
                  onValueChange={handlePersonaChange}
                  onPremiumRequired={handlePremiumRequired}
                  label="Persona de santo"
                  description="Selecciona el estilo de las respuestas según la persona de un santo"
                />
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
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
