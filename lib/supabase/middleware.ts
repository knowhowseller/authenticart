import { createServerClient } from '@supabase/ssr'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder',
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  let role: string | null = null
  if (user) {
    const { data } = await supabase.from('users').select('role').eq('id', user.id).single()
    role = data?.role ?? 'member'
  }

  const { pathname } = request.nextUrl

  // /my/* — 로그인 필요
  if (pathname.startsWith('/my') && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // /studio/* — instructor 또는 admin
  if (pathname.startsWith('/studio') && !['instructor', 'admin'].includes(role ?? '')) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // /admin/* — admin만
  if (pathname.startsWith('/admin') && role !== 'admin') {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // 로그인 상태에서 /login /signup 접근 → 홈으로
  if (user && (pathname === '/login' || pathname.startsWith('/signup'))) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return supabaseResponse
}
