import { ElevenLabsClient } from 'elevenlabs'
import { NextRequest, NextResponse } from 'next/server'
import { getPersonaByKey } from '@/lib/personas'

const ELEVEN_LABS_API_KEY = process.env.ELEVEN_LABS_API_KEY

if (!ELEVEN_LABS_API_KEY) {
  throw new Error('ELEVEN_LABS_API_KEY is not configured')
}

const client = new ElevenLabsClient({
  apiKey: ELEVEN_LABS_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { text, personaKey } = await request.json()

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text is required' }, { status: 400 })
    }

    // Obtener el voice ID según el santo/persona seleccionado
    const persona = personaKey ? getPersonaByKey(personaKey) : null
    const voiceId = persona?.voiceId || 'onwK4e9ZLuTAKqWW03F9' // Default: Daniel

    // Generar audio usando Eleven Labs
    const audioStream = await client.generate({
      voice: voiceId,
      text,
      model_id: 'eleven_multilingual_v2', // Modelo que soporta español
    })

    // Convertir el stream a buffer
    const chunks: Uint8Array[] = []
    for await (const chunk of audioStream) {
      chunks.push(chunk)
    }

    const audioBuffer = Buffer.concat(chunks)

    // Retornar el audio como respuesta
    return new NextResponse(audioBuffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('Error generating speech:', error)
    return NextResponse.json({ error: 'Error generating speech' }, { status: 500 })
  }
}
