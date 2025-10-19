import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ElevenLabsClient } from 'elevenlabs'

const ELEVEN_LABS_API_KEY = process.env.ELEVEN_LABS_API_KEY

if (!ELEVEN_LABS_API_KEY) {
  throw new Error('ELEVEN_LABS_API_KEY is not configured')
}

const client = new ElevenLabsClient({
  apiKey: ELEVEN_LABS_API_KEY,
})

export async function POST(req: Request) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({
        error: 'Not authenticated'
      }, { status: 401 })
    }

    const { data: subscriptions, error: dbError } = await (supabase as any)
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .limit(1)

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json({
        error: 'Failed to check subscription'
      }, { status: 500 })
    }

    const hasActiveSubscription = subscriptions && subscriptions.length > 0

    if (!hasActiveSubscription) {
      return NextResponse.json({
        error: 'Premium subscription required'
      }, { status: 403 })
    }

    const { agentId } = await req.json()

    if (!agentId) {
      return NextResponse.json({
        error: 'Agent ID is required'
      }, { status: 400 })
    }

    const response = await client.conversationalAi.getSignedUrl({ agent_id: agentId })

    return NextResponse.json({
      signedUrl: response.signed_url
    })
  } catch (error) {
    console.error('Error generating signed URL:', error)
    return NextResponse.json({
      error: 'Failed to generate signed URL'
    }, { status: 500 })
  }
}
