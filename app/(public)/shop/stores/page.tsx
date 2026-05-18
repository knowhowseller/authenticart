import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Hexagon from '@/components/brand/Hexagon'
import { Store, Package, ChevronRight, Mail, Users, Award } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '입점 스토어',
  description: '오센틱아트 공식 입점 공방·브랜드 스토어를 만나보세요. 레진아트·캔들·플라워·도자기·주얼리·자수 전문 재료를 직접 제조·공급하는 스토어들을 한곳에서 확인할 수 있습니다.',
  keywords: '공예 재료 스토어, 공방 입점, 레진아트 재료 브랜드, 캔들 재료 브랜드, 공예 전문몰, 공방 쇼핑',
  alternates: { canonical: '/shop/stores' },
  openGraph: {
    title: '공예 재료 입점 스토어 | 오센틱아트',
    description: '오센틱아트 공식 입점 공방·브랜드 스토어 목록',
    type: 'website',
  },
}

async function getVendors() {
  const supabase = await createClient()
  const { data: vendors } = await supabase
    .from('vendors')
    .select('id, business_name, description, logo_url, banner_url, slug, created_at')
    .eq('status', 'approved')
    .order('created_at', { ascending: false })

  if (!vendors || vendors.length === 0) return []

  const vendorIds = vendors.map((v: any) => v.id)
  const { data: productCounts } = await supabase
    .from('products')
    .select('vendor_id')
    .in('vendor_id', vendorIds)
    .eq('is_active', true)

  const countMap: Record<string, number> = {}
  ;(productCounts ?? []).forEach((p: any) => {
    countMap[p.vendor_id] = (countMap[p.vendor_id] ?? 0) + 1
  })

  return vendors.map((v: any) => ({ ...v, productCount: countMap[v.id] ?? 0 }))
}

export default async function StoresPage() {
  const vendors = await getVendors()

  return (
    <div className="min-h-screen bg-brand-bg">
      {/* 헤더 */}
      <div className="bg-white border-b border-brand-mist/30">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center gap-2 mb-2">
            <Hexagon color="sage" size={14} />
            <span className="text-xs font-medium text-brand-sage uppercase tracking-wider">Stores</span>
          </div>
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-3xl font-bold text-brand-ink">입점 스토어</h1>
              <p className="text-brand-grey text-sm mt-1">오센틱아트와 함께하는 공예 재료 전문 스토어</p>
            </div>
            <Link
              href="/my/vendor/apply"
              className="hidden md:flex items-center gap-2 px-4 py-2 bg-brand-deep text-white text-sm font-medium rounded-full hover:bg-brand-deep/90 transition-colors"
            >
              <Store size={14} />
              벤더 입점 신청
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-10">
        {vendors.length === 0 ? (
          /* 입점사 없을 때 */
          <>
          <div className="max-w-xl mx-auto text-center py-20">
            <div className="w-20 h-20 rounded-2xl bg-brand-deep/5 flex items-center justify-center mx-auto mb-6">
              <Store size={36} className="text-brand-deep/40" />
            </div>
            <h2 className="text-xl font-bold text-brand-ink mb-3">입점 스토어 준비 중</h2>
            <p className="text-brand-grey text-sm leading-relaxed mb-8">
              오센틱아트 입점 스토어가 곧 오픈됩니다.<br />
              공예 재료 전문 업체라면 지금 입점을 문의해보세요.
            </p>

            {/* 입점 혜택 */}
            <div className="grid grid-cols-3 gap-4 mb-8 text-left">
              {[
                { icon: '🏪', title: '전용 스토어', desc: '브랜드 스토어 페이지 제공' },
                { icon: '👩‍🎨', title: '강사 네트워크', desc: '수천 명 강사·수강생 고객' },
                { icon: '💰', title: '합리적 수수료', desc: '판매가의 15% 수수료' },
              ].map(({ icon, title, desc }) => (
                <div key={title} className="bg-white rounded-2xl p-4 shadow-sm border border-brand-mist/30 text-center">
                  <div className="text-2xl mb-2">{icon}</div>
                  <p className="text-sm font-semibold text-brand-ink mb-1">{title}</p>
                  <p className="text-xs text-brand-grey leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>

            <div className="flex gap-3 justify-center flex-wrap">
              <Link
                href="/my/vendor/apply"
                className="inline-flex items-center gap-2 px-6 py-3 bg-brand-deep text-white rounded-full text-sm font-semibold hover:bg-brand-deep/90 transition-colors"
              >
                <Store size={15} />
                벤더 입점 신청하기
              </Link>
              <Link
                href="mailto:authenticresinmaster@gmail.com?subject=입점 문의"
                className="inline-flex items-center gap-2 px-6 py-3 border border-brand-deep text-brand-deep rounded-full text-sm font-medium hover:bg-brand-deep/5 transition-colors"
              >
                <Mail size={15} />
                이메일 문의
              </Link>
            </div>
          </div>

          {/* 에이전시 신청 섹션 */}
          <div className="max-w-xl mx-auto mt-12 bg-brand-deep/5 border border-brand-deep/15 rounded-2xl p-8 text-center">
            <div className="w-14 h-14 rounded-xl bg-brand-deep/10 flex items-center justify-center mx-auto mb-4">
              <Users size={28} className="text-brand-deep/60" />
            </div>
            <h3 className="text-lg font-bold text-brand-ink mb-2">에이전시 파트너 신청</h3>
            <p className="text-sm text-brand-grey leading-relaxed mb-2">
              공방·스튜디오·에이전시 단위로 소속 강사를 모집하고<br />
              플랫폼에서 통합 관리할 수 있습니다.
            </p>
            <p className="text-xs text-brand-grey/70 mb-6">
              ※ 에이전시 신청은 오센틱아트 인증 강사만 가능합니다
            </p>
            <Link
              href="/studio/agency/apply"
              className="inline-flex items-center gap-2 px-6 py-3 bg-brand-amber text-brand-ink rounded-full text-sm font-semibold hover:bg-brand-amber/90 transition-colors"
            >
              <Award size={15} />
              에이전시 신청하기 (강사 전용)
            </Link>
          </div>
          </>
        ) : (
          <>
            <p className="text-sm text-brand-grey mb-6">
              총 <span className="font-semibold text-brand-ink">{vendors.length}개</span> 스토어
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {vendors.map((vendor: any) => (
                <Link
                  key={vendor.id}
                  href={`/shop/stores/${vendor.id}`}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm border border-brand-mist/30 hover:shadow-md hover:border-brand-sage/40 transition-all group"
                >
                  {/* 배너 */}
                  <div className="h-24 bg-gradient-to-r from-brand-deep/10 via-brand-sage/10 to-brand-mist/20 relative overflow-hidden">
                    {vendor.banner_url && (
                      <img src={vendor.banner_url} alt="" className="w-full h-full object-cover" />
                    )}
                    {/* 로고 */}
                    <div className="absolute bottom-0 left-5 translate-y-1/2 w-14 h-14 rounded-xl bg-white shadow-md border border-brand-mist/30 flex items-center justify-center overflow-hidden">
                      {vendor.logo_url ? (
                        <img src={vendor.logo_url} alt={vendor.business_name} className="w-full h-full object-contain p-1" />
                      ) : (
                        <Store size={22} className="text-brand-deep/40" />
                      )}
                    </div>
                  </div>

                  <div className="pt-10 pb-5 px-5">
                    <h3 className="font-bold text-brand-ink group-hover:text-brand-deep transition-colors">
                      {vendor.business_name}
                    </h3>
                    {vendor.description && (
                      <p className="text-xs text-brand-grey mt-1 line-clamp-2 leading-relaxed">
                        {vendor.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between mt-4">
                      <div className="flex items-center gap-1 text-xs text-brand-grey">
                        <Package size={12} />
                        상품 {vendor.productCount}개
                      </div>
                      <span className="flex items-center gap-0.5 text-xs font-medium text-brand-deep group-hover:gap-1.5 transition-all">
                        스토어 보기 <ChevronRight size={13} />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {/* 하단 입점/에이전시 배너 */}
            <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="bg-brand-deep rounded-2xl p-6 text-white">
                <Store size={22} className="text-brand-amber mb-3" />
                <p className="font-bold mb-1">공예 재료 전문 업체이신가요?</p>
                <p className="text-sm text-brand-mist/80 mb-4">오센틱아트 입점으로 강사·수강생 고객을 만나보세요</p>
                <div className="flex gap-2 flex-wrap">
                  <Link
                    href="/my/vendor/apply"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-amber text-brand-ink text-sm font-bold rounded-full hover:bg-brand-amber/90 transition-colors"
                  >
                    <Store size={13} />
                    벤더 신청하기
                  </Link>
                  <Link
                    href="mailto:authenticresinmaster@gmail.com?subject=입점 문의"
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-white/10 text-white text-sm font-medium rounded-full hover:bg-white/20 transition-colors"
                  >
                    <Mail size={13} />
                    이메일 문의
                  </Link>
                </div>
              </div>
              <div className="bg-brand-deep/10 border border-brand-deep/20 rounded-2xl p-6">
                <Users size={22} className="text-brand-deep mb-3" />
                <p className="font-bold text-brand-ink mb-1">에이전시 파트너 신청</p>
                <p className="text-sm text-brand-grey mb-4">공방·스튜디오·에이전시 단위로 강사를 모집하고 통합 관리하세요</p>
                <Link
                  href="/studio/agency/apply"
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-deep text-white text-sm font-bold rounded-full hover:bg-brand-deep/90 transition-colors"
                >
                  <Award size={13} />
                  에이전시 신청 (강사 전용)
                </Link>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
