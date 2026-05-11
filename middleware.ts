import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  // 1. 환경 변수 체크 (안전 장치)
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

  // 2. getUser() 실행 시 발생할 수 있는 에러 방지
  const { data: { user } } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }))

  const { pathname } = request.nextUrl

  // 3. 보호된 경로 체크
  const isProtectedRoute = 
    pathname.startsWith('/my') ||
    pathname.startsWith('/studio') ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/branch') ||
    pathname.startsWith('/bookings')

  if (!user && isProtectedRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    // 원래 가려던 주소를 저장했다가 로그인 후 보낼 수 있도록 설정 가능
    return NextResponse.redirect(url)
  }

  // 4. 이미 로그인한 사용자가 로그인/회원가입 페이지 접근 시
  if (user && (pathname === '/login' || pathname === '/signup')) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    // 정적 파일 및 API 경로를 제외한 모든 경로 감시
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}