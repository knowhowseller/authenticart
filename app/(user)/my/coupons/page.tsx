import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Hexagon from '@/components/brand/Hexagon'
import { Tag, CheckCircle } from 'lucide-react'
import { formatPrice } from '@/lib/utils/format'

export default async function MyCouponsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const now = new Date().toISOString()
  const [{ data: usedCoupons }, { data: personalCoupons }, { data: publicCoupons }] = await Promise.all([
    supabase
      .from('coupon_uses')
      .select(`
        id, discount_amount, used_at,
        coupons!coupon_id(code, type, value, description)
      `)
      .eq('user_id', user.id)
      .order('used_at', { ascending: false }),
    supabase
      .from('coupons')
      .select('id, code, type, value, min_amount, max_uses, used_count, valid_until, description')
      .eq('is_active', true)
      .eq('target_user_id', user.id)
      .or(`valid_until.is.null,valid_until.gt.${now}`),
    supabase
      .from('coupons')
      .select('id, code, type, value, min_amount, max_uses, used_count, valid_until, description')
      .eq('is_active', true)
      .is('target_user_id', null)
      .or(`valid_until.is.null,valid_until.gt.${now}`),
  ])

  const usedIds = new Set((usedCoupons ?? []).map((u: any) => u.coupons?.code))
  const allActive = [...(personalCoupons ?? []), ...(publicCoupons ?? [])]
  const deduped = Array.from(new Map(allActive.map(c => [c.id, c])).values())
  const available = deduped.filter((c: any) => {
    if (usedIds.has(c.code)) return false
    if (c.max_uses && c.used_count >= c.max_uses) return false
    return true
  })

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-6">
          <Hexagon color="amber" size={16} />
          <h1 className="text-2xl font-bold text-brand-ink">내 쿠폰</h1>
        </div>

        {/* 사용 가능한 쿠폰 */}
        <section className="mb-8">
          <h2 className="text-sm font-semibold text-brand-grey uppercase tracking-wider mb-3">
            사용 가능 <span className="text-brand-amber">({available.length})</span>
          </h2>
          {available.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-brand-mist/30">
              <Tag size={28} className="text-brand-mist mx-auto mb-3" />
              <p className="text-brand-grey text-sm">사용 가능한 쿠폰이 없습니다</p>
              <p className="text-xs text-brand-grey mt-1">예약 시 쿠폰 코드를 직접 입력할 수도 있어요</p>
            </div>
          ) : (
            <div className="space-y-3">
              {available.map((c: any) => (
                <div key={c.id}
                  className="bg-white rounded-2xl overflow-hidden shadow-sm border border-brand-amber/30">
                  <div className="flex">
                    <div className="w-24 flex-shrink-0 bg-brand-amber/10 flex items-center justify-center px-3">
                      <div className="text-center">
                        <p className="text-lg font-bold text-brand-amber">
                          {c.type === 'fixed' ? formatPrice(c.value) : `${c.value}%`}
                        </p>
                        <p className="text-xs text-brand-amber/70">할인</p>
                      </div>
                    </div>
                    <div className="flex-1 p-4">
                      <p className="font-mono font-bold text-brand-ink text-sm tracking-wider">{c.code}</p>
                      {c.description && <p className="text-xs text-brand-grey mt-0.5">{c.description}</p>}
                      <div className="flex items-center gap-3 mt-2 text-xs text-brand-grey">
                        {c.min_amount > 0 && <span>{formatPrice(c.min_amount)} 이상 구매 시</span>}
                        {c.valid_until && (
                          <span>~{new Date(c.valid_until).toLocaleDateString('ko-KR')} 까지</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* 사용 내역 */}
        <section>
          <h2 className="text-sm font-semibold text-brand-grey uppercase tracking-wider mb-3">
            사용 내역 ({(usedCoupons ?? []).length})
          </h2>
          {!usedCoupons || usedCoupons.length === 0 ? (
            <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-brand-mist/30">
              <p className="text-brand-grey text-sm">쿠폰 사용 내역이 없습니다</p>
            </div>
          ) : (
            <div className="space-y-3">
              {usedCoupons.map((u: any) => (
                <div key={u.id}
                  className="bg-white rounded-2xl p-4 shadow-sm border border-brand-mist/30 flex items-center gap-3 opacity-70">
                  <CheckCircle size={18} className="text-green-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-mono font-semibold text-brand-ink text-sm">{u.coupons?.code}</p>
                    {u.coupons?.description && (
                      <p className="text-xs text-brand-grey mt-0.5">{u.coupons.description}</p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-brand-deep">-{formatPrice(u.discount_amount)}</p>
                    <p className="text-xs text-brand-grey mt-0.5">
                      {new Date(u.used_at).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
