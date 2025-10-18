'use client'

import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PersonaSelect } from '@/components/persona-select'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { Send, BookMarked, Loader2, Home, Copy, Bookmark } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { DEFAULT_PERSONA_KEY } from '@/lib/personas'

export default function ChatPage() {
  const router = useRouter()
  const [personaKey, setPersonaKey] = useState(DEFAULT_PERSONA_KEY)
  const [input, setInput] = useState('')
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (input.trim() && status === 'ready') {
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
        {/* Persona Selector */}
        <Card className="mb-4">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Estilo de respuesta</CardTitle>
            <CardDescription className="text-sm">
              Selecciona el estilo de las respuestas según la persona de un santo
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PersonaSelect value={personaKey} onValueChange={setPersonaKey} label="" />
          </CardContent>
        </Card>

        {/* Messages Area */}
        <Card className="flex-1 flex flex-col overflow-hidden">
          <ScrollArea className="flex-1 p-4">
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
      </div>
    </div>
  )
}
