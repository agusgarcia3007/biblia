import { createOpenAI } from '@ai-sdk/openai'
import { streamText } from 'ai'
import { createClient } from '@/lib/supabase/server'
import { getPersonaSystemPrompt } from '@/lib/personas'
import { formatVerseReference } from '@/lib/bible-books'
import { BASE_SYSTEM_PROMPT } from '@/lib/prompts'

const openai = createOpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export const runtime = 'edge'

export async function POST(req: Request) {
  try {
    const { messages, personaKey = 'augustin', sessionId } = await req.json()

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response('Mensajes inválidos', { status: 400 })
    }

    const supabase = await createClient()

    // Get user if authenticated (optional)
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Get the last user message for RAG retrieval
    const lastUserMessage = messages[messages.length - 1]
    if (!lastUserMessage || lastUserMessage.role !== 'user') {
      return new Response('El último mensaje debe ser del usuario', { status: 400 })
    }

    // Extract text from message parts (AI SDK 5.0 structure)
    const userMessageText = lastUserMessage.parts
      .filter((part: any) => part.type === 'text')
      .map((part: any) => ('text' in part ? part.text : ''))
      .join('')

    // Generate embedding for the user query
    const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        input: userMessageText,
        model: process.env.AI_MODEL_EMBEDDINGS || 'text-embedding-3-small',
      }),
    })

    if (!embeddingResponse.ok) {
      console.error('Error generating embedding:', await embeddingResponse.text())
      return new Response('Error al generar embedding', { status: 500 })
    }

    const embeddingData = await embeddingResponse.json()
    const queryEmbedding = embeddingData.data[0].embedding

    // Retrieve relevant Bible verses using vector similarity search
    const topK = parseInt(process.env.RAG_TOP_K || '5', 10)
    const minScore = parseFloat(process.env.RAG_MIN_SCORE || '0.75')

    const { data: matches, error: matchError } = await supabase.rpc('match_bible_verses', {
      query_embedding: `[${queryEmbedding.join(',')}]`,
      match_threshold: minScore,
      match_count: topK,
    })

    if (matchError) {
      console.error('Error retrieving verses:', matchError)
      // Continue without matches rather than failing
    }

    // Build context from retrieved verses
    let retrievedContext = ''
    let groundingRefs: Array<{ book: string; chapter: number; verse: number; text: string }> = []

    if (matches && matches.length > 0) {
      retrievedContext = '\n\nVersículos recuperados de la Biblia Católica para fundamentar tu respuesta:\n\n'
      matches.forEach((match: any, idx: number) => {
        const ref = formatVerseReference(match.book, match.chapter, match.verse)
        retrievedContext += `${idx + 1}. ${ref}: "${match.text}"\n`
        groundingRefs.push({
          book: match.book,
          chapter: match.chapter,
          verse: match.verse,
          text: match.text,
        })
      })
      retrievedContext +=
        '\n\nUsa SOLO estos versículos para apoyar tu respuesta. Si ninguno es relevante, haz una pregunta aclaratoria o sugiere leer un pasaje general sin citar específicamente.'
    } else {
      retrievedContext =
        '\n\nNo se encontraron versículos específicos para esta consulta. Haz una pregunta aclaratoria o sugiere un pasaje general de la Biblia sin citar versículos específicos.'
    }

    // Build system prompt with persona and retrieved context
    const personaPrompt = getPersonaSystemPrompt(personaKey)
    const fullSystemPrompt = `${BASE_SYSTEM_PROMPT}\n\n${personaPrompt}${retrievedContext}`

    // Stream response using AI SDK
    const result = await streamText({
      model: openai(process.env.AI_MODEL_CHAT || 'gpt-4'),
      system: fullSystemPrompt,
      messages: messages.map((msg: any) => ({
        role: msg.role,
        content: msg.parts
          .filter((part: any) => part.type === 'text')
          .map((part: any) => ('text' in part ? part.text : ''))
          .join(''),
      })),
      temperature: 0.3, // Low temperature for factual consistency
      maxTokens: 500,
    })

    // Store the user message and assistant response in the database (only if authenticated)
    // This happens asynchronously; we don't wait for it
    if (user) {
      storeMessages(supabase, user.id, sessionId, messages, groundingRefs, personaKey).catch(
        console.error
      )
    }

    return result.toUIMessageStreamResponse()
  } catch (error) {
    console.error('Error in chat route:', error)
    return new Response('Error interno del servidor', { status: 500 })
  }
}

async function storeMessages(
  supabase: any,
  userId: string,
  sessionId: string | null,
  messages: any[],
  groundingRefs: any[],
  personaKey: string
) {
  try {
    // Get or create session
    let activeSessionId = sessionId

    if (!activeSessionId) {
      const { data: newSession, error: sessionError } = await supabase
        .from('chat_sessions')
        .insert({
          user_id: userId,
          persona_key: personaKey,
        })
        .select('id')
        .single()

      if (sessionError) throw sessionError
      activeSessionId = newSession.id
    }

    // Store the last user message
    const lastUserMessage = messages[messages.length - 1]
    const messageContent = lastUserMessage.parts
      .filter((part: any) => part.type === 'text')
      .map((part: any) => ('text' in part ? part.text : ''))
      .join('')

    await supabase.from('chat_messages').insert({
      session_id: activeSessionId,
      role: lastUserMessage.role,
      content: messageContent,
      grounding_refs: null,
    })

    // Note: The assistant's response would be stored after streaming completes
    // This could be done client-side or via a callback
  } catch (error) {
    console.error('Error storing messages:', error)
  }
}
