import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import Hexagon from '@/components/brand/Hexagon'
import { Pin } from 'lucide-react'

export default async function NoticesPage() {
  const supabase = await createClient()
  const { data: notices } = await supabase
    .from('notices')
    .select('id, title, is_pinned, created_at')
    .eq('is_published', true)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="flex items-center gap-2 mb-2">
          <Hexagon color="amber" size={16} />
          <span className="text-xs font-medium text-brand-amber uppercase tracking-wider">공지사항</span>
        </div>
        <h1 className="text-2xl font-bold text-brand-ink mb-8">공지사항</h1>

        {!notices || notices.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border border-brand-mist/30">
            <p className="text-brand-grey">공지사항이 없습니다</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-brand-mist/30 overflow-hidden">
            {notices.map((n, i) => (
              <Link
                key={n.id}
                href={`/notices/${n.id}`}
                className={`flex items-center justify-between px-6 py-4 hover:bg-brand-bg/50 transition-colors ${i > 0 ? 'border-t border-brand-mist/20' : ''}`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  {n.is_pinned && <Pin size={12} className="text-brand-deep flex-shrink-0" />}
                  <span className={`text-sm truncate ${n.is_pinned ? 'font-semibold text-brand-ink' : 'text-brand-ink'}`}>
                    {n.title}
                  </span>
                </div>
                <span className="text-xs text-brand-grey flex-shrink-0 ml-4">
                  {new Date(n.created_at).toLocaleDateString('ko-KR')}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
