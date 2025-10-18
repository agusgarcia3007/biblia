'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { VerseCard } from '@/components/verse-card'
import { Home, Loader2, ArrowLeft } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface Verse {
  id: string
  book: string
  chapter: number
  verse: number
  text: string
  is_deuterocanon: boolean
}

interface VerseOfDayData {
  verse: {
    id: string
    book: string
    chapter: number
    verse: number
    text: string
    reference: string
    is_deuterocanon: boolean
  }
  reflection: string
  context: Verse[]
  date: string
}

export default function VerseDetailPage() {
  const params = useParams()
  const router = useRouter()
  const date = params.date as string

  const [data, setData] = useState<VerseOfDayData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (date) {
      fetchVerseData()
    }
  }, [date])

  const fetchVerseData = async () => {
    try {
      const response = await fetch(`/api/verse-of-day?date=${date}`)
      if (!response.ok) {
        throw new Error('Error al cargar el versículo')
      }
      const verseData = await response.json()
      setData(verseData)
    } catch (err) {
      console.error('Error fetching verse:', err)
      setError('Error al cargar el versículo')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveVerse = async () => {
    if (!data) return

    try {
      await fetch('/api/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'verse',
          payload: {
            verse: data.verse,
            reflection: data.reflection,
            date: data.date,
          },
        }),
      })
      alert('Versículo guardado en tu diario')
    } catch (err) {
      console.error('Error saving verse:', err)
      alert('Error al guardar versículo')
    }
  }

  const handleShareVerse = () => {
    if (!data) return

    const shareText = `"${data.verse.text}"\n\n${data.verse.reference}\n\n${data.reflection}`

    if (navigator.share) {
      navigator.share({
        title: 'Versículo del Día',
        text: shareText,
      })
    } else {
      navigator.clipboard.writeText(shareText)
      alert('Versículo copiado al portapapeles')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <p className="text-destructive mb-4">{error || 'No se encontró el versículo'}</p>
            <Button onClick={() => router.push('/')}>Volver al inicio</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" onClick={() => router.back()}>
            <ArrowLeft className="h-5 w-5 mr-2" />
            Volver
          </Button>
          <Button variant="ghost" onClick={() => router.push('/')}>
            <Home className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-3xl space-y-6">
        {/* Date Badge */}
        <div className="flex justify-center">
          <Badge variant="secondary" className="text-sm">
            {new Date(data.date).toLocaleDateString('es-ES', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Badge>
        </div>

        {/* Main Verse */}
        <VerseCard
          verse={data.verse}
          reflection={data.reflection}
          onShare={handleShareVerse}
          onSave={handleSaveVerse}
        />

        {/* Context Verses */}
        {data.context && data.context.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contexto</CardTitle>
              <CardDescription>
                Versículos cercanos para entender mejor el pasaje
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {data.context.map((contextVerse) => {
                const isMainVerse = contextVerse.verse === data.verse.verse
                return (
                  <div
                    key={contextVerse.id}
                    className={`p-4 rounded-lg border ${
                      isMainVerse ? 'border-primary bg-primary/5' : 'border-border'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <Badge variant={isMainVerse ? 'default' : 'outline'} className="shrink-0">
                        {contextVerse.verse}
                      </Badge>
                      <p className={`text-sm ${isMainVerse ? 'font-medium' : ''}`}>
                        {contextVerse.text}
                      </p>
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        )}

        {/* Lectio Divina Guide */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-lg">Guía para Lectio Divina</CardTitle>
            <CardDescription>
              Medita sobre este pasaje de forma contemplativa
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <h4 className="font-semibold text-primary mb-1">1. Lectura (Lectio)</h4>
              <p className="text-muted-foreground">
                Lee el versículo lentamente varias veces. Deja que las palabras penetren en tu
                mente.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-primary mb-1">2. Meditación (Meditatio)</h4>
              <p className="text-muted-foreground">
                Reflexiona sobre el significado. ¿Qué te dice Dios a través de estas palabras?
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-primary mb-1">3. Oración (Oratio)</h4>
              <p className="text-muted-foreground">
                Responde a Dios con tu corazón. Comparte tus pensamientos y sentimientos.
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-primary mb-1">4. Contemplación (Contemplatio)</h4>
              <p className="text-muted-foreground">
                Descansa en la presencia de Dios. Simplemente permanece en silencio con Él.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
