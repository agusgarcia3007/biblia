import { createClient } from '@/lib/supabase/server'
import { formatVerseReference } from '@/lib/bible-books'
import { createOpenAI } from '@ai-sdk/openai'
import { generateText } from 'ai'

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export const runtime = 'edge'

const REFLECTION_SYSTEM_PROMPT = `Genera una breve reflexión pastoral (2-3 oraciones) sobre el versículo bíblico proporcionado.

La reflexión debe ser:
- Concisa y aplicable a la vida cotidiana
- Pastoral y esperanzadora
- Fundamentada solo en el versículo dado
- Sin especulación doctrinal
- En español

No inventes contenido doctrinal. Mantén un tono cálido y cercano.`

// Approximate total verses in Catholic Bible (including deuterocanonical books)
const TOTAL_VERSES = 31102

// In-memory cache for verse of the day
const cache = new Map<string, { data: any; timestamp: number }>()
const CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours

/**
 * Deterministic hash function to select verse based on date
 */
function hashDate(dateString: string): number {
  let hash = 0
  for (let i = 0; i < dateString.length; i++) {
    const char = dateString.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash)
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0]

    // Check cache first
    const cached = cache.get(date)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return Response.json(cached.data, {
        headers: {
          'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=172800',
        },
      })
    }

    const supabase = await createClient()

    // Deterministically select verse based on date
    const hash = hashDate(date)
    const selectedIndex = hash % TOTAL_VERSES

    // Fetch the selected verse
    const { data: verses, error: verseError } = await supabase
      .from('bible_verses')
      .select('*')
      .order('book_order, chapter, verse')
      .range(selectedIndex, selectedIndex)
      .limit(1)

    if (verseError || !verses || verses.length === 0) {
      return new Response('Error al recuperar versículo', { status: 500 })
    }

    const verse = verses[0]

    // Fetch context (previous and next verses)
    const { data: contextVerses, error: contextError } = await supabase
      .from('bible_verses')
      .select('*')
      .eq('book', verse.book)
      .eq('chapter', verse.chapter)
      .gte('verse', Math.max(1, verse.verse - 2))
      .lte('verse', verse.verse + 2)
      .order('verse')

    if (contextError) {
      console.error('Error fetching context:', contextError)
    }

    // Generate reflection using AI
    const reflectionPrompt = `Versículo del día:

${formatVerseReference(verse.book, verse.chapter, verse.verse)}: "${verse.text}"

Escribe una breve reflexión pastoral (2-3 oraciones) que ayude a aplicar este versículo a la vida cotidiana.`

    const result = await generateText({
      model: openai(process.env.AI_MODEL_CHAT || 'gpt-4'),
      system: REFLECTION_SYSTEM_PROMPT,
      prompt: reflectionPrompt,
      temperature: 0.4,
      maxTokens: 200,
    })

    const responseData = {
      verse: {
        id: verse.id,
        book: verse.book,
        chapter: verse.chapter,
        verse: verse.verse,
        text: verse.text,
        reference: formatVerseReference(verse.book, verse.chapter, verse.verse),
        is_deuterocanon: verse.is_deuterocanon,
      },
      reflection: result.text,
      context: contextVerses || [],
      date,
    }

    // Store in cache
    cache.set(date, { data: responseData, timestamp: Date.now() })

    return Response.json(responseData, {
      headers: {
        'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=172800',
      },
    })
  } catch (error) {
    console.error('Error in verse-of-day route:', error)
    return new Response('Error interno del servidor', { status: 500 })
  }
}
