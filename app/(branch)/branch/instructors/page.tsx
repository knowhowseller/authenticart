import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Hexagon from '@/components/brand/Hexagon'

const statusLabel: Record<string, { label: string; color: string }> = {
  pending:  { label: '심사 중', color: 'bg-yellow-50 text-yellow-600' },
  approved: { label: '승인됨', color: 'bg-green-50 text-green-600' },
  rejected: { label: '반려됨', color: 'bg-red-50 text-red-500' },
}

export default async function BranchInstructorsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: userData } = await supabase.from('users').select('role').eq('id', user.id).single()
  if (!['branch_manager', 'admin'].includes(userData?.role ?? '')) redirect('/')

  const { data: branch } = await supabase
    .from('branches')
    .select('id, name, region')
    .eq('manager_id', user.id)
    .single()

  if (!branch) redirect('/branch')

  const { data: instructors } = await supabase
    .from('instructor_profiles')
    .select(`
      id, status, created_at,
      users!instructor_id(id, name, email, phone, region)
    `)
    .eq('branch_id', branch.id)
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-2">
          <Hexagon color="amber" size={16} />
          <span className="text-xs font-medium text-brand-amber uppercase tracking-wider">Branch</span>
        </div>
        <div className="flex items-center gap-2 mb-6">
          <Link href="/branch" className="text-sm text-brand-grey hover:text-brand-ink">← 대시보드</Link>
        </div>
        <h1 className="text-2xl font-bold text-brand-ink mb-1">강사 관리</h1>
        <p className="text-brand-grey text-sm mb-6">{branch.name} ({branch.region}) 소속 강사</p>

        {!instructors || instructors.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-brand-mist/30">
            <div className="text-4xl mb-3">👩‍🎨</div>
            <p className="text-brand-grey">소속 강사가 없습니다</p>
          </div>
        ) : (
          <div className="space-y-3">
            {instructors.map((inst: any) => {
              const s = statusLabel[inst.status] ?? { label: inst.status, color: '' }
              const u = inst.users
              return (
                <div key={inst.id} className="bg-white rounded-2xl p-5 shadow-sm border border-brand-mist/30">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-brand-ink">{u?.name}</p>
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${s.color}`}>{s.label}</span>
                      </div>
                      <p className="text-xs text-brand-grey">{u?.email}</p>
                      {u?.phone && <p className="text-xs text-brand-grey mt-0.5">{u.phone}</p>}
                      {u?.region && <p className="text-xs text-brand-grey mt-0.5">활동 지역: {u.region}</p>}
                      <p className="text-xs text-brand-grey mt-1">
                        신청일: {new Date(inst.created_at).toLocaleDateString('ko-KR')}
                      </p>
                    </div>
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
