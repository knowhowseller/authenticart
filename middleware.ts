import { createServerClient } from '@supabase/ssr'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
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

    // 세션 쿠키 갱신만 수행 (DB 쿼리 없음)
    await supabase.auth.getSession()

    const { pathname } = request.nextUrl

    // /my/* 는 쿠키에 세션이 없으면 로그인으로
    const hasSession = request.cookies.get('sb-coabfjizufovypfappco-auth-token') ||
                       request.cookies.getAll().some(c => c.name.includes('auth-token'))

    if (pathname.startsWith('/my') && !hasSession) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  } catch {
    // 미들웨어 오류 시 그냥 통과 (페이지 레벨에서 재검증)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public|api/webhooks).*)',
  ],
}
