'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ShoppingBag, User, Menu, X, BookOpen, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Logo from '@/components/brand/Logo'
import { cn } from '@/lib/utils/cn'
import type { UserRole } from '@/types/database'

interface UserState {
  id: string
  name: string
  role: UserRole
}

const navLinks = [
  { href: '/classes', label: '클래스' },
  { href: '/shop', label: '재료 쇼핑' },
  { href: '/instructors', label: '강사 소개' },
  { href: '/about', label: '오센틱아트' },
]

export default function Header() {
  const [user, setUser] = useState<UserState | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user: u } }) => {
      if (!u) return
      const { data } = await supabase.from('users').select('name, role').eq('id', u.id).single()
      if (data) setUser({ id: u.id, name: data.name, role: data.role as UserRole })
    })
  }, [])

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  async function handleSignOut() {
    await supabase.auth.signOut()
    setUser(null)
    window.location.href = '/'
  }

  return (
    <header className={cn(
      'sticky top-0 z-50 bg-white transition-shadow duration-200',
      scrolled && 'shadow-sm'
    )}>
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="flex-shrink-0">
          <Logo size="md" />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'text-sm font-medium transition-colors hover:text-brand-deep',
                pathname.startsWith(href) ? 'text-brand-deep' : 'text-brand-grey'
              )}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Desktop actions */}
        <div className="hidden md:flex items-center gap-2">
          {user ? (
            <>
              {user.role === 'instructor' && (
                <Link
                  href="/studio"
                  className="flex items-center gap-1.5 text-sm text-brand-deep font-medium px-3 py-1.5 rounded-full border border-brand-deep hover:bg-brand-deep hover:text-white transition-colors"
                >
                  <BookOpen size={14} />
                  스튜디오
                </Link>
              )}
              {user.role === 'admin' && (
                <Link
                  href="/admin"
                  className="flex items-center gap-1.5 text-sm text-brand-amber font-medium px-3 py-1.5 rounded-full border border-brand-amber hover:bg-brand-amber hover:text-brand-ink transition-colors"
                >
                  관리자
                </Link>
              )}
              <Link
                href="/my/bookings"
                className="flex items-center gap-1.5 text-sm text-brand-ink font-medium px-3 py-1.5 rounded-full hover:bg-brand-bg transition-colors"
              >
                <User size={14} />
                {user.name}
              </Link>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-1 text-sm text-brand-grey hover:text-brand-deep transition-colors"
              >
                <LogOut size={14} />
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-medium text-brand-ink hover:text-brand-deep transition-colors px-3 py-1.5"
              >
                로그인
              </Link>
              <Link
                href="/signup"
                className="text-sm font-medium bg-brand-deep text-white px-4 py-1.5 rounded-full hover:bg-brand-deep/90 transition-colors"
              >
                회원가입
              </Link>
            </>
          )}
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden p-2 text-brand-ink"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="메뉴"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-brand-mist/30 px-4 py-4 space-y-3">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className="block text-sm font-medium text-brand-ink py-2 hover:text-brand-deep"
            >
              {label}
            </Link>
          ))}
          <div className="border-t border-brand-mist/30 pt-3 flex gap-2">
            {user ? (
              <>
                <Link href="/my/bookings" onClick={() => setMobileOpen(false)} className="flex-1 text-center text-sm py-2 border border-brand-deep text-brand-deep rounded-full">
                  마이페이지
                </Link>
                <button onClick={handleSignOut} className="flex-1 text-center text-sm py-2 bg-brand-bg text-brand-grey rounded-full">
                  로그아웃
                </button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setMobileOpen(false)} className="flex-1 text-center text-sm py-2 border border-brand-mist text-brand-ink rounded-full">
                  로그인
                </Link>
                <Link href="/signup" onClick={() => setMobileOpen(false)} className="flex-1 text-center text-sm py-2 bg-brand-deep text-white rounded-full">
                  회원가입
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
