import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { formatPrice } from '@/lib/utils/format'
import Button from '@/components/ui/Button'
import Hexagon from '@/components/brand/Hexagon'

const statusLabel: Record<string, { label: string; color: string }> = {
  draft:     { label: '검수 대기', color: 'bg-yellow-50 text-yellow-600' },
  published: { label: '게시 중', color: 'bg-green-50 text-green-600' },
  closed:    { label: '마감됨', color: 'bg-brand-bg text-brand-grey' },
}

export default async function StudioClassesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: classes } = await supabase
    .from('classes')
    .select('id, title, region, price, status, confirmation_mode, created_at')
    .eq('instructor_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-brand-ink">내 클래스</h1>
            <p className="text-brand-grey text-sm mt-0.5">클래스를 등록하고 관리하세요</p>
          </div>
          <Link href="/studio/classes/new">
            <Button variant="accent" size="md">새 클래스 등록</Button>
          </Link>
        </div>

        {!classes || classes.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-brand-mist/30">
            <div className="text-4xl mb-3">🎨</div>
            <p className="text-brand-grey mb-3">등록한 클래스가 없습니다</p>
            <Link href="/studio/classes/new">
              <Button variant="primary" size="md">첫 클래스 등록하기</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {classes.map((cls: any) => {
              const s = statusLabel[cls.status] ?? { label: cls.status, color: '' }
              return (
                <div key={cls.id} className="bg-white rounded-2xl p-5 shadow-sm border border-brand-mist/30 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <Hexagon color={cls.status === 'published' ? 'amber' : 'sage'} size={18} />
                    <div className="min-w-0">
                      <h3 className="font-semibold text-brand-ink truncate">{cls.title}</h3>
                      <p className="text-xs text-brand-grey mt-0.5">
                        {cls.region} · {formatPrice(cls.price)} ·{' '}
                        {cls.confirmation_mode === 'instant' ? '바로 결제' : '강사 승인'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${s.color}`}>{s.label}</span>
                    <Link href={`/studio/classes/${cls.id}/edit`} className="text-xs text-brand-deep hover:underline">
                      수정
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
