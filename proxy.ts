import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    return supabaseResponse
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }))

  let role: string | null = null
  if (user) {
    const { data } = await supabase.from('users').select('role').eq('id', user.id).single()
    role = data?.role ?? 'member'
  }

  const { pathname } = request.nextUrl

  // /my/* — 로그인 필요 (원래 경로 보존)
  if (pathname.startsWith('/my') && !user) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('redirect', pathname)
    return NextResponse.redirect(loginUrl)
  }

  // /studio/* — instructor 또는 admin
  if (pathname.startsWith('/studio') && !['instructor', 'admin'].includes(role ?? '')) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // /admin/* — admin만
  if (pathname.startsWith('/admin') && role !== 'admin') {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // /branch/* — branch_manager 또는 admin
  if (pathname.startsWith('/branch') && !['branch_manager', 'admin'].includes(role ?? '')) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // /bookings/* — 로그인 필요
  if (pathname.startsWith('/bookings') && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 로그인 상태에서 /login /signup 접근 → 홈으로
  if (user && (pathname === '/login' || pathname.startsWith('/signup'))) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
