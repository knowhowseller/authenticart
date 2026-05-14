import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatPrice } from '@/lib/utils/format'
import Hexagon from '@/components/brand/Hexagon'
import ClassApprovalList from './ClassApprovalList'

export default async function AdminClassesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const { data: u } = await supabase.from('users').select('role').eq('id', user.id).single()
  const role = u?.role ?? ''
  if (!['admin', 'branch_manager'].includes(role)) redirect('/')

  let branchId: string | null = null
  if (role === 'branch_manager') {
    const { data: branch } = await supabase
      .from('branches').select('id').eq('manager_id', user.id).maybeSingle()
    branchId = branch?.id ?? null
  }

  const draftsQ = supabase
    .from('classes')
    .select('id, title, region, price, description, thumbnail_url, created_at, instructor_id, users!instructor_id(name)')
    .eq('status', 'draft')
    .order('created_at', { ascending: true })
  if (branchId) draftsQ.eq('branch_id', branchId)
  const { data: draftsRaw } = await draftsQ
  const drafts = draftsRaw as any[]

  const publishedQ = supabase
    .from('classes')
    .select('id, title, region, price, status, created_at, users!instructor_id(name)')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(20)
  if (branchId) publishedQ.eq('branch_id', branchId)
  const { data: publishedRaw } = await publishedQ
  const published = publishedRaw as any[]

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-2">
          <Hexagon color="amber" size={16} />
          <span className="text-xs font-medium text-brand-amber uppercase tracking-wider">Admin</span>
        </div>
        <h1 className="text-2xl font-bold text-brand-ink mb-4">클래스 검수</h1>
        {role === 'branch_manager' && !branchId && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 mb-6 text-sm text-yellow-700">
            ⚠️ 아직 배정된 지부가 없습니다. 관리자에게 지부 배정을 요청해주세요.
          </div>
        )}
        {role === 'branch_manager' && branchId && (
          <div className="bg-brand-deep/5 border border-brand-deep/10 rounded-xl px-4 py-2.5 mb-6 text-sm text-brand-deep">
            내 지부 클래스만 표시됩니다
          </div>
        )}

        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm font-semibold text-brand-ink">검수 대기</span>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-600">
              {drafts?.length ?? 0}건
            </span>
          </div>
          {drafts && drafts.length > 0 ? (
            <ClassApprovalList classes={drafts as any} mode="draft" />
          ) : (
            <div className="bg-white rounded-2xl p-8 text-center shadow-sm border border-brand-mist/30">
              <div className="text-3xl mb-2">✅</div>
              <p className="text-brand-grey text-sm">검수 대기 중인 클래스가 없습니다</p>
            </div>
          )}
        </div>

        <div>
          <p className="text-sm font-semibold text-brand-ink mb-4">최근 게시 클래스</p>
          {published && published.length > 0 ? (
            <ClassApprovalList classes={published as any} mode="published" />
          ) : (
            <p className="text-brand-grey text-sm">없음</p>
          )}
        </div>
      </div>
    </div>
  )
}
