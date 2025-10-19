'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BookOpen, Home, Loader2, MessageSquare, Heart, BookMarked, Trash2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { track } from '@vercel/analytics'

interface JournalEntry {
  id: string
  user_id: string
  type: 'chat' | 'prayer' | 'verse'
  payload: any
  created_at: string
}

export default function JournalPage() {
  const router = useRouter()
  const [entries, setEntries] = useState<JournalEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'chat' | 'prayer' | 'verse'>('all')

  useEffect(() => {
    track('Journal Page View');
    fetchEntries()
  }, [])

  const fetchEntries = async () => {
    try {
      const response = await fetch('/api/journal')
      if (response.ok) {
        const data = await response.json()
        setEntries(data.entries || [])
      }
    } catch (err) {
      console.error('Error fetching journal entries:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta entrada?')) return

    track('Journal Entry Deleted');

    try {
      const response = await fetch(`/api/journal?id=${id}`, { method: 'DELETE' })
      if (response.ok) {
        setEntries(entries.filter((entry) => entry.id !== id))
      }
    } catch (err) {
      console.error('Error deleting entry:', err)
      alert('Error al eliminar entrada')
    }
  }

  const filteredEntries =
    filter === 'all' ? entries : entries.filter((entry) => entry.type === filter)

  const renderEntry = (entry: JournalEntry) => {
    const date = format(new Date(entry.created_at), "d 'de' MMMM, yyyy", { locale: es })

    switch (entry.type) {
      case 'chat':
        return (
          <Card key={entry.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle className="text-base">Conversación Bíblica</CardTitle>
                    <CardDescription className="text-xs">{date}</CardDescription>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(entry.id)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm line-clamp-4">{entry.payload.content}</p>
            </CardContent>
          </Card>
        )

      case 'prayer':
        return (
          <Card key={entry.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle className="text-base">Oración</CardTitle>
                    <CardDescription className="text-xs">{date}</CardDescription>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(entry.id)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm italic line-clamp-4">{entry.payload.prayer}</p>
              {entry.payload.intentTag && (
                <p className="text-xs text-muted-foreground mt-2">
                  Intención: {entry.payload.intentTag}
                </p>
              )}
            </CardContent>
          </Card>
        )

      case 'verse':
        return (
          <Card key={entry.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <BookMarked className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle className="text-base">
                      {entry.payload.verse?.reference || 'Versículo'}
                    </CardTitle>
                    <CardDescription className="text-xs">{date}</CardDescription>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(entry.id)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <blockquote className="border-l-4 border-primary pl-3 italic text-sm">
                "{entry.payload.verse?.text}"
              </blockquote>
              {entry.payload.reflection && (
                <p className="text-sm mt-3 text-muted-foreground">{entry.payload.reflection}</p>
              )}
            </CardContent>
          </Card>
        )

      default:
        return null
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">Mi Diario Espiritual</h1>
          </div>
          <Button variant="ghost" onClick={() => router.push('/')}>
            <Home className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Filter Tabs */}
        <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)} className="mb-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">Todas</TabsTrigger>
            <TabsTrigger value="verse">Versículos</TabsTrigger>
            <TabsTrigger value="chat">Chats</TabsTrigger>
            <TabsTrigger value="prayer">Oraciones</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Entries List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredEntries.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No hay entradas guardadas</h3>
              <p className="text-sm text-muted-foreground text-center mb-6">
                Guarda versículos, conversaciones o oraciones para verlos aquí
              </p>
              <div className="flex gap-3">
                <Button onClick={() => router.push('/chat')}>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Chatear
                </Button>
                <Button onClick={() => router.push('/prayer')} variant="outline">
                  <Heart className="mr-2 h-4 w-4" />
                  Orar
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredEntries.map(renderEntry)}
          </div>
        )}
      </div>
    </div>
  )
}
