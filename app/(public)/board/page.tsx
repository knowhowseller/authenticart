import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import type { Metadata } from 'next'
import { Lock, Pin } from 'lucide-react'

export const metadata: Metadata = { title: '게시판' }

const TYPE_LABELS: Record<string, { label: string; color: string }> = {
  notice:         { label: '공지', color: 'bg-brand-deep/10 text-brand-deep' },
  free:           { label: '자유', color: 'bg-green-50 text-green-600' },
  inquiry:        { label: '1:1문의', color: 'bg-purple-50 text-purple-600' },
  class_request:  { label: '클래스요청', color: 'bg-orange-50 text-orange-500' },
  group_request:  { label: '단체출강', color: 'bg-brand-amber/10 text-brand-amber' },
}

const TABS = [
  { key: 'all',           label: '전체' },
  { key: 'notice',        label: '공지사항' },
  { key: 'free',          label: '자유게시판' },
  { key: 'inquiry',       label: '1:1 문의' },
  { key: 'class_request', label: '클래스 요청' },
  { key: 'group_request', label: '단체 출강 요청' },
]

export default async function BoardPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  let q = supabase
    .from('board_posts')
    .select('id, type, title, author_name, is_private, is_pinned, status, view_count, created_at')
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(50)

  if (tab && tab !== 'all') q = q.eq('type', tab)

  const { data: posts } = await q

  // 관리자 공지사항을 notices 테이블에서 함께 조회 (전체 탭 또는 공지 탭일 때)
  let adminNotices: { id: string; title: string; is_pinned: boolean; created_at: string; _source: 'notice' }[] = []
  if (!tab || tab === 'all' || tab === 'notice') {
    const { data: notices } = await supabase
      .from('notices')
      .select('id, title, is_pinned, created_at')
      .eq('is_published', true)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(20)
    adminNotices = (notices ?? []).map(n => ({ ...n, _source: 'notice' as const }))
  }

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-brand-ink">게시판</h1>
          {user && (
            <Link href="/board/new"
              className="px-4 py-2 bg-brand-deep text-white rounded-full text-sm font-medium hover:bg-brand-deep/90 transition-colors">
              글쓰기
            </Link>
          )}
        </div>

        {/* 탭 */}
        <div className="flex gap-1 flex-wrap mb-4">
          {TABS.map(t => (
            <Link key={t.key}
              href={t.key === 'all' ? '/board' : `/board?tab=${t.key}`}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                (t.key === 'all' && !tab) || t.key === tab
                  ? 'bg-brand-deep text-white'
                  : 'bg-white text-brand-grey border border-brand-mist hover:border-brand-deep/30'
              }`}
            >
              {t.label}
            </Link>
          ))}
        </div>

        {/* 단체 출강 별도 요청 버튼 */}
        <div className="bg-gradient-to-r from-brand-amber/10 to-brand-deep/5 rounded-2xl p-4 mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-brand-ink">학교·기관 단체 출강 신청</p>
            <p className="text-xs text-brand-grey mt-0.5">단체 클래스 전문 폼으로 빠르게 신청하세요</p>
          </div>
          <Link href="/group-request"
            className="px-4 py-2 bg-brand-amber text-brand-ink rounded-full text-sm font-medium hover:bg-brand-amber/90 transition-colors flex-shrink-0">
            출강 신청
          </Link>
        </div>

        {/* 게시글 목록 */}
        <div className="bg-white rounded-2xl shadow-sm border border-brand-mist/30 overflow-hidden">
          {(posts ?? []).length === 0 && adminNotices.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-brand-grey text-sm">게시글이 없습니다</p>
            </div>
          ) : (
            <div className="divide-y divide-brand-mist/20">
              {/* 관리자 공지 (notices 테이블) */}
              {adminNotices.map(n => (
                <Link key={`notice-${n.id}`} href={`/notices/${n.id}`}
                  className="flex items-center gap-3 px-5 py-3.5 hover:bg-brand-bg/50 transition-colors bg-brand-amber/5">
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 bg-brand-deep/10 text-brand-deep">
                    공지
                  </span>
                  <div className="flex-1 min-w-0 flex items-center gap-2">
                    {n.is_pinned && <Pin size={12} className="text-brand-amber flex-shrink-0" />}
                    <span className="text-sm text-brand-ink truncate font-medium">{n.title}</span>
                  </div>
                  <div className="text-xs text-brand-grey flex-shrink-0 hidden md:flex items-center gap-3">
                    <span>오센틱아트</span>
                    <span>{new Date(n.created_at).toLocaleDateString('ko-KR')}</span>
                  </div>
                </Link>
              ))}
              {/* 게시판 일반 게시글 */}
              {(posts ?? []).map((p: any) => {
                const typeInfo = TYPE_LABELS[p.type]
                return (
                  <Link key={p.id} href={`/board/${p.id}`}
                    className="flex items-center gap-3 px-5 py-3.5 hover:bg-brand-bg/50 transition-colors">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${typeInfo?.color ?? 'bg-brand-bg text-brand-grey'}`}>
                      {typeInfo?.label ?? p.type}
                    </span>
                    <div className="flex-1 min-w-0 flex items-center gap-2">
                      {p.is_pinned && <Pin size={12} className="text-brand-amber flex-shrink-0" />}
                      <span className="text-sm text-brand-ink truncate">{p.title}</span>
                      {p.is_private && <Lock size={12} className="text-brand-grey flex-shrink-0" />}
                    </div>
                    <div className="text-xs text-brand-grey flex-shrink-0 hidden md:flex items-center gap-3">
                      <span>{p.author_name}</span>
                      <span>{new Date(p.created_at).toLocaleDateString('ko-KR')}</span>
                      <span>조회 {p.view_count}</span>
                    </div>
                    {p.status === 'closed' && (
                      <span className="text-[10px] bg-brand-bg text-brand-grey px-2 py-0.5 rounded-full flex-shrink-0">완료</span>
                    )}
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {!user && (
          <p className="text-center text-sm text-brand-grey mt-6">
            <Link href="/login" className="text-brand-deep hover:underline">로그인</Link> 후 글을 작성할 수 있습니다
          </p>
        )}
      </div>
    </div>
  )
}
