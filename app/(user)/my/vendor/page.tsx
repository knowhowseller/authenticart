import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatPrice, formatDateTime } from '@/lib/utils/format'
import Hexagon from '@/components/brand/Hexagon'
import { Package, TrendingUp, Clock, CheckCircle2 } from 'lucide-react'
import VendorAccountForm from './VendorAccountForm'
import VendorProfileForm from './VendorProfileForm'
import VendorBulkUpload from './VendorBulkUpload'

export const metadata = { title: '벤더 대시보드 | 오센틱아트' }

const statusLabel: Record<string, string> = {
  pending:   '심사 중',
  approved:  '승인됨',
  rejected:  '반려됨',
  suspended: '정지됨',
}
const statusColor: Record<string, string> = {
  pending:   'bg-yellow-50 text-yellow-600 border-yellow-200',
  approved:  'bg-green-50 text-green-600 border-green-200',
  rejected:  'bg-red-50 text-red-500 border-red-200',
  suspended: 'bg-gray-100 text-gray-500 border-gray-200',
}

export default async function VendorDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: vendor } = await supabase
    .from('vendors')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!vendor) redirect('/my/vendor/apply')

  const [{ data: products }, { data: payouts }] = await Promise.all([
    supabase
      .from('products')
      .select('id, name, retail_price, stock_qty, is_active')
      .eq('vendor_id', vendor.id)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('vendor_payouts')
      .select('*')
      .eq('vendor_id', vendor.id)
      .order('period_year', { ascending: false })
      .order('period_month', { ascending: false })
      .limit(6),
  ])

  const totalPayout = (payouts ?? []).filter((p: any) => p.status === 'paid')
    .reduce((s: number, p: any) => s + p.payout_amount, 0)

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-2">
          <Hexagon color="amber" size={14} />
          <span className="text-xs font-medium text-brand-amber uppercase tracking-wider">Vendor</span>
        </div>
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-brand-ink">{vendor.business_name}</h1>
            <p className="text-sm text-brand-grey mt-0.5">수수료 {vendor.commission_rate}%</p>
          </div>
          <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${statusColor[vendor.status]}`}>
            {statusLabel[vendor.status]}
          </span>
        </div>

        {vendor.status === 'pending' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6 text-sm text-yellow-700">
            <p className="font-semibold mb-1">⏳ 심사 진행 중</p>
            <p>관리자가 입점 신청을 검토 중입니다. 보통 2~3 영업일 내 결과를 이메일로 안내드립니다.</p>
          </div>
        )}
        {vendor.status === 'rejected' && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-sm text-red-700">
            <p className="font-semibold mb-1">❌ 반려됨</p>
            <p>{vendor.rejection_reason ?? '관리자에게 문의해주세요.'}</p>
          </div>
        )}

        {/* KPI */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: '등록 상품', value: `${(products ?? []).length}개`, icon: Package, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: '누적 정산액', value: formatPrice(totalPayout), icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
            { label: '대기 정산', value: formatPrice((payouts ?? []).filter((p: any) => p.status === 'pending').reduce((s: number, p: any) => s + p.payout_amount, 0)), icon: Clock, color: 'text-brand-amber', bg: 'bg-brand-amber/10' },
          ].map(k => (
            <div key={k.label} className="bg-white rounded-2xl p-5 shadow-sm border border-brand-mist/30">
              <div className={`w-9 h-9 rounded-xl ${k.bg} flex items-center justify-center mb-3`}>
                <k.icon size={16} className={k.color} />
              </div>
              <p className="text-xs text-brand-grey">{k.label}</p>
              <p className="text-lg font-bold text-brand-ink">{k.value}</p>
            </div>
          ))}
        </div>

        {/* 빠른 메뉴 */}
        {vendor.status === 'approved' && (
          <div className="grid grid-cols-2 gap-3 mb-6">
            <Link href="/my/vendor/orders"
              className="bg-white rounded-2xl p-4 shadow-sm border border-brand-mist/30 hover:border-brand-deep/30 transition-all flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
                <Package size={16} className="text-orange-500" />
              </div>
              <div>
                <p className="text-sm font-semibold text-brand-ink">주문 관리</p>
                <p className="text-xs text-brand-grey">배송·상태 처리</p>
              </div>
            </Link>
            <Link href="/my/vendor/products/new"
              className="bg-white rounded-2xl p-4 shadow-sm border border-brand-mist/30 hover:border-brand-deep/30 transition-all flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-brand-deep/10 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 size={16} className="text-brand-deep" />
              </div>
              <div>
                <p className="text-sm font-semibold text-brand-ink">상품 등록</p>
                <p className="text-xs text-brand-grey">새 상품 추가</p>
              </div>
            </Link>
          </div>
        )}

        {/* 상품 목록 */}
        {vendor.status === 'approved' && (
          <div className="bg-white rounded-2xl shadow-sm border border-brand-mist/30 mb-6">
            <div className="flex items-center justify-between px-5 py-4 border-b border-brand-mist/20">
              <span className="text-sm font-semibold text-brand-ink">등록 상품</span>
              <Link href="/my/vendor/products/new" className="text-xs text-brand-deep hover:underline">+ 상품 등록</Link>
            </div>
            {(products ?? []).length === 0 ? (
              <p className="text-xs text-brand-grey text-center py-8">등록된 상품이 없습니다</p>
            ) : (
              <div className="divide-y divide-brand-mist/20">
                {(products as any[]).map(p => (
                  <div key={p.id} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <p className="text-sm font-medium text-brand-ink">{p.name}</p>
                      <p className="text-xs text-brand-grey">{formatPrice(p.retail_price)} · 재고 {p.stock_qty}개</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${p.is_active ? 'bg-green-50 text-green-600 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
                        {p.is_active ? '판매 중' : '비활성'}
                      </span>
                      <Link href={`/my/vendor/products/${p.id}/edit`}
                        className="text-xs text-brand-deep hover:underline px-2 py-0.5 rounded border border-brand-deep/20 hover:bg-brand-deep/5 transition-colors">
                        수정
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 스토어 프로필 */}
        {vendor.status === 'approved' && (
          <VendorProfileForm
            vendorId={vendor.id}
            current={{
              logo_url: vendor.logo_url ?? null,
              banner_url: vendor.banner_url ?? null,
              description: vendor.description ?? null,
              website_url: vendor.website_url ?? null,
            }}
          />
        )}

        {/* 엑셀 일괄 등록 */}
        {vendor.status === 'approved' && (
          <VendorBulkUpload />
        )}

        {/* 정산 계좌 */}
        <VendorAccountForm current={vendor.payout_account ?? null} />

        {/* 정산 내역 */}
        <div className="bg-white rounded-2xl shadow-sm border border-brand-mist/30">
          <div className="px-5 py-4 border-b border-brand-mist/20">
            <span className="text-sm font-semibold text-brand-ink">정산 내역</span>
          </div>
          {(payouts ?? []).length === 0 ? (
            <p className="text-xs text-brand-grey text-center py-8">정산 내역이 없습니다</p>
          ) : (
            <div className="divide-y divide-brand-mist/20">
              {(payouts as any[]).map(p => (
                <div key={p.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-medium text-brand-ink">{p.period_year}년 {p.period_month}월</p>
                    <p className="text-xs text-brand-grey">주문 {p.order_count}건 · 플랫폼 수수료 {formatPrice(p.platform_fee)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-brand-deep">{formatPrice(p.payout_amount)}</p>
                    <span className={`text-xs px-1.5 py-0.5 rounded-full border ${p.status === 'paid' ? 'bg-green-50 text-green-600 border-green-200' : 'bg-yellow-50 text-yellow-600 border-yellow-200'}`}>
                      {p.status === 'paid' ? '지급 완료' : '대기'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
