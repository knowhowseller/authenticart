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

  // /studio/agency/* — 승인된 에이전시 소유자(role=member 포함)도 허용.
  // 소유 여부는 페이지가 agency 조회로 최종 판정하므로 여기서는 로그인만 확인한다.
  if (pathname.startsWith('/studio/agency')) {
    if (!user) {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }
  // /studio/* (에이전시 제외) — instructor 또는 admin
  else if (pathname.startsWith('/studio') && !['instructor', 'admin'].includes(role ?? '')) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // /admin/* — admin은 전체 허용. branch_manager는 실제 사용하는 경로만 allowlist로 통과시킨다.
  // (허용 경로의 각 페이지도 role 재검증하지만, 미들웨어에서 범위를 좁혀 실수 여지를 줄인다 = 이중 방어)
  if (pathname.startsWith('/admin')) {
    if (role === 'admin') {
      // 전체 허용
    } else if (role === 'branch_manager') {
      const BM_PREFIXES = [
        '/admin/instructors', '/admin/classes', '/admin/bookings',
        '/admin/group-requests', '/admin/notices', '/admin/blog', '/admin/payouts',
      ]
      const allowed = pathname === '/admin' || BM_PREFIXES.some(p => pathname === p || pathname.startsWith(p + '/'))
      if (!allowed) return NextResponse.redirect(new URL('/', request.url))
    } else {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  // /branch/* — branch_manager 또는 admin
  if (pathname.startsWith('/branch') && !['branch_manager', 'admin'].includes(role ?? '')) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  // /bookings/* — 로그인 필요
  if (pathname.startsWith('/bookings') && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 로그인 회원의 강사 신청은 계정 생성을 건너뛰는 전용 경로로 유도한다.
  // (기존 /signup/instructor는 회원가입+신청 통합폼이라 로그인 회원에겐 맞지 않음)
  if (user && pathname === '/signup/instructor') {
    return NextResponse.redirect(new URL('/my/instructor/apply', request.url))
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
