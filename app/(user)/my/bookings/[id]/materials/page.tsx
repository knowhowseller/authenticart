import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatPrice } from '@/lib/utils/format'

export const metadata = { title: '준비물 구매 | 오센틱아트' }

export default async function BookingMaterialsPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect(`/login?redirect=/my/bookings/${id}/materials`)

  const { data: booking } = await supabase
    .from('bookings')
    .select(`
      id, status, student_id,
      class_schedules!schedule_id(
        class_id,
        classes!class_id(id, title)
      )
    `)
    .eq('id', id)
    .single()

  if (!booking || (booking as any).student_id !== user.id) redirect('/my/bookings')
  if ((booking as any).status !== 'paid') redirect('/my/bookings')

  const classId = (booking as any).class_schedules?.class_id
  const classTitle = (booking as any).class_schedules?.classes?.title ?? '클래스'

  const { data: materials } = await supabase
    .from('class_materials')
    .select('id, note, sort_order, products!product_id(id, name, retail_price, thumbnail_url, is_active)')
    .eq('class_id', classId)
    .order('sort_order')

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link
          href="/my/bookings"
          className="inline-flex items-center gap-1 text-sm text-brand-grey hover:text-brand-ink mb-4"
        >
          ← 예약 목록
        </Link>
        <h1 className="text-2xl font-bold text-brand-ink mt-2 mb-1">준비물 구매</h1>
        <p className="text-sm text-brand-grey mb-6">
          <strong className="text-brand-deep">{classTitle}</strong> 준비물 목록
        </p>

        {(!materials || materials.length === 0) ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-brand-mist/30">
            <div className="text-4xl mb-3">📦</div>
            <p className="text-brand-grey text-sm">등록된 준비물이 없습니다</p>
            <p className="text-xs text-brand-grey mt-1">
              강사가 준비물을 등록하면 여기서 구매할 수 있습니다
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {(materials as any[]).map((m, i) => {
              const p = m.products
              return (
                <div key={m.id} className="bg-white rounded-2xl p-5 shadow-sm border border-brand-mist/30">
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-brand-grey w-5 flex-shrink-0 text-center">{i + 1}</span>
                    {p?.thumbnail_url ? (
                      <img
                        src={p.thumbnail_url}
                        alt=""
                        className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-brand-bg flex items-center justify-center flex-shrink-0 text-xl">
                        📦
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-brand-ink">{p?.name ?? '상품'}</p>
                      {m.note && (
                        <p className="text-xs text-brand-grey mt-0.5">{m.note}</p>
                      )}
                      <p className="text-sm font-bold text-brand-amber mt-1">
                        {formatPrice(p?.retail_price ?? 0)}
                      </p>
                    </div>
                    {p?.is_active ? (
                      <Link
                        href={`/shop/products/${p.id}`}
                        className="flex-shrink-0 px-4 py-2 bg-brand-deep text-white text-sm font-medium rounded-xl hover:bg-brand-deep/90 transition-colors"
                      >
                        구매하기
                      </Link>
                    ) : (
                      <span className="flex-shrink-0 px-4 py-2 bg-brand-bg text-brand-grey text-sm rounded-xl border border-brand-mist">
                        품절
                      </span>
                    )}
                  </div>
                </div>
              )
            })}

            <div className="bg-brand-amber/5 rounded-xl px-4 py-3 text-xs text-brand-grey">
              위 링크를 통해 오센틱아트 쇼핑몰에서 바로 구매하실 수 있습니다.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
