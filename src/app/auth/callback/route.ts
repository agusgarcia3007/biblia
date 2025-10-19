import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin

  if (code) {
    const supabase = await createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  // Check if there's a redirect path stored (for paywall flow)
  const cookieStore = await cookies()
  const redirectPath = cookieStore.get('auth_redirect_path')?.value || '/'

  // Clear the cookie
  if (redirectPath !== '/') {
    cookieStore.delete('auth_redirect_path')
  }

  return NextResponse.redirect(`${origin}${redirectPath}`)
}
