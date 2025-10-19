import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  try {
    const payload = await req.json()
    const eventType = payload.type

    console.log('Polar webhook event:', eventType)
    console.log('Payload:', JSON.stringify(payload, null, 2))

    // Handle different webhook events
    switch (eventType) {
      case 'subscription.created':
      case 'subscription.updated':
      case 'subscription.active':
        await handleSubscriptionActive(payload.data)
        break

      case 'subscription.canceled':
      case 'subscription.revoked':
        await handleSubscriptionInactive(payload.data)
        break

      default:
        console.log('Unhandled webhook event:', eventType)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({
      error: 'Webhook processing failed'
    }, { status: 500 })
  }
}

async function handleSubscriptionActive(data: {
  id: string
  customer?: { id: string; email?: string }
  metadata?: { user_id?: string }
  status: string
}) {
  try {
    const supabase = await createClient()

    // Get user_id from metadata or customer
    const userId = data.metadata?.user_id

    if (!userId) {
      console.error('No user_id found in subscription webhook')
      return
    }

    // Store subscription info in database
    // Using any to bypass type checking for dynamic table operations
    const { error } = await (supabase as any)
      .from('subscriptions')
      .upsert({
        user_id: userId,
        polar_subscription_id: data.id,
        status: data.status,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'polar_subscription_id'
      })

    if (error) {
      console.error('Error storing subscription:', error)
    }

    console.log('Subscription activated for user:', userId)
  } catch (error) {
    console.error('Error handling active subscription:', error)
  }
}

async function handleSubscriptionInactive(data: {
  id: string
  metadata?: { user_id?: string }
  status: string
}) {
  try {
    const supabase = await createClient()

    const userId = data.metadata?.user_id

    if (!userId) {
      console.error('No user_id found in subscription webhook')
      return
    }

    // Update subscription status
    // Using any to bypass type checking for dynamic table operations
    const { error } = await (supabase as any)
      .from('subscriptions')
      .update({
        status: data.status,
        updated_at: new Date().toISOString(),
      })
      .eq('polar_subscription_id', data.id)

    if (error) {
      console.error('Error updating subscription:', error)
    }

    console.log('Subscription deactivated for user:', userId)
  } catch (error) {
    console.error('Error handling inactive subscription:', error)
  }
}
