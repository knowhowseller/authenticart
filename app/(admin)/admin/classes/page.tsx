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
  if (u?.role !== 'admin') redirect('/')

  const { data: draftsRaw } = await supabase
    .from('classes')
    .select('id, title, region, price, description, created_at, instructor_id, users!instructor_id(name)')
    .eq('status', 'draft')
    .order('created_at', { ascending: true })
  const drafts = draftsRaw as any[]

  const { data: publishedRaw } = await supabase
    .from('classes')
    .select('id, title, region, price, status, created_at, users!instructor_id(name)')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(20)
  const published = publishedRaw as any[]

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-2">
          <Hexagon color="amber" size={16} />
          <span className="text-xs font-medium text-brand-amber uppercase tracking-wider">Admin</span>
        </div>
        <h1 className="text-2xl font-bold text-brand-ink mb-8">클래스 검수</h1>

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
