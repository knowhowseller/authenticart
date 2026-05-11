export const dynamic = 'force-dynamic'

import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import MarbleBackground from '@/components/brand/MarbleBackground'
import FlowLine from '@/components/brand/FlowLine'
import Hexagon from '@/components/brand/Hexagon'
import ClassCard from '@/components/class/ClassCard'
import Button from '@/components/ui/Button'
import FloatingCTA from '@/components/home/FloatingCTA'
import { MapPin, Star, CheckCircle2, TrendingUp, Award, ShoppingBag } from 'lucide-react'
import type { ClassAttributes, ConfirmationMode } from '@/types/database'

async function getFeaturedClasses() {
  const supabase = await createClient()
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

async function getFeaturedInstructors() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('instructor_profiles')
    .select('instructor_id, bio, profile_image, users!instructor_id(name, region)')
    .eq('status', 'approved')
    .limit(3)
  return data ?? []
}

async function getStats() {
  const supabase = await createClient()
  const [{ count: instructorCount }, { count: classCount }] = await Promise.all([
    supabase.from('instructor_profiles').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
    supabase.from('classes').select('*', { count: 'exact', head: true }).eq('status', 'published'),
  ])
  return { instructorCount: instructorCount ?? 0, classCount: classCount ?? 0 }
}

const personas = [
  {
    emoji: '💼',
    name: '직장인 김○○ 씨',
    quote: '"취미로 배운 공예로\n부업 수익 내고 싶어"',
    cta: '강사 과정 보러 가기',
    href: '/signup/instructor',
    color: 'from-brand-blush/40 to-brand-amber/10',
  },
  {
    emoji: '🏠',
    name: '주부 이○○ 씨',
    quote: '"아이 키우며 할 수 있는\n수익 활동 찾아"',
    cta: '원데이클래스 예약하기',
    href: '/classes',
    color: 'from-brand-mist/40 to-brand-sage/20',
  },
  {
    emoji: '🏪',
    name: '공방 운영 박○○',
    quote: '"재료를 어디서 싸게\n구하나 고민했어요"',
    cta: '강사 인증 도매가 보기',
    href: '/shop',
    color: 'from-brand-sage/30 to-brand-deep/10',
  },
]

const certBenefits = [
  '오센틱아트 공식 인증 강사 자격 취득',
  '도매가 재료 구매 (시중가 대비 최대 40% 절감)',
  '플랫폼 내 강사 프로필 페이지 생성',
  '클래스 등록 및 수강생 모집',
  '강사 전용 교육 콘텐츠 무제한 열람',
]

const regions = ['전체', '서울', '인천', '강릉', '충주', '부산', '제주']

const ugcItems = [
  { emoji: '💎', label: '레진 코스터', color: 'from-cyan-100 to-blue-100' },
  { emoji: '🧦', label: '양말인형', color: 'from-pink-100 to-rose-100' },
  { emoji: '🕯️', label: '소이캔들', color: 'from-yellow-100 to-amber-100' },
  { emoji: '🌸', label: '프리저브드', color: 'from-purple-100 to-pink-100' },
  { emoji: '💍', label: '레진 주얼리', color: 'from-teal-100 to-cyan-100' },
  { emoji: '🎨', label: '아크릴 소품', color: 'from-green-100 to-emerald-100' },
]

export default async function HomePage() {
  const [classes, instructors, stats] = await Promise.all([
    getFeaturedClasses(),
    getFeaturedInstructors(),
    getStats(),
  ])

  return (
    <div>
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
            <div className="flex gap-3 flex-wrap justify-center">
              <Link href="/classes">
                <Button variant="accent" size="lg">클래스 체험 예약하기 →</Button>
              </Link>
              <Link href="/signup/instructor">
                <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-brand-deep">
                  강사로 시작하기 →
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </MarbleBackground>

      <FlowLine className="mt-[-1px]" color="#BEC9C9" />

      {/* ─── 2. 신뢰 지표 바 ─── */}
      <section className="py-10 bg-white border-b border-brand-mist/20">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { num: stats.instructorCount > 0 ? `${stats.instructorCount}명` : '함께 시작 중', label: '인증 강사', icon: <Award size={20} className="text-brand-amber mx-auto mb-1" /> },
              { num: stats.classCount > 0 ? `${stats.classCount}개` : '오픈 준비 중', label: '개설 클래스', icon: <CheckCircle2 size={20} className="text-brand-sage mx-auto mb-1" /> },
              { num: '6개 지역', label: '운영 지역', icon: <MapPin size={20} className="text-brand-deep mx-auto mb-1" /> },
              { num: '40% 절감', label: '도매가 재료비', icon: <TrendingUp size={20} className="text-brand-amber mx-auto mb-1" /> },
            ].map(({ num, label, icon }) => (
              <div key={label} className="py-4">
                {icon}
                <div className="text-2xl font-bold text-brand-deep">{num}</div>
                <div className="text-sm text-brand-grey mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 3. 공감 스토리 ─── */}
      <section className="py-16 md:py-24 bg-brand-bg">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Hexagon color="amber" size={13} />
              <span className="text-xs font-medium text-brand-amber uppercase tracking-wider">Your Story</span>
            </div>
            <h2 className="text-3xl font-bold text-brand-ink">당신의 이야기입니까?</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {personas.map(({ emoji, name, quote, cta, href, color }) => (
              <div key={name} className={`bg-gradient-to-br ${color} rounded-2xl p-6 border border-brand-mist/20 flex flex-col`}>
                <div className="text-4xl mb-4">{emoji}</div>
                <p className="text-xs text-brand-grey font-medium mb-2">{name}</p>
                <p className="text-brand-ink font-medium leading-relaxed flex-1 whitespace-pre-line mb-5">
                  {quote}
                </p>
                <Link
                  href={href}
                  className="inline-flex items-center text-sm font-semibold text-brand-deep hover:text-brand-amber transition-colors"
                >
                  {cta} →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 4. 클래스 (잔여 좌석 + 긴급성) ─── */}
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

          {/* 지역 필터 탭 */}
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

      {/* ─── 5. 강사 성공 스토리 ─── */}
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
              {(instructors as any[]).map((inst, i) => (
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

      {/* ─── 6. 강사 자격증 ROI ─── */}
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
                  { label: '클래스 1회 (6명, 수강료 5만원)', value: '월 수익 30만원', positive: true },
                  { label: '재료비 도매가 절감분', value: '월 절약 OO만원', positive: true },
                  { label: '수업 OO회면', value: '자격증 비용 회수', positive: true },
                ].map(({ label, value, positive }) => (
                  <div key={label} className="flex justify-between items-center py-3 border-b border-brand-mist/30 last:border-0">
                    <span className="text-sm text-brand-grey">{label}</span>
                    <span className={`text-sm font-bold ${positive ? 'text-brand-deep' : 'text-brand-grey'}`}>
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── 7. UGC 갤러리 ─── */}
      <section className="py-16 md:py-24 bg-brand-bg">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Hexagon color="amber" size={13} />
              <span className="text-xs font-medium text-brand-amber uppercase tracking-wider">Gallery</span>
            </div>
            <h2 className="text-3xl font-bold text-brand-ink">"나도 이걸 만들 수 있어요"</h2>
            <p className="text-brand-grey mt-2">수강생들이 직접 만든 작품들</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            {ugcItems.map(({ emoji, label, color }) => (
              <div
                key={label}
                className={`aspect-square rounded-2xl bg-gradient-to-br ${color} flex flex-col items-center justify-center gap-2 border border-brand-mist/20 hover:scale-[1.02] transition-transform cursor-pointer`}
              >
                <span className="text-5xl">{emoji}</span>
                <span className="text-sm font-medium text-brand-grey">{label}</span>
              </div>
            ))}
          </div>
          <div className="text-center">
            <Link href="/classes">
              <Button variant="primary" size="lg">클래스 체험하기 →</Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── 8. 재료 쇼핑 ─── */}
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { emoji: '🧪', name: 'UV 레진', desc: '투명도 최상', badge: '베스트' },
              { emoji: '🎨', name: '피그먼트 12색', desc: '펄 불투명 색소', badge: '신상' },
              { emoji: '💎', name: '실리콘 몰드', desc: '코스터 4구', badge: '' },
              { emoji: '🔆', name: 'UV 경화기', desc: '강사 전용 36W', badge: '강사 전용' },
            ].map(({ emoji, name, desc, badge }) => (
              <Link
                key={name}
                href="/shop"
                className="bg-brand-bg rounded-2xl p-5 text-center hover:shadow-md transition-all border border-brand-mist/20 group relative"
              >
                {badge && (
                  <span className="absolute top-3 right-3 text-xs bg-brand-amber text-brand-ink px-2 py-0.5 rounded-full font-medium">
                    {badge}
                  </span>
                )}
                <div className="text-4xl mb-3">{emoji}</div>
                <p className="font-semibold text-sm text-brand-ink group-hover:text-brand-deep transition-colors">{name}</p>
                <p className="text-xs text-brand-grey mt-1">{desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── 9. 긴급 배너 + CTA ─── */}
      <section className="py-16 md:py-24 bg-brand-deep">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-brand-amber/20 border border-brand-amber/40 text-brand-amber text-sm font-medium px-4 py-2 rounded-full mb-6">
            🎉 지금 첫 원데이클래스 체험 신청 시 우선 안내
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            배우고 벌고 성장하는<br />
            <span className="text-brand-amber">공예 생태계</span>에 함께하세요
          </h2>
          <p className="text-brand-mist text-lg mb-8 max-w-md mx-auto">
            오센틱아트 인증 강사만 누리는 특별 혜택.<br />
            지금 바로 시작하세요.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link href="/classes">
              <Button variant="accent" size="lg">단 하루, 평생 기억에 남는 나만의 작품 →</Button>
            </Link>
            <Link href="/signup/instructor">
              <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-brand-deep">
                강사 신청하기
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <FloatingCTA />
    </div>
  )
}
