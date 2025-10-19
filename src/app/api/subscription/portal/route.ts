import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({
        error: 'Not authenticated'
      }, { status: 401 })
    }

    // Get user's subscription to find their customer ID
    // Using any to bypass type checking for dynamic table operations
    const { data: subscription } = await (supabase as any)
      .from('subscriptions')
      .select('polar_subscription_id')
      .eq('user_id', user.id)
      .single()

    if (!subscription?.polar_subscription_id) {
      return NextResponse.json({
        error: 'No active subscription found'
      }, { status: 404 })
    }

    // Get subscription details from Polar to find customer ID
    const subResponse = await fetch(
      `https://api.polar.sh/v1/subscriptions/${subscription.polar_subscription_id}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.POLAR_ACCESS_TOKEN}`,
        },
      }
    )

    if (!subResponse.ok) {
      console.error('Failed to fetch subscription from Polar')
      return NextResponse.json({
        error: 'Failed to fetch subscription'
      }, { status: 500 })
    }

    const subData = await subResponse.json()
    const customerId = subData.customer_id

    if (!customerId) {
      return NextResponse.json({
        error: 'Customer ID not found'
      }, { status: 404 })
    }

    // Create customer portal session
    const portalResponse = await fetch(
      'https://api.polar.sh/v1/customer-portal/sessions/',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.POLAR_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer_id: customerId,
        }),
      }
    )

    if (!portalResponse.ok) {
      const errorText = await portalResponse.text()
      console.error('Portal session error:', errorText)
      return NextResponse.json({
        error: 'Failed to create portal session'
      }, { status: 500 })
    }

    const portalData = await portalResponse.json()

    // Redirect to the portal URL
    return NextResponse.redirect(portalData.url)
  } catch (error) {
    console.error('Portal session error:', error)
    return NextResponse.json({
      error: 'Internal error'
    }, { status: 500 })
  }
}
