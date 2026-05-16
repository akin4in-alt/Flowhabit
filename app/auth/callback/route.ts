import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

/**
 * OAuth / PKCE redirect от Supabase приходит как
 *   GET /auth/callback?code=...&state=...
 * Параметр `code` только в query string (не в hash — hash на сервер не попадает).
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl

  // Провайдер вернул ошибку вместо code (доступ запрещён, неверный redirect_uri и т.д.)
  const oauthError = url.searchParams.get('error')
  const oauthDesc = url.searchParams.get('error_description')
  if (oauthError) {
    const q = new URLSearchParams()
    q.set('error', 'oauth_provider')
    if (oauthDesc) q.set('details', oauthDesc)
    return NextResponse.redirect(new URL(`/auth?${q.toString()}`, url.origin))
  }

  // nextUrl и полный URL должны совпадать; дублируем разбор на случай edge-нюансов
  const code =
    url.searchParams.get('code') ?? new URL(request.url).searchParams.get('code')

  const origin = url.origin
  const dashboard = new URL('/dashboard', origin)

  if (!code) {
    return NextResponse.redirect(new URL('/auth?error=missing_code', origin))
  }

  let response = NextResponse.redirect(dashboard)

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    const q = new URLSearchParams({ error: 'auth_callback_failed' })
    if (error.message) q.set('details', error.message)
    return NextResponse.redirect(new URL(`/auth?${q.toString()}`, origin))
  }

  return response
}
