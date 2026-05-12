'use client'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { User, Menu, X, BookOpen, LogOut, Heart, ShoppingBag, Calendar, ChevronDown, ShoppingCart, Search, Bell } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Logo from '@/components/brand/Logo'
import { cn } from '@/lib/utils/cn'
import type { UserRole } from '@/types/database'
import { getCart } from '@/lib/cart'

interface UserState {
  id: string
  name: string
  role: UserRole
}

const navLinks = [
  { href: '/classes', label: '클래스' },
  { href: '/artworks', label: '작품 마켓' },
  { href: '/shop', label: '재료 쇼핑' },
  { href: '/instructors', label: '강사 소개' },
  { href: '/board', label: '게시판' },
]

export default function Header() {
  const [user, setUser] = useState<UserState | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [cartCount, setCartCount] = useState(0)
  const [notifCount, setNotifCount] = useState(0)
  const pathname = usePathname()
  const supabase = createClient()
  const userMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user: u } }) => {
      if (!u) return
      const { data } = await supabase.from('users').select('name, role').eq('id', u.id).single()
      if (data) setUser({ id: u.id, name: data.name, role: data.role as UserRole })
      fetch('/api/notifications/unread-count')
        .then(r => r.json())
        .then(d => setNotifCount(d.count ?? 0))
        .catch(() => {})
    })
    setCartCount(getCart().reduce((s, item) => s + item.quantity, 0))
    const handler = () => setCartCount(getCart().reduce((s, item) => s + item.quantity, 0))
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
  }, [])

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
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
          <Link href="/search" className="p-2 text-brand-grey hover:text-brand-deep transition-colors">
            <Search size={20} />
          </Link>
          {user && (
            <Link href="/notifications" className="relative p-2 text-brand-grey hover:text-brand-deep transition-colors">
              <Bell size={20} />
              {notifCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {notifCount > 9 ? '9+' : notifCount}
                </span>
              )}
            </Link>
          )}
          <Link href="/cart" className="relative p-2 text-brand-grey hover:text-brand-deep transition-colors">
            <ShoppingCart size={20} />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-brand-amber text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            )}
          </Link>
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
              {user.role === 'branch_manager' && (
                <Link
                  href="/branch"
                  className="flex items-center gap-1.5 text-sm text-brand-sage font-medium px-3 py-1.5 rounded-full border border-brand-sage hover:bg-brand-sage hover:text-white transition-colors"
                >
                  지부 관리
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
              <div ref={userMenuRef} className="relative">
                <button
                  onClick={() => setUserMenuOpen(v => !v)}
                  className="flex items-center gap-1.5 text-sm text-brand-ink font-medium px-3 py-1.5 rounded-full hover:bg-brand-bg transition-colors"
                >
                  <User size={14} />
                  {user.name}
                  <ChevronDown size={12} className={`transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-1 w-44 bg-white rounded-2xl shadow-lg border border-brand-mist/30 py-1.5 z-50">
                    <Link href="/my/bookings" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-brand-ink hover:bg-brand-bg transition-colors">
                      <Calendar size={14} className="text-brand-grey" /> 내 예약
                    </Link>
                    <Link href="/my/wishlist" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-brand-ink hover:bg-brand-bg transition-colors">
                      <Heart size={14} className="text-brand-grey" /> 찜 목록
                    </Link>
                    <Link href="/my/orders" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-brand-ink hover:bg-brand-bg transition-colors">
                      <ShoppingBag size={14} className="text-brand-grey" /> 주문 내역
                    </Link>
                    <Link href="/my/class-requests" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-brand-ink hover:bg-brand-bg transition-colors">
                      <span className="text-[14px] leading-none">🙋</span> 클래스 요청
                    </Link>
                    <Link href="/my/coupons" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-brand-ink hover:bg-brand-bg transition-colors">
                      <span className="text-[14px] leading-none">🏷️</span> 내 쿠폰
                    </Link>
                    <Link href="/my/profile" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-brand-ink hover:bg-brand-bg transition-colors">
                      <User size={14} className="text-brand-grey" /> 프로필
                    </Link>
                    <div className="border-t border-brand-mist/30 mt-1 pt-1">
                      <button onClick={handleSignOut} className="flex items-center gap-2 px-4 py-2 text-sm text-brand-grey hover:text-red-500 hover:bg-brand-bg transition-colors w-full">
                        <LogOut size={14} /> 로그아웃
                      </button>
                    </div>
                  </div>
                )}
              </div>
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

        {/* Mobile actions */}
        <div className="md:hidden flex items-center gap-1">
          <Link href="/search" className="p-2 text-brand-grey hover:text-brand-deep transition-colors">
            <Search size={20} />
          </Link>
          {user && (
            <Link href="/notifications" className="relative p-2 text-brand-grey hover:text-brand-deep transition-colors">
              <Bell size={20} />
              {notifCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {notifCount > 9 ? '9+' : notifCount}
                </span>
              )}
            </Link>
          )}
          <Link href="/cart" className="relative p-2 text-brand-grey hover:text-brand-deep transition-colors">
            <ShoppingCart size={20} />
            {cartCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-brand-amber text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            )}
          </Link>
          <button
            className="p-2 text-brand-ink"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="메뉴"
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
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
          <div className="border-t border-brand-mist/30 pt-3">
            {user ? (
              <div className="space-y-1">
                {user.role === 'instructor' && (
                  <Link href="/studio" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 text-sm py-2 text-brand-deep font-medium">
                    <BookOpen size={14} /> 스튜디오
                  </Link>
                )}
                {user.role === 'branch_manager' && (
                  <Link href="/branch" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 text-sm py-2 text-brand-sage font-medium">
                    지부 관리
                  </Link>
                )}
                {user.role === 'admin' && (
                  <Link href="/admin" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 text-sm py-2 text-brand-amber font-medium">
                    관리자
                  </Link>
                )}
                <Link href="/my/bookings" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 text-sm py-2 text-brand-ink">
                  <Calendar size={14} className="text-brand-grey" /> 내 예약
                </Link>
                <Link href="/my/wishlist" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 text-sm py-2 text-brand-ink">
                  <Heart size={14} className="text-brand-grey" /> 찜 목록
                </Link>
                <Link href="/my/orders" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 text-sm py-2 text-brand-ink">
                  <ShoppingBag size={14} className="text-brand-grey" /> 주문 내역
                </Link>
                <Link href="/my/class-requests" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 text-sm py-2 text-brand-ink">
                  <span className="text-[14px] leading-none">🙋</span> 클래스 요청
                </Link>
                <div className="flex gap-2 pt-2">
                  <Link href="/my/profile" onClick={() => setMobileOpen(false)} className="flex-1 text-center text-sm py-2 border border-brand-mist text-brand-ink rounded-full">
                    프로필
                  </Link>
                  <button onClick={handleSignOut} className="flex-1 text-center text-sm py-2 bg-brand-bg text-brand-grey rounded-full">
                    로그아웃
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2 pt-2">
                <Link href="/login" onClick={() => setMobileOpen(false)} className="flex-1 text-center text-sm py-2 border border-brand-mist text-brand-ink rounded-full">
                  로그인
                </Link>
                <Link href="/signup" onClick={() => setMobileOpen(false)} className="flex-1 text-center text-sm py-2 bg-brand-deep text-white rounded-full">
                  회원가입
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
