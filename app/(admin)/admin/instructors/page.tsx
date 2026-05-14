import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Hexagon from '@/components/brand/Hexagon'
import InstructorApprovalList from './InstructorApprovalList'
import InstructorFeatureList from './InstructorFeatureList'

export default async function AdminInstructorsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: u } = await supabase.from('users').select('role').eq('id', user.id).single()
  const role = u?.role ?? ''
  if (!['admin', 'branch_manager'].includes(role)) redirect('/')

  // 지부장이면 자신의 지부 ID만 조회
  let branchId: string | null = null
  if (role === 'branch_manager') {
    const { data: branch } = await supabase
      .from('branches')
      .select('id')
      .eq('manager_id', user.id)
      .maybeSingle()
    branchId = branch?.id ?? null
  }

  const pendingQ = supabase
    .from('instructor_profiles')
    .select('*, users!instructor_id(name, email)')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
  if (branchId) pendingQ.eq('branch_id', branchId)
  const { data: pending } = await pendingQ

  const approvedQ = supabase
    .from('instructor_profiles')
    .select('*, users!instructor_id(name, email)')
    .eq('status', 'approved')
    .order('approved_at', { ascending: false })
  if (branchId) approvedQ.eq('branch_id', branchId)
  const { data: approved } = await approvedQ

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-2">
          <Hexagon color="amber" size={16} />
          <span className="text-xs font-medium text-brand-amber uppercase tracking-wider">Admin</span>
        </div>
        <h1 className="text-2xl font-bold text-brand-ink mb-4">강사 관리</h1>
        {role === 'branch_manager' && !branchId && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 mb-6 text-sm text-yellow-700">
            ⚠️ 아직 배정된 지부가 없습니다. 관리자에게 지부 배정을 요청해주세요.
          </div>
        )}
        {role === 'branch_manager' && branchId && (
          <div className="bg-brand-deep/5 border border-brand-deep/10 rounded-xl px-4 py-2.5 mb-6 text-sm text-brand-deep">
            내 지부 강사만 표시됩니다
          </div>
        )}

        {/* 신청 대기 */}
        {pending && pending.length > 0 && (
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-sm font-semibold text-brand-ink">승인 대기</span>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-600">{pending.length}건</span>
            </div>
            <InstructorApprovalList profiles={pending as any} mode="pending" />
          </div>
        )}

        {(!pending || pending.length === 0) && (
          <div className="bg-white rounded-2xl p-6 text-center shadow-sm border border-brand-mist/30 mb-10">
            <div className="text-2xl mb-1">✅</div>
            <p className="text-brand-grey text-sm">대기 중인 강사 신청이 없습니다</p>
          </div>
        )}

        {/* 강사소개 노출 관리 */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-brand-ink">강사소개 관리</span>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-brand-deep/10 text-brand-deep">
              {approved?.length ?? 0}명
            </span>
          </div>
          <p className="text-xs text-brand-grey mb-4">승인된 강사의 강사소개 페이지 노출 여부를 관리합니다</p>
          {approved && approved.length > 0 ? (
            <InstructorFeatureList profiles={approved as any} />
          ) : (
            <p className="text-brand-grey text-sm">승인된 강사가 없습니다</p>
          )}
        </div>
      </div>
    </div>
  )
}
