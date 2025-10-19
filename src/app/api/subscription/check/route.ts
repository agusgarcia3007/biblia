import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({
        hasAccess: false,
        error: 'Not authenticated'
      }, { status: 401 })
    }

    // Check if user has active subscription in local database
    // This is more reliable than querying Polar API each time
    const { data: subscriptions, error: dbError } = await (supabase as any)
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'active')
      .limit(1)

    if (dbError) {
      console.error('Database error:', dbError)
      return NextResponse.json({
        hasAccess: false,
        error: 'Failed to check subscription'
      }, { status: 500 })
    }

    const hasActiveSubscription = subscriptions && subscriptions.length > 0

    return NextResponse.json({
      hasAccess: hasActiveSubscription,
      user: {
        id: user.id,
        email: user.email,
      }
    })
  } catch (error) {
    console.error('Subscription check error:', error)
    return NextResponse.json({
      hasAccess: false,
      error: 'Internal error'
    }, { status: 500 })
  }
}
