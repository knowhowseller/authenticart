import { createServerClient } from '@supabase/ssr'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}

export async function createAdminClient() {
  return createSupabaseClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}

/**
 * 쿠키를 읽지 않는 익명(anon) 클라이언트.
 * 공개 데이터만 조회하는 페이지에서 사용하면 cookies() 의존이 사라져
 * 해당 라우트를 ISR(revalidate)로 캐싱할 수 있다 → TTFB·LCP 개선.
 * RLS 공개 읽기 정책(status=published 등)으로 보호되는 데이터만 조회할 것.
 */
export function createPublicClient() {
  return createSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
