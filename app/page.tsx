// 홈은 공개 콘텐츠만 표시 → ISR로 캐싱(10분)하여 TTFB·LCP 개선
export const revalidate = 600

import Link from 'next/link'
import Image from 'next/image'
import { createPublicClient } from '@/lib/supabase/server'
import MarbleBackground from '@/components/brand/MarbleBackground'
import FlowLine from '@/components/brand/FlowLine'
import Hexagon from '@/components/brand/Hexagon'
import ClassCard from '@/components/class/ClassCard'
import Button from '@/components/ui/Button'
import FloatingCTA from '@/components/home/FloatingCTA'
import JsonLd from '@/components/seo/JsonLd'
import BlogCover from '@/components/blog/BlogCover'
import { categoryLabel, type BlogPostCard } from '@/lib/blog'
import { formatPrice } from '@/lib/utils/format'
import {
  MapPin, Star, CheckCircle2, TrendingUp, Award, ShoppingBag, Search,
  Store, Package, MessageCircle, Users, Palette, BookOpen, Eye,
} from 'lucide-react'
import type { ClassAttributes, ConfirmationMode } from '@/types/database'

async function getStats() {
  const supabase = createPublicClient()
  const [
    { count: instructorCount },
    { count: classCount },
    { count: productCount },
    { count: artworkCount },
  ] = await Promise.all([
    supabase.from('instructor_profiles').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
    supabase.from('classes').select('*', { count: 'exact', head: true }).eq('status', 'published'),
    supabase.from('products').select('*', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('artworks').select('*', { count: 'exact', head: true }).eq('status', 'active'),
  ])
  return {
    instructorCount: instructorCount ?? 0,
    classCount: classCount ?? 0,
    productCount: productCount ?? 0,
    artworkCount: artworkCount ?? 0,
  }
}

async function getGenreCategories() {
  const supabase = createPublicClient()
  const { data } = await supabase
    .from('craft_categories')
    .select('id, code, name')
    .is('parent_id', null)
    .eq('is_active', true)
    .order('sort_order')
  return data ?? []
}

async function getFeaturedClasses() {
  const supabase = createPublicClient()
  const { data } = await supabase
    .from('classes')
    .select(`
      id, title, region, price, thumbnail_url, confirmation_mode, attributes,
      users!instructor_id(name),
      class_schedules(max_students, booked_count)
    `)
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(6)
  return data ?? []
}

async function getFeaturedArtworks() {
  const supabase = createPublicClient()
  const { data } = await supabase
    .from('artworks')
    .select('id, title, images, price, category, status, users!seller_id(name)')
    .in('status', ['active', 'sold_out'])
    .order('is_gallery', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(6)
  return data ?? []
}

async function getFeaturedInstructors() {
  const supabase = createPublicClient()
  const { data: instructors } = await supabase
    .from('instructor_profiles')
    .select('instructor_id, bio, profile_image, users!instructor_id(name, region)')
    .eq('status', 'approved')
    .limit(3)

  if (!instructors || instructors.length === 0) return []

  const ids = (instructors as any[]).map(i => i.instructor_id)
  const { data: classCounts } = await supabase
    .from('classes')
    .select('instructor_id')
    .in('instructor_id', ids)
    .eq('status', 'published')

  const countMap = new Map<string, number>()
  for (const c of classCounts ?? []) {
    countMap.set(c.instructor_id, (countMap.get(c.instructor_id) ?? 0) + 1)
  }

  return (instructors as any[]).map(i => ({
    ...i,
    classCount: countMap.get(i.instructor_id) ?? 0,
  }))
}

async function getApprovedVendors() {
  const supabase = createPublicClient()
  const { data } = await supabase
    .from('vendors')
    .select('id, business_name, logo_url, slug')
    .eq('status', 'approved')
    .limit(8)
  return data ?? []
}

async function getFeaturedProducts() {
  const supabase = createPublicClient()
  const { data } = await supabase
    .from('products')
    .select('id, name, retail_price, wholesale_price, images, stock_qty, is_instructor_only, category')
    .eq('is_active', true)
    .gt('stock_qty', 0)
    .order('created_at', { ascending: false })
    .limit(4)
  return data ?? []
}

async function getFeaturedBlogPosts() {
  const supabase = createPublicClient()
  // 홈 노출(featured) 글 우선, 없으면 최신 발행글로 채움
  const { data } = await supabase
    .from('blog_posts')
    .select('id, slug, title, excerpt, cover_image, category, tags, author_name, published_at, created_at, view_count')
    .eq('status', 'published')
    .order('is_featured', { ascending: false })
    .order('published_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .limit(3)
  return (data ?? []) as BlogPostCard[]
}

async function getHotBoardPosts() {
  const supabase = createPublicClient()
  const { data } = await supabase
    .from('board_posts')
    .select('id, type, title, author_name, view_count, created_at')
    .eq('is_private', false)
    .neq('type', 'inquiry')
    .order('view_count', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(4)
  return data ?? []
}

async function getRoiStats() {
  const supabase = createPublicClient()
  const [{ data: classPrices }, { data: priceDiffs }] = await Promise.all([
    supabase.from('classes').select('price').eq('status', 'published'),
    supabase.from('products').select('retail_price, wholesale_price').eq('is_active', true).not('wholesale_price', 'is', null),
  ])
  const prices = (classPrices ?? []).map((c: any) => c.price).filter(Boolean)
  const avgClassPrice = prices.length > 0
    ? Math.round(prices.reduce((a: number, b: number) => a + b, 0) / prices.length / 1000) * 1000
    : 50000
  const diffs = (priceDiffs ?? [])
    .map((p: any) => p.retail_price - (p.wholesale_price ?? 0))
    .filter((d: number) => d > 0)
  const avgSavings = diffs.length > 0
    ? Math.round(diffs.reduce((a: number, b: number) => a + b, 0) / diffs.length / 100) * 100
    : 0
  return { avgClassPrice, avgSavings }
}

const GENRE_ICONS: Record<string, string> = {
  resin:    '🫧',
  candle:   '🕯️',
  flower:   '🌸',
  ceramic:  '🏺',
  jewelry:  '💎',
  textile:  '🧵',
  painting: '🎨',
  craft:    '🪵',
}

const POST_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  notice:        { label: '공지',     color: 'bg-brand-deep text-white' },
  free:          { label: '자유',     color: 'bg-brand-mist/60 text-brand-grey' },
  class_request: { label: '클래스 요청', color: 'bg-brand-sage/20 text-brand-sage' },
  group_request: { label: '단체 문의',   color: 'bg-brand-amber/20 text-brand-ink' },
}

const certBenefits = [
  '오센틱아트 공식 인증 강사 자격 취득',
  '도매가 재료 구매 (시중가 대비 최대 40% 절감)',
  '플랫폼 내 강사 프로필 페이지 생성',
  '클래스 등록 및 수강생 모집',
  '강사 전용 교육 콘텐츠 무제한 열람',
]

const ugcFallback = [
  { emoji: '💎', label: '레진 코스터', color: 'from-cyan-100 to-blue-100' },
  { emoji: '🧦', label: '양말인형', color: 'from-pink-100 to-rose-100' },
  { emoji: '🕯️', label: '소이캔들', color: 'from-yellow-100 to-amber-100' },
  { emoji: '🌸', label: '프리저브드', color: 'from-purple-100 to-pink-100' },
  { emoji: '💍', label: '레진 주얼리', color: 'from-teal-100 to-cyan-100' },
  { emoji: '🎨', label: '아크릴 소품', color: 'from-green-100 to-emerald-100' },
]

const regions = ['전체', '서울', '인천', '강릉', '충주', '부산', '제주']

// 홈 FAQ — AI 검색(AEO)이 직접 인용하기 좋은 명료한 단답. 4개 타겟(수강생·강사·학교·판매자) 포괄.
const homeFaqs: { q: string; a: string }[] = [
  {
    q: '오센틱아트는 어떤 서비스인가요?',
    a: '오센틱아트는 레진아트·캔들·플라워·도자기·주얼리·자수·회화·목공예 등 전 장르 공예 클래스 예약, 강사 양성·인증, 작품 판매, 재료 도매를 한 곳에서 제공하는 공예 종합 플랫폼입니다.',
  },
  {
    q: '공예 원데이클래스는 어떻게 예약하나요?',
    a: '클래스 페이지에서 지역·장르로 검색해 강사·일정·가격을 비교하고 바로 예약할 수 있습니다. 서울·인천·강릉·충주·부산·제주 등 전국 클래스를 제공합니다.',
  },
  {
    q: '공예 강사가 되려면 자격증이 필요한가요?',
    a: '국가공인 자격증은 필수가 아닙니다. 포트폴리오와 강의 역량 심사를 통과하면 오센틱아트 인증 강사로 클래스를 개설할 수 있습니다.',
  },
  {
    q: '오센틱아트 강사 정산(수수료)은 어떻게 되나요?',
    a: 'PG 결제 수수료 3.3%와 플랫폼 수수료 10%를 합산한 13.3%만 공제하며, 강사가 결제액의 86.7%를 수령합니다. 클래스 등록에 별도 고정 비용은 없습니다.',
  },
  {
    q: '기업·학교 단체 공예 체험도 신청할 수 있나요?',
    a: '네. 10인 이상 단체 출강(기업 팀빌딩, 학교 방과후·자유학기제, 복지관 프로그램 등)을 전국 인증 강사로 연결합니다. 인원·장르·일정을 입력하면 맞춤 견적을 안내합니다.',
  },
  {
    q: '공예 재료는 어디서 구매하나요?',
    a: '강사 회원은 도매가로 재료를 구매할 수 있고, 공예 재료 판매자는 벤더로 입점해 강사·수강생에게 직접 판매할 수 있습니다.',
  },
]

const roleCards = [
  {
    icon: <BookOpen size={26} className="text-brand-amber" />,
    title: '배우기',
    desc: '공예 클래스를 예약하고 나만의 작품을 만들어보세요',
    cta: '클래스 예약',
    href: '/classes',
    color: 'from-brand-amber/10 to-brand-amber/5',
    border: 'border-brand-amber/20',
  },
  {
    icon: <Award size={26} className="text-brand-deep" />,
    title: '가르치기',
    desc: '인증 강사 자격을 취득하고 클래스를 개설하세요',
    cta: '강사 신청',
    href: '/signup/instructor',
    color: 'from-brand-deep/10 to-brand-deep/5',
    border: 'border-brand-deep/20',
  },
  {
    icon: <Palette size={26} className="text-brand-blush" />,
    title: '작품 팔기',
    desc: '내가 만든 작품을 마켓에 올리고 수익을 만드세요',
    cta: '작품 등록',
    href: '/my/artworks',
    color: 'from-brand-blush/20 to-brand-blush/5',
    border: 'border-brand-blush/20',
  },
  {
    icon: <Package size={26} className="text-brand-sage" />,
    title: '재료 구매',
    desc: '강사 도매가로 재료를 저렴하게 구매하세요',
    cta: '쇼핑하기',
    href: '/shop',
    color: 'from-brand-sage/15 to-brand-sage/5',
    border: 'border-brand-sage/20',
  },
]

export default async function HomePage() {
  const [
    classes,
    instructors,
    stats,
    artworks,
    genreCategories,
    vendors,
    products,
    boardPosts,
    blogPosts,
    roiStats,
  ] = await Promise.all([
    getFeaturedClasses(),
    getFeaturedInstructors(),
    getStats(),
    getFeaturedArtworks(),
    getGenreCategories(),
    getApprovedVendors(),
    getFeaturedProducts(),
    getHotBoardPosts(),
    getFeaturedBlogPosts(),
    getRoiStats(),
  ])

  const sessionRevenue = roiStats.avgClassPrice * 6
  const monthlyRevenue = sessionRevenue * 4

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.authenticart.co.kr'

  // ── 구조화 데이터(AEO): Organization + WebSite ──
  // AI 검색·생성형 엔진이 '오센틱아트'를 명확한 엔티티로 인식하도록 제공
  const orgLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: '오센틱아트',
    legalName: '주식회사 오센틱아트',
    alternateName: 'Authentic Art',
    url: siteUrl,
    logo: `${siteUrl}/logo/logo-light.png`,
    image: `${siteUrl}/logo/logo-light.png`,
    description:
      '레진아트·캔들·플라워·도자기·주얼리·자수·회화·목공예 전 장르 공예·예술 클래스 예약, 강사 자격 취득, 작품 판매, 재료 도매를 제공하는 종합 플랫폼.',
    slogan: '취미를 직업으로',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '공단로140번길 27, 군포LS R&D센터 819호',
      addressLocality: '군포시',
      addressRegion: '경기도',
      addressCountry: 'KR',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      email: 'contact@authenticart.co.kr',
      areaServed: 'KR',
      availableLanguage: ['Korean'],
    },
    identifier: {
      '@type': 'PropertyValue',
      name: '사업자등록번호',
      value: '102-81-47445',
    },
    sameAs: [
      'https://instagram.com/authentic_art.rs/',
      'https://cafe.naver.com/authenticart',
      'http://pf.kakao.com/_AaxjDxj',
    ],
    areaServed: ['서울', '인천', '강릉', '충주', '부산', '제주', '대한민국'],
    knowsAbout: ['레진아트', '캔들', '플라워', '도자기', '주얼리', '자수', '회화', '목공예', '공예 원데이클래스', '공예 강사 양성', '단체 공예 체험', '공예 재료 도매'],
  }
  const websiteLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: '오센틱아트',
    url: siteUrl,
    inLanguage: 'ko-KR',
    publisher: { '@type': 'Organization', name: '오센틱아트', url: siteUrl },
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: `${siteUrl}/classes?q={search_term_string}` },
      'query-input': 'required name=search_term_string',
    },
  }
  // FAQPage 구조화 데이터 — AI 검색이 답변을 직접 인용
  const faqLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: homeFaqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  }

  return (
    <div>
      <JsonLd data={[orgLd, websiteLd, faqLd]} />
      {/* ─── 1. Hero ─── */}
      <MarbleBackground className="bg-brand-deep min-h-[640px] flex items-center" opacity={0.12}>
        <div className="max-w-6xl mx-auto px-4 py-24 w-full">
          <div className="flex flex-col items-center text-center">
            <Image
              src="/logo/symbol-dark.png"
              alt="오센틱아트"
              width={88}
              height={106}
              className="object-contain mb-6 drop-shadow-lg"
              style={{ width: 88, height: 'auto' }}
              priority
            />
            <div className="flex items-center gap-2 mb-5">
              <Hexagon color="amber" size={13} rotate={15} />
              <span className="text-brand-blush text-xs font-medium tracking-[0.25em] uppercase">Authentic Art</span>
              <Hexagon color="amber" size={13} rotate={15} />
            </div>
            <h1 className="text-4xl md:text-6xl font-light text-white mb-5 leading-tight">
              취미였던 공예가<br />
              <em className="not-italic text-brand-amber font-semibold">나의 직업</em>이 됩니다
            </h1>
            <p className="text-brand-mist text-lg mb-3 leading-relaxed">
              배우고 · 자격 따고 · 수업 열고 · 수익까지
            </p>
            <p className="text-brand-mist/70 text-sm mb-10">
              대한민국 공예 강사들이 선택한 플랫폼
            </p>
            {/* 4-경로 CTA 그리드 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-xl mb-8">
              {[
                { label: '클래스 예약', href: '/classes', icon: '📚' },
                { label: '강사 신청', href: '/signup/instructor', icon: '🎓' },
                { label: '작품 마켓', href: '/artworks', icon: '🖼️' },
                { label: '재료 쇼핑', href: '/shop', icon: '🛒' },
              ].map(({ label, href, icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/15 hover:bg-white/20 hover:border-brand-amber/50 transition-all group"
                >
                  <span className="text-2xl">{icon}</span>
                  <span className="text-xs font-medium text-white/90 group-hover:text-brand-amber transition-colors">{label}</span>
                </Link>
              ))}
            </div>
            {/* 검색 */}
            <form action="/classes" method="GET" className="w-full max-w-md">
              <div className="flex items-center bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-4 py-3 gap-3 hover:bg-white/15 focus-within:bg-white/20 focus-within:border-white/40 transition-all">
                <Search size={16} className="text-brand-mist/60 flex-shrink-0" />
                <input
                  name="q"
                  type="text"
                  placeholder="레진아트, 캔들, 플라워... 클래스 검색"
                  className="flex-1 bg-transparent text-white placeholder:text-brand-mist/50 text-sm focus:outline-none"
                />
                <button
                  type="submit"
                  className="text-brand-amber text-sm font-semibold hover:text-brand-amber/80 transition-colors flex-shrink-0"
                >
                  검색
                </button>
              </div>
            </form>
          </div>
        </div>
      </MarbleBackground>

      <FlowLine className="mt-[-1px]" color="#BEC9C9" />

      {/* ─── 2. 신뢰 지표 바 (6개) ─── */}
      <section className="py-10 bg-white border-b border-brand-mist/20">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4 text-center">
            {[
              {
                num: stats.instructorCount > 0 ? `${stats.instructorCount}명` : '모집 중',
                label: '인증 강사',
                icon: <Award size={18} className="text-brand-amber mx-auto mb-1" />,
              },
              {
                num: stats.classCount > 0 ? `${stats.classCount}개` : '준비 중',
                label: '개설 클래스',
                icon: <BookOpen size={18} className="text-brand-deep mx-auto mb-1" />,
              },
              {
                num: stats.artworkCount > 0 ? `${stats.artworkCount}점` : '등록 중',
                label: '작품 마켓',
                icon: <Palette size={18} className="text-brand-blush mx-auto mb-1" />,
              },
              {
                num: stats.productCount > 0 ? `${stats.productCount}종` : '입고 중',
                label: '재료 상품',
                icon: <Package size={18} className="text-brand-sage mx-auto mb-1" />,
              },
              {
                num: '8개 장르',
                label: '공예·예술',
                icon: <MapPin size={18} className="text-brand-deep mx-auto mb-1" />,
              },
              {
                num: '최대 40%',
                label: '재료비 절감',
                icon: <TrendingUp size={18} className="text-brand-amber mx-auto mb-1" />,
              },
            ].map(({ num, label, icon }) => (
              <div key={label} className="py-3">
                {icon}
                <div className="text-xl font-bold text-brand-deep">{num}</div>
                <div className="text-xs text-brand-grey mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 3. 역할별 카드 ─── */}
      <section className="py-16 bg-brand-bg">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Hexagon color="amber" size={13} />
              <span className="text-xs font-medium text-brand-amber uppercase tracking-wider">What You Can Do</span>
            </div>
            <h2 className="text-3xl font-bold text-brand-ink">오센틱아트에서 무엇을 할 수 있나요?</h2>
            <p className="text-brand-grey text-sm mt-2">배우는 것부터 수익 내기까지, 한 플랫폼에서 모두 가능합니다</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {roleCards.map(({ icon, title, desc, cta, href, color, border }) => (
              <div
                key={title}
                className={`bg-gradient-to-br ${color} border ${border} rounded-2xl p-5 flex flex-col gap-3`}
              >
                <div className="w-11 h-11 rounded-xl bg-white/80 flex items-center justify-center shadow-sm">
                  {icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-brand-ink text-base mb-1">{title}</h3>
                  <p className="text-xs text-brand-grey leading-relaxed">{desc}</p>
                </div>
                <Link
                  href={href}
                  className="text-xs font-semibold text-brand-deep hover:text-brand-amber transition-colors"
                >
                  {cta} →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 4. 오센틱아트 배너 ─── */}
      <section className="py-10 bg-brand-deep">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                <Hexagon color="amber" size={12} rotate={10} />
                <span className="text-brand-amber text-xs font-semibold tracking-widest uppercase">Authentic Art</span>
                <Hexagon color="amber" size={12} rotate={10} />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-white mb-1">
                오센틱아트와 함께라면
              </h2>
              <p className="text-brand-mist text-sm md:text-base">
                공예 강사 자격 취득 · 클래스 오픈 · 작품 판매 · 재료 도매 — 한 플랫폼에서
              </p>
            </div>
            <div className="flex gap-3 flex-wrap justify-center md:justify-end">
              <Link href="/classes">
                <Button variant="accent" size="md">클래스 예약하기</Button>
              </Link>
              <Link href="/signup/instructor">
                <Button variant="outline" size="md" className="border-white text-white hover:bg-white hover:text-brand-deep">
                  강사 신청하기
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 5. 장르 탐색 ─── */}
      {genreCategories.length > 0 && (
        <section className="py-14 bg-brand-bg">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-8">
              <div className="flex items-center justify-center gap-2 mb-3">
                <Hexagon color="amber" size={13} />
                <span className="text-xs font-medium text-brand-amber uppercase tracking-wider">Explore by Genre</span>
              </div>
              <h2 className="text-2xl font-bold text-brand-ink">장르별 클래스 찾기</h2>
              <p className="text-brand-grey text-sm mt-1">내가 배우고 싶은 장르를 선택해보세요</p>
            </div>
            <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
              {(genreCategories as any[]).map((cat) => (
                <Link
                  key={cat.code}
                  href={`/classes?category=${cat.code}`}
                  className="flex flex-col items-center gap-2 py-4 px-2 rounded-2xl bg-white border border-brand-mist/30 hover:border-brand-amber hover:shadow-md transition-all group"
                >
                  <span className="text-3xl">{GENRE_ICONS[cat.code] ?? '✦'}</span>
                  <span className="text-xs font-medium text-brand-grey group-hover:text-brand-deep transition-colors text-center leading-tight">
                    {cat.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── 6. 클래스 ─── */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-end justify-between mb-10">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Hexagon color="amber" size={13} />
                <span className="text-xs font-medium text-brand-amber uppercase tracking-wider">Featured Classes</span>
              </div>
              <h2 className="text-3xl font-bold text-brand-ink">
                내 주변 클래스,{' '}
                <span className="text-brand-deep">지금 바로 예약</span>
              </h2>
            </div>
            <Link href="/classes" className="text-sm text-brand-grey hover:text-brand-deep transition-colors">
              전체 보기 →
            </Link>
          </div>
          <div className="flex gap-2 flex-wrap mb-8">
            {regions.map((r) => (
              <Link
                key={r}
                href={r === '전체' ? '/classes' : `/classes?region=${r}`}
                className="text-sm px-4 py-1.5 rounded-full border border-brand-mist/50 hover:border-brand-amber hover:bg-brand-amber/5 transition-all text-brand-grey hover:text-brand-ink"
              >
                {r}
              </Link>
            ))}
          </div>
          {classes.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {(classes as any[]).map((cls) => {
                const schedules = cls.class_schedules ?? []
                const minAvail = schedules.length > 0
                  ? Math.min(...schedules.map((s: any) => s.max_students - s.booked_count))
                  : undefined
                return (
                  <ClassCard
                    key={cls.id}
                    id={cls.id}
                    title={cls.title}
                    instructorName={cls.users?.name ?? '강사'}
                    region={cls.region}
                    price={cls.price}
                    thumbnail_url={cls.thumbnail_url}
                    confirmation_mode={cls.confirmation_mode as ConfirmationMode}
                    attributes={cls.attributes as ClassAttributes}
                    available_seats={minAvail}
                  />
                )
              })}
            </div>
          ) : (
            <div className="text-center py-16 text-brand-grey">
              <p className="text-lg mb-2">곧 클래스가 오픈됩니다</p>
              <p className="text-sm">강사 신청 후 첫 클래스를 등록해보세요</p>
            </div>
          )}
        </div>
      </section>

      {/* ─── 7. 작품 마켓 ─── */}
      <section className="py-16 md:py-24 bg-brand-bg">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-end justify-between mb-10">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Hexagon color="amber" size={13} />
                <span className="text-xs font-medium text-brand-amber uppercase tracking-wider">Artwork Market</span>
              </div>
              <h2 className="text-3xl font-bold text-brand-ink">
                "나도 이걸 만들 수 있어요"
              </h2>
              <p className="text-brand-grey text-sm mt-1">수강생들이 직접 만든 작품 · 구매도 가능해요</p>
            </div>
            <Link href="/artworks" className="text-sm text-brand-grey hover:text-brand-deep transition-colors">
              전체 보기 →
            </Link>
          </div>

          {artworks.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
              {(artworks as any[]).map((artwork) => (
                <Link
                  key={artwork.id}
                  href={`/artworks/${artwork.id}`}
                  className="group rounded-2xl overflow-hidden border border-brand-mist/20 hover:shadow-md transition-all bg-white"
                >
                  <div className="aspect-square relative bg-brand-mist/10">
                    {artwork.images?.[0] ? (
                      <img
                        src={artwork.images[0]}
                        alt={artwork.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-5xl">🎨</div>
                    )}
                    {artwork.status !== 'active' && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <span className="text-white text-sm font-semibold bg-black/60 px-3 py-1 rounded-full">판매 완료</span>
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-medium text-brand-ink line-clamp-1 group-hover:text-brand-deep transition-colors">
                      {artwork.title}
                    </p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-brand-grey">{(artwork.users as any)?.name}</span>
                      {artwork.price ? (
                        <span className="text-sm font-bold text-brand-deep">{formatPrice(artwork.price)}</span>
                      ) : (
                        <span className="text-xs text-brand-grey">비매품</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
              {ugcFallback.map(({ emoji, label, color }) => (
                <div
                  key={label}
                  className={`aspect-square rounded-2xl bg-gradient-to-br ${color} flex flex-col items-center justify-center gap-2 border border-brand-mist/20`}
                >
                  <span className="text-5xl">{emoji}</span>
                  <span className="text-sm font-medium text-brand-grey">{label}</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/artworks">
              <Button variant="primary" size="lg">작품 마켓 둘러보기 →</Button>
            </Link>
            <Link href="/my/artworks">
              <Button variant="outline" size="lg">내 작품 판매하기</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── 8. 강사 성공 스토리 ─── */}
      {instructors.length > 0 && (
        <section className="py-16 md:py-24 bg-brand-deep">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-12">
              <div className="flex items-center justify-center gap-2 mb-3">
                <Hexagon color="amber" size={13} rotate={20} />
                <span className="text-xs font-medium text-brand-amber uppercase tracking-wider">Success Stories</span>
              </div>
              <h2 className="text-3xl font-bold text-white">
                "저 사람처럼 될 수 있다"
              </h2>
              <p className="text-brand-mist mt-2">오센틱아트 인증 강사들의 실제 이야기</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              {(instructors as any[]).map((inst) => (
                <Link
                  key={inst.instructor_id}
                  href={`/instructors/${inst.instructor_id}`}
                  className="bg-white/10 backdrop-blur rounded-2xl p-6 border border-white/10 hover:bg-white/15 transition-all group"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-blush to-brand-amber overflow-hidden flex-shrink-0">
                      {inst.profile_image ? (
                        <img src={inst.profile_image} alt={inst.users?.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xl">👩‍🎨</div>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-white text-sm">{inst.users?.name}</p>
                      <p className="text-xs text-brand-mist">{inst.users?.region} · 인증 강사</p>
                    </div>
                  </div>
                  {inst.classCount > 0 && (
                    <div className="inline-flex items-center gap-1 bg-brand-amber/20 rounded-full px-2.5 py-1 mb-3">
                      <BookOpen size={11} className="text-brand-amber" />
                      <span className="text-xs text-brand-amber font-medium">클래스 {inst.classCount}개 운영 중</span>
                    </div>
                  )}
                  <div className="flex mb-3">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={13} className="text-brand-amber fill-brand-amber" />
                    ))}
                  </div>
                  <p className="text-brand-mist text-sm leading-relaxed line-clamp-3">
                    {inst.bio}
                  </p>
                </Link>
              ))}
            </div>
            <div className="text-center">
              <Link href="/signup/instructor">
                <Button variant="accent" size="lg">
                  나도 강사가 될 수 있을까? 자격 과정 알아보기 →
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ─── 9. 강사 자격증 ROI ─── */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Hexagon color="deep" size={13} />
                <span className="text-xs font-medium text-brand-deep uppercase tracking-wider">Certification</span>
              </div>
              <h2 className="text-3xl font-bold text-brand-ink mb-3">
                취미를 직업으로 바꾸는<br />
                <span className="text-brand-amber">첫 번째 자격증</span>
              </h2>
              <p className="text-brand-grey mb-6 leading-relaxed">
                교육비는 <strong className="text-brand-ink">비용이 아니라 투자</strong>입니다.<br />
                자격 취득 후 수업 몇 회면 회수됩니다.
              </p>
              <ul className="space-y-3 mb-8">
                {certBenefits.map((b) => (
                  <li key={b} className="flex items-start gap-2.5 text-sm text-brand-ink">
                    <CheckCircle2 size={16} className="text-brand-sage mt-0.5 flex-shrink-0" />
                    {b}
                  </li>
                ))}
              </ul>
              <div className="flex gap-3">
                <Link href="/signup/instructor">
                  <Button variant="primary" size="md">자격증 과정 자세히 보기</Button>
                </Link>
                <Link href="/signup/instructor">
                  <Button variant="outline" size="md">상담 신청하기</Button>
                </Link>
              </div>
            </div>
            <div className="bg-brand-bg rounded-2xl p-8 border border-brand-mist/30">
              <p className="text-sm font-semibold text-brand-grey uppercase tracking-wider mb-4">단순 계산</p>
              <div className="space-y-4">
                {[
                  {
                    label: `클래스 1회 (6명, 평균 수강료 ${formatPrice(roiStats.avgClassPrice)})`,
                    value: formatPrice(sessionRevenue),
                    positive: true,
                  },
                  {
                    label: '월 4회 진행 시 예상 수익',
                    value: formatPrice(monthlyRevenue),
                    positive: true,
                  },
                  {
                    label: '재료비 도매가 절감',
                    value: roiStats.avgSavings > 0 ? `상품당 평균 ${formatPrice(roiStats.avgSavings)}` : '시중가 대비 최대 40%',
                    positive: true,
                  },
                ].map(({ label, value, positive }) => (
                  <div key={label} className="flex justify-between items-center py-3 border-b border-brand-mist/30 last:border-0">
                    <span className="text-sm text-brand-grey">{label}</span>
                    <span className={`text-sm font-bold ${positive ? 'text-brand-deep' : 'text-brand-grey'}`}>
                      {value}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-brand-grey/60 mt-4">* 실제 수익은 수강생 수, 지역, 장르에 따라 달라집니다</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 10. 입점 스토어 ─── */}
      <section className="py-16 bg-brand-bg">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-end justify-between mb-10">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Hexagon color="deep" size={13} />
                <span className="text-xs font-medium text-brand-deep uppercase tracking-wider">Partner Stores</span>
              </div>
              <h2 className="text-3xl font-bold text-brand-ink">
                믿을 수 있는 브랜드,<br />
                <span className="text-brand-deep">입점 스토어</span>
              </h2>
            </div>
            <Link href="/shop/stores" className="text-sm text-brand-grey hover:text-brand-deep transition-colors">
              스토어 전체 보기 →
            </Link>
          </div>

          {vendors.length > 0 ? (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4 mb-8">
              {(vendors as any[]).map((v) => (
                <Link
                  key={v.id}
                  href={`/shop/stores/${v.id}`}
                  className="flex flex-col items-center gap-2 py-4 px-2 rounded-2xl bg-white border border-brand-mist/20 hover:border-brand-deep/30 hover:shadow-md transition-all group"
                >
                  <div className="w-12 h-12 rounded-xl bg-brand-bg overflow-hidden flex items-center justify-center">
                    {v.logo_url ? (
                      <img src={v.logo_url} alt={v.business_name} className="w-full h-full object-contain" />
                    ) : (
                      <Store size={22} className="text-brand-grey" />
                    )}
                  </div>
                  <span className="text-xs font-medium text-brand-grey group-hover:text-brand-deep transition-colors text-center leading-tight line-clamp-2">
                    {v.business_name}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
              {[
                { icon: <TrendingUp size={22} className="text-brand-amber" />, title: '추가 판로 확보', desc: '오센틱아트 수강생 · 강사 고객에게 직접 노출' },
                { icon: <Users size={22} className="text-brand-deep" />, title: '타겟 고객 직접 연결', desc: '공예 재료가 필요한 구매력 있는 고객층' },
                { icon: <Award size={22} className="text-brand-sage" />, title: '브랜드 신뢰도 향상', desc: '인증 플랫폼 입점으로 공신력 높이기' },
              ].map(({ icon, title, desc }) => (
                <div key={title} className="bg-white rounded-2xl p-6 border border-brand-mist/20">
                  <div className="w-10 h-10 rounded-xl bg-brand-bg flex items-center justify-center mb-3">
                    {icon}
                  </div>
                  <h3 className="font-semibold text-brand-ink mb-1">{title}</h3>
                  <p className="text-xs text-brand-grey leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/shop/stores">
              <Button variant="primary" size="md">스토어 둘러보기 →</Button>
            </Link>
            <Link href="/my/vendor/apply">
              <Button variant="outline" size="md">입점 신청하기</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── 11. 재료 쇼핑 ─── */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-end justify-between mb-10">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Hexagon color="deep" size={13} />
                <span className="text-xs font-medium text-brand-deep uppercase tracking-wider">Materials</span>
              </div>
              <h2 className="text-3xl font-bold text-brand-ink">
                재료비 걱정 없이,<br />
                <span className="text-brand-deep">더 많이 남기세요</span>
              </h2>
            </div>
            <Link href="/shop" className="text-sm text-brand-grey hover:text-brand-deep transition-colors">
              전체 보기 →
            </Link>
          </div>

          {products.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {(products as any[]).map((p) => (
                <Link
                  key={p.id}
                  href={`/shop/${p.id}`}
                  className="bg-brand-bg rounded-2xl overflow-hidden border border-brand-mist/20 hover:shadow-md transition-all group"
                >
                  <div className="aspect-square bg-brand-mist/10 relative">
                    {p.images?.[0] ? (
                      <img src={p.images[0]} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl">📦</div>
                    )}
                    {p.is_instructor_only && (
                      <span className="absolute top-2 right-2 text-xs bg-brand-amber text-brand-ink px-2 py-0.5 rounded-full font-medium">
                        강사 전용
                      </span>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-sm font-medium text-brand-ink line-clamp-2 group-hover:text-brand-deep transition-colors">
                      {p.name}
                    </p>
                    <p className="text-sm font-bold text-brand-deep mt-1">{formatPrice(p.retail_price)}</p>
                    {p.wholesale_price && (
                      <p className="text-xs text-brand-grey line-through">{formatPrice(p.wholesale_price)}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { emoji: '🧪', name: 'UV 레진', desc: '투명도 최상', badge: '준비 중' },
                { emoji: '🎨', name: '피그먼트 12색', desc: '펄 불투명 색소', badge: '' },
                { emoji: '💎', name: '실리콘 몰드', desc: '코스터 4구', badge: '' },
                { emoji: '🔆', name: 'UV 경화기', desc: '강사 전용 36W', badge: '강사 전용' },
              ].map(({ emoji, name, desc, badge }) => (
                <div
                  key={name}
                  className="bg-brand-bg rounded-2xl p-5 text-center border border-brand-mist/20 relative"
                >
                  {badge && (
                    <span className="absolute top-3 right-3 text-xs bg-brand-amber text-brand-ink px-2 py-0.5 rounded-full font-medium">
                      {badge}
                    </span>
                  )}
                  <div className="text-4xl mb-3">{emoji}</div>
                  <p className="font-semibold text-sm text-brand-ink">{name}</p>
                  <p className="text-xs text-brand-grey mt-1">{desc}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ─── 12. 커뮤니티 ─── */}
      <section className="py-16 bg-brand-bg">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-end justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Hexagon color="amber" size={13} />
                <span className="text-xs font-medium text-brand-amber uppercase tracking-wider">Community</span>
              </div>
              <h2 className="text-2xl font-bold text-brand-ink">함께 성장하는 커뮤니티</h2>
              <p className="text-brand-grey text-sm mt-1">공예 강사들의 이야기, 클래스 요청, 소식</p>
            </div>
            <Link href="/board" className="text-sm text-brand-grey hover:text-brand-deep transition-colors">
              게시판 가기 →
            </Link>
          </div>

          {boardPosts.length > 0 ? (
            <div className="bg-white rounded-2xl border border-brand-mist/20 overflow-hidden mb-6">
              {(boardPosts as any[]).map((post, idx) => {
                const typeInfo = POST_TYPE_LABELS[post.type] ?? { label: post.type, color: 'bg-brand-mist text-brand-grey' }
                return (
                  <Link
                    key={post.id}
                    href={`/board/${post.id}`}
                    className={`flex items-center gap-3 px-5 py-4 hover:bg-brand-bg transition-colors ${idx < boardPosts.length - 1 ? 'border-b border-brand-mist/20' : ''}`}
                  >
                    <span className={`flex-shrink-0 text-xs font-medium px-2.5 py-1 rounded-full ${typeInfo.color}`}>
                      {typeInfo.label}
                    </span>
                    <span className="flex-1 text-sm text-brand-ink line-clamp-1 font-medium">{post.title}</span>
                    <span className="flex-shrink-0 text-xs text-brand-grey">{post.author_name}</span>
                    <span className="flex-shrink-0 flex items-center gap-1 text-xs text-brand-grey/60">
                      <Eye size={12} />
                      {post.view_count}
                    </span>
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-brand-mist/20 p-8 text-center mb-6">
              <MessageCircle size={32} className="text-brand-mist mx-auto mb-3" />
              <p className="text-brand-grey text-sm">첫 번째 게시글을 작성해보세요</p>
            </div>
          )}

          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/board">
              <Button variant="primary" size="md">게시판 둘러보기</Button>
            </Link>
            <Link href="/board/new">
              <Button variant="outline" size="md">글 작성하기</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── 12.5 공예 매거진(블로그) ─── */}
      {blogPosts.length > 0 && (
        <section className="py-16 bg-white">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-end justify-between mb-10">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Hexagon color="amber" size={13} />
                  <span className="text-xs font-medium text-brand-amber uppercase tracking-wider">Magazine</span>
                </div>
                <h2 className="text-3xl font-bold text-brand-ink">
                  공예가 처음이라면,{' '}
                  <span className="text-brand-deep">여기서 시작하세요</span>
                </h2>
                <p className="text-brand-grey text-sm mt-1">입문 가이드 · 트렌드 · 강사들의 진짜 이야기</p>
              </div>
              <Link href="/blog" className="text-sm text-brand-grey hover:text-brand-deep transition-colors">
                매거진 전체 보기 →
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {blogPosts.map((p) => (
                <Link
                  key={p.id}
                  href={`/blog/${encodeURIComponent(p.slug)}`}
                  className="group bg-brand-bg rounded-2xl overflow-hidden border border-brand-mist/20 hover:shadow-md transition-all flex flex-col"
                >
                  <div className="aspect-[16/10] bg-brand-mist/10 relative overflow-hidden">
                    {p.cover_image ? (
                      <img
                        src={p.cover_image}
                        alt={p.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <BlogCover title={p.title} category={p.category} />
                    )}
                    {p.cover_image && (
                      <span className="absolute top-3 left-3 text-xs font-medium px-2.5 py-1 rounded-full bg-white/90 text-brand-deep backdrop-blur-sm">
                        {categoryLabel(p.category)}
                      </span>
                    )}
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="font-bold text-brand-ink leading-snug mb-2 line-clamp-2 group-hover:text-brand-deep transition-colors">
                      {p.title}
                    </h3>
                    {p.excerpt && (
                      <p className="text-xs text-brand-grey leading-relaxed line-clamp-2 flex-1">{p.excerpt}</p>
                    )}
                    <span className="text-xs text-brand-deep font-medium mt-3">자세히 읽기 →</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── 12.7 오센틱아트란? + 자주 묻는 질문 (AEO) ─── */}
      <section className="py-16 bg-white border-t border-brand-mist/20">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Hexagon color="amber" size={13} />
              <span className="text-xs font-medium text-brand-amber uppercase tracking-wider">About &amp; FAQ</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-brand-ink">오센틱아트는 어떤 플랫폼인가요?</h2>
          </div>

          {/* 정의형 단답 블록 — AI가 그대로 인용하기 좋은 사실 서술 */}
          <p className="text-center text-brand-grey leading-relaxed max-w-2xl mx-auto mb-10">
            <strong className="text-brand-ink">오센틱아트</strong>는 레진아트·캔들·플라워·도자기·주얼리·자수·회화·목공예 등
            전 장르 <strong className="text-brand-ink">공예 클래스 예약</strong>,
            <strong className="text-brand-ink"> 강사 양성·인증</strong>,
            <strong className="text-brand-ink"> 작품 판매</strong>,
            <strong className="text-brand-ink"> 재료 도매</strong>를 한 곳에서 제공하는 공예 종합 플랫폼입니다.
            서울·인천·강릉·충주·부산·제주 등 전국에서 운영되며, 슬로건은 <em className="not-italic text-brand-deep">"취미를 직업으로"</em>입니다.
          </p>

          {/* FAQ 아코디언 (네이티브 details — 서버 렌더링, JS 불필요) */}
          <div className="bg-brand-bg rounded-2xl border border-brand-mist/30 divide-y divide-brand-mist/30 overflow-hidden">
            {homeFaqs.map((f) => (
              <details key={f.q} className="group">
                <summary className="flex items-center justify-between gap-3 px-5 py-4 cursor-pointer list-none">
                  <span className="text-sm font-semibold text-brand-ink flex items-start gap-2">
                    <span className="text-brand-amber font-bold">Q.</span>
                    {f.q}
                  </span>
                  <span className="text-brand-grey group-open:rotate-180 transition-transform flex-shrink-0">⌄</span>
                </summary>
                <p className="px-5 pb-4 pl-11 text-sm text-brand-grey leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>

          <div className="text-center mt-6">
            <Link href="/faq" className="text-sm text-brand-deep font-medium hover:text-brand-amber transition-colors">
              전체 자주 묻는 질문 보기 →
            </Link>
          </div>
        </div>
      </section>

      {/* ─── 13. 단체 클래스 배너 ─── */}
      <section className="py-10 bg-gradient-to-r from-brand-sage to-brand-deep">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-5">
            <div className="text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2 mb-1">
                <Users size={16} className="text-white/80" />
                <span className="text-white/80 text-xs font-medium uppercase tracking-wider">Group Class</span>
              </div>
              <h3 className="text-xl font-bold text-white">단체 클래스 · 기업 문화 체험</h3>
              <p className="text-white/75 text-sm mt-1">10명 이상 단체 맞춤 공예 프로그램 문의를 받습니다</p>
            </div>
            <Link href="/board?tab=group_request" className="flex-shrink-0">
              <Button variant="accent" size="md">단체 문의하기 →</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── 14. 최종 CTA ─── */}
      <section className="py-16 md:py-24 bg-brand-deep">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-brand-amber/20 border border-brand-amber/40 text-brand-amber text-sm font-medium px-4 py-2 rounded-full mb-6">
            🎉 지금 첫 원데이클래스 체험 신청 시 우선 안내
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            배우고 벌고 성장하는<br />
            <span className="text-brand-amber">공예 생태계</span>에 함께하세요
          </h2>
          <p className="text-brand-mist text-lg mb-10 max-w-md mx-auto">
            오센틱아트 인증 강사만 누리는 특별 혜택.<br />
            지금 바로 시작하세요.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto">
            {[
              { label: '클래스 수강하기', href: '/classes', icon: '📚', desc: '원데이 체험 예약' },
              { label: '강사 신청하기', href: '/signup/instructor', icon: '🎓', desc: '인증 자격 취득' },
              { label: '작품 판매하기', href: '/my/artworks', icon: '🖼️', desc: '내 작품으로 수익' },
              { label: '재료 구매하기', href: '/shop', icon: '🛒', desc: '도매가로 절약' },
            ].map(({ label, href, icon, desc }) => (
              <Link
                key={href}
                href={href}
                className="flex flex-col items-center gap-2 py-5 px-3 rounded-2xl bg-white/10 border border-white/15 hover:bg-white/20 hover:border-brand-amber/50 transition-all group"
              >
                <span className="text-3xl">{icon}</span>
                <span className="text-xs font-bold text-white group-hover:text-brand-amber transition-colors">{label}</span>
                <span className="text-xs text-brand-mist/70">{desc}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <FloatingCTA />
    </div>
  )
}
