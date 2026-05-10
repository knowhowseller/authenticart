export const dynamic = 'force-dynamic'

import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import MarbleBackground from '@/components/brand/MarbleBackground'
import FlowLine from '@/components/brand/FlowLine'
import Hexagon from '@/components/brand/Hexagon'
import ClassCard from '@/components/class/ClassCard'
import Button from '@/components/ui/Button'
import type { ClassAttributes, ConfirmationMode } from '@/types/database'

async function getFeaturedClasses() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('classes')
    .select(`id, title, region, price, thumbnail_url, confirmation_mode, attributes, users!instructor_id(name)`)
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
    .limit(4)
  return data ?? []
}

const crafts = [
  { label: '레진아트', icon: '💎', query: 'resin' },
  { label: '양말인형', icon: '🧦', query: 'doll' },
  { label: '도자기', icon: '🏺', query: 'ceramic' },
  { label: '캘리그라피', icon: '✍️', query: 'calligraphy' },
  { label: '캔들', icon: '🕯️', query: 'candle' },
  { label: '프리저브드', icon: '🌸', query: 'preserved' },
]

const brandPoints = [
  { icon: '⬡', title: '점 (Point)', desc: 'Amber 육각형이 산재하는 공간. 레진 재료의 반짝임을 담았습니다.' },
  { icon: '〰', title: '선 (Line)', desc: '펜으로 그린 듯한 자유 곡선. 클래스의 흐름과 연결을 표현합니다.' },
  { icon: '▭', title: '면 (Plane)', desc: '대리석 텍스처와 잉크 플로우. 예술적 깊이를 만들어냅니다.' },
]

export default async function HomePage() {
  const [classes, instructors] = await Promise.all([
    getFeaturedClasses(),
    getFeaturedInstructors(),
  ])

  return (
    <div>
      {/* Hero */}
      <MarbleBackground className="bg-brand-deep min-h-[600px] flex items-center" opacity={0.15}>
        <div className="max-w-6xl mx-auto px-4 py-24 w-full">
          <div className="flex flex-col items-center text-center">
            {/* 로고 심볼 */}
            <Image
              src="/logo/symbol-dark.png"
              alt="오센틱아트"
              width={96}
              height={116}
              className="object-contain mb-6 drop-shadow-lg"
              style={{ width: 96, height: 'auto' }}
              priority
            />
            <div className="flex items-center gap-2 mb-4">
              <Hexagon color="amber" size={14} rotate={15} />
              <span className="text-brand-blush text-xs font-medium tracking-[0.25em] uppercase">Authentic Art</span>
              <Hexagon color="amber" size={14} rotate={15} />
            </div>
            <h1 className="text-5xl md:text-6xl font-light text-white mb-4 leading-tight">
              Starting a{' '}
              <em className="not-italic text-brand-amber">second life</em>
              <br />
              with Art.
            </h1>
            <p className="text-brand-mist text-lg mb-8 leading-relaxed max-w-md">
              예술로 시작하는 새로운 삶.<br />
              강사와 수강생이 만나는 예술 생태계.
            </p>
            <div className="flex gap-3 flex-wrap justify-center">
              <Link href="/classes">
                <Button variant="accent" size="lg">클래스 둘러보기</Button>
              </Link>
              <Link href="/shop">
                <Button variant="outline" size="lg" className="border-white text-white hover:bg-white hover:text-brand-deep">
                  재료 쇼핑
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </MarbleBackground>

      <FlowLine className="mt-[-1px]" color="#BEC9C9" />

      {/* 카테고리 칩 */}
      <section className="py-12 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-wrap gap-3 justify-center">
            {crafts.map(({ label, icon, query }) => (
              <Link
                key={query}
                href={`/classes?craft=${query}`}
                className="flex items-center gap-2 px-4 py-2.5 rounded-full border border-brand-mist/50 bg-white hover:border-brand-amber hover:bg-brand-amber/5 transition-all group"
              >
                <Hexagon color="amber" size={16} className="opacity-60 group-hover:opacity-100" />
                <span className="text-sm font-medium text-brand-ink">{icon} {label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 인기 클래스 */}
      <section className="py-16 md:py-24 bg-brand-bg">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-end justify-between mb-10">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Hexagon color="amber" size={14} />
                <span className="text-xs font-medium text-brand-amber uppercase tracking-wider">Featured Classes</span>
              </div>
              <h2 className="text-3xl font-bold text-brand-ink">인기 클래스</h2>
            </div>
            <Link href="/classes" className="text-sm text-brand-grey hover:text-brand-deep transition-colors">
              전체 보기 →
            </Link>
          </div>

          {classes.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {(classes as any[]).map((cls) => (
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
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-brand-grey">
              <p className="text-lg mb-2">곧 클래스가 오픈됩니다</p>
              <p className="text-sm">강사 신청 후 첫 클래스를 등록해보세요</p>
            </div>
          )}
        </div>
      </section>

      {/* 브랜드 스토리 */}
      <section className="py-16 md:py-24 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-brand-ink mb-3">오센틱아트의 시각 언어</h2>
            <p className="text-brand-grey">점·선·면으로 표현하는 예술적 세계관</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {brandPoints.map(({ icon, title, desc }) => (
              <div key={title} className="text-center p-6 rounded-2xl bg-brand-bg border border-brand-mist/30">
                <div className="text-4xl mb-4 text-brand-sage">{icon}</div>
                <h3 className="text-lg font-semibold text-brand-ink mb-2">{title}</h3>
                <p className="text-sm text-brand-grey leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 강사 소개 */}
      {instructors.length > 0 && (
        <section className="py-16 md:py-24 bg-brand-bg">
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-end justify-between mb-10">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Hexagon color="deep" size={14} />
                  <span className="text-xs font-medium text-brand-deep uppercase tracking-wider">Our Instructors</span>
                </div>
                <h2 className="text-3xl font-bold text-brand-ink">강사 소개</h2>
              </div>
              <Link href="/instructors" className="text-sm text-brand-grey hover:text-brand-deep transition-colors">
                전체 보기 →
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {(instructors as any[]).map((inst) => (
                <Link
                  key={inst.instructor_id}
                  href={`/instructors/${inst.instructor_id}`}
                  className="bg-white rounded-2xl p-5 text-center shadow-sm border border-brand-mist/30 hover:shadow-md transition-all group"
                >
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-brand-blush to-brand-mist mx-auto mb-3 overflow-hidden">
                    {inst.profile_image ? (
                      <img src={inst.profile_image} alt={inst.users?.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">👩‍🎨</div>
                    )}
                  </div>
                  <p className="font-semibold text-brand-ink text-sm group-hover:text-brand-deep transition-colors">
                    {inst.users?.name}
                  </p>
                  {inst.users?.region && (
                    <p className="text-xs text-brand-grey mt-0.5">{inst.users.region}</p>
                  )}
                  {inst.bio && (
                    <p className="text-xs text-brand-grey mt-2 line-clamp-2 leading-relaxed">{inst.bio}</p>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA */}
      <section className="py-16 md:py-24 bg-brand-deep">
        <div className="max-w-6xl mx-auto px-4 text-center">
          <Hexagon color="amber" size={32} className="mx-auto mb-6" rotate={20} />
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            강사로 제2의 삶을 시작하세요
          </h2>
          <p className="text-brand-mist text-lg mb-8 max-w-md mx-auto">
            클래스를 열고, 도매가로 재료를 구매하고,<br />매월 정산 받으세요.
          </p>
          <Link href="/signup/instructor">
            <Button variant="accent" size="lg">강사 신청하기</Button>
          </Link>
        </div>
      </section>
    </div>
  )
}
