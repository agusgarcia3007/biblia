import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({
        error: 'Not authenticated'
      }, { status: 401 })
    }

    const productId = process.env.PRODUCT_ID
    if (!productId) {
      return NextResponse.json({
        error: 'Product not configured'
      }, { status: 500 })
    }

    // Create checkout session with Polar
    const response = await fetch('https://api.polar.sh/v1/checkouts/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.POLAR_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        product_id: productId,
        customer_email: user.email,
        customer_metadata: {
          external_customer_id: user.id,
        },
        success_url: 'https://www.bibliai.org/talk?payment=success'
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Polar checkout error:', errorText)
      return NextResponse.json({
        error: 'Failed to create checkout session'
      }, { status: 500 })
    }

    const data = await response.json()

    return NextResponse.json({
      checkoutUrl: data.url,
      sessionId: data.id,
    })
  } catch (error) {
    console.error('Checkout creation error:', error)
    return NextResponse.json({
      error: 'Internal error'
    }, { status: 500 })
  }
}
