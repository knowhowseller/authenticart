import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Hexagon from '@/components/brand/Hexagon'
import { ChevronLeft } from 'lucide-react'

export default async function NoticeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: notice } = await supabase
    .from('notices')
    .select('id, title, content, created_at, updated_at, is_pinned')
    .eq('id', id)
    .eq('is_published', true)
    .single()

  if (!notice) notFound()

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <Link href="/notices" className="inline-flex items-center gap-1 text-sm text-brand-grey hover:text-brand-deep mb-6">
          <ChevronLeft size={14} />
          공지사항 목록
        </Link>

        <div className="bg-white rounded-2xl p-8 shadow-sm border border-brand-mist/30">
          <div className="flex items-center gap-2 mb-2">
            <Hexagon color="amber" size={14} />
            <span className="text-xs font-medium text-brand-amber uppercase tracking-wider">공지사항</span>
          </div>
          <h1 className="text-xl font-bold text-brand-ink mb-2">{notice.title}</h1>
          <p className="text-xs text-brand-grey mb-8">
            {new Date(notice.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })}
            {notice.updated_at !== notice.created_at && (
              <span className="ml-2">(수정됨: {new Date(notice.updated_at).toLocaleDateString('ko-KR')})</span>
            )}
          </p>
          <div className="text-sm text-brand-ink leading-relaxed whitespace-pre-wrap">
            {notice.content}
          </div>
        </div>
      </div>
    </div>
  )
}
